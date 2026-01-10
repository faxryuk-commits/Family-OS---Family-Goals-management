"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { detectConflicts } from "./conflicts";
import { auth } from "@/auth";
import { recordGoalCompletion, addUserXp, checkAchievements } from "./gamification";
import { notifyGoalAssigned, notifyGoalCompleted } from "./notifications";

// Проверка что пользователь — владелец цели
async function verifyGoalOwner(goalId: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  const goal = await db.goal.findUnique({
    where: { id: goalId },
    select: { ownerId: true },
  });

  return goal?.ownerId === session.user.id;
}

export type CreateGoalInput = {
  title: string;
  description?: string;
  type: string;
  horizon: string;
  deadline?: Date;
  metric?: string;
  resources: string[];
  ownerId: string;
  familyId: string;
  subtasks?: string[]; // Названия подзадач
  assignedToId?: string; // Отметить члена семьи
  images?: string[]; // URL фотографий
};

export async function createGoal(input: CreateGoalInput) {
  const goal = await db.goal.create({
    data: {
      title: input.title,
      description: input.description,
      type: input.type,
      horizon: input.horizon,
      deadline: input.deadline,
      metric: input.metric,
      resources: JSON.stringify(input.resources),
      images: input.images?.length ? JSON.stringify(input.images) : null,
      ownerId: input.ownerId,
      familyId: input.familyId,
      assignedToId: input.assignedToId,
      status: "DRAFT",
      // Создаём подзадачи если переданы
      subtasks: input.subtasks?.length
        ? {
            create: input.subtasks.map((title, index) => ({
              title,
              order: index,
            })),
          }
        : undefined,
    },
    include: { 
      owner: true,
      assignedTo: true,
      subtasks: { orderBy: { order: "asc" } },
    },
  });

  // Проверяем конфликты с другими целями
  await detectConflicts(goal.id, input.familyId);

  // 🎮 GAMIFICATION: XP за создание цели
  await addUserXp(input.ownerId, 10, "Новая цель создана");
  await checkAchievements(input.ownerId);

  // 🔔 NOTIFICATION: Уведомить отмеченного пользователя
  if (input.assignedToId && goal.owner) {
    await notifyGoalAssigned({
      goalId: goal.id,
      goalTitle: goal.title,
      assignedToId: input.assignedToId,
      fromUserId: input.ownerId,
      fromUserName: goal.owner.name || "Кто-то",
      familyId: input.familyId,
    });
  }

  revalidatePath("/");
  return goal;
}

export async function updateGoalStatus(goalId: string, status: string) {
  const goal = await db.goal.update({
    where: { id: goalId },
    data: { status },
  });

  revalidatePath("/");
  return goal;
}

export async function updateGoalProgress(goalId: string, progress: number) {
  // Проверяем права
  const isOwner = await verifyGoalOwner(goalId);
  if (!isOwner) {
    throw new Error("Вы можете обновлять прогресс только своих целей");
  }

  // Получаем текущий статус цели
  const oldGoal = await db.goal.findUnique({ where: { id: goalId } });
  const wasCompleted = oldGoal?.status === "COMPLETED";
  const nowCompleted = progress >= 100;

  const goal = await db.goal.update({
    where: { id: goalId },
    data: { 
      progress: Math.min(100, Math.max(0, progress)),
      status: nowCompleted ? "COMPLETED" : oldGoal?.status,
    },
  });

  // 🎮 GAMIFICATION: Награда за выполнение цели
  if (nowCompleted && !wasCompleted && goal.ownerId) {
    await recordGoalCompletion(goal.ownerId);
    await checkAchievements(goal.ownerId);
  }

  revalidatePath("/");
  return goal;
}

export type UpdateGoalInput = {
  title?: string;
  description?: string;
  type?: string;
  horizon?: string;
  deadline?: Date | null;
  metric?: string;
  resources?: string[];
  status?: string;
  images?: string[]; // URL фотографий
};

export async function updateGoal(goalId: string, input: UpdateGoalInput) {
  // Проверяем права
  const isOwner = await verifyGoalOwner(goalId);
  if (!isOwner) {
    throw new Error("Вы можете редактировать только свои цели");
  }

  const goal = await db.goal.update({
    where: { id: goalId },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.type && { type: input.type }),
      ...(input.horizon && { horizon: input.horizon }),
      ...(input.deadline !== undefined && { deadline: input.deadline }),
      ...(input.metric !== undefined && { metric: input.metric }),
      ...(input.resources && { resources: JSON.stringify(input.resources) }),
      ...(input.status && { status: input.status }),
      ...(input.images !== undefined && { images: input.images.length ? JSON.stringify(input.images) : null }),
    },
    include: { owner: true },
  });

  // Если изменились ресурсы, перепроверяем конфликты
  if (input.resources) {
    await detectConflicts(goalId, goal.familyId);
  }

  revalidatePath("/");
  return goal;
}

export async function deleteGoal(goalId: string) {
  // Проверяем права
  const isOwner = await verifyGoalOwner(goalId);
  if (!isOwner) {
    throw new Error("Вы можете удалять только свои цели");
  }

  await db.goal.delete({
    where: { id: goalId },
  });

  revalidatePath("/");
}

export async function getGoalsByFamily(familyId: string) {
  return db.goal.findMany({
    where: { familyId },
    include: { 
      owner: true,
      subtasks: { orderBy: { order: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Получить цели пользователя с подзадачами
export async function getUserGoalsWithSubtasks(userId: string, familyId: string) {
  return db.goal.findMany({
    where: { 
      ownerId: userId,
      familyId,
      status: { in: ["ACTIVE", "DRAFT"] },
    },
    include: { 
      owner: true,
      subtasks: { orderBy: { order: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}
