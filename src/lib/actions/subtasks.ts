"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Создать подзадачу
export async function createSubtask(goalId: string, title: string, description?: string) {
  // Получаем максимальный order
  const maxOrder = await db.subtask.aggregate({
    where: { goalId },
    _max: { order: true },
  });

  const subtask = await db.subtask.create({
    data: {
      goalId,
      title,
      description,
      order: (maxOrder._max.order || 0) + 1,
    },
  });

  revalidatePath("/");
  return subtask;
}

// Обновить подзадачу
export async function updateSubtask(subtaskId: string, data: { title?: string; description?: string }) {
  const subtask = await db.subtask.update({
    where: { id: subtaskId },
    data,
  });

  revalidatePath("/");
  return subtask;
}

// Удалить подзадачу
export async function deleteSubtask(subtaskId: string) {
  await db.subtask.delete({
    where: { id: subtaskId },
  });

  revalidatePath("/");
}

// Отметить подзадачу выполненной (в рамках check-in)
export async function completeSubtask(subtaskId: string, checkInId: string) {
  const subtask = await db.subtask.update({
    where: { id: subtaskId },
    data: {
      completed: true,
      completedAt: new Date(),
      completedInCheckInId: checkInId,
    },
    include: { goal: true },
  });

  // Пересчитываем прогресс цели
  await recalculateGoalProgress(subtask.goalId);

  revalidatePath("/");
  return subtask;
}

// Отменить выполнение подзадачи
export async function uncompleteSubtask(subtaskId: string) {
  const subtask = await db.subtask.update({
    where: { id: subtaskId },
    data: {
      completed: false,
      completedAt: null,
      completedInCheckInId: null,
    },
    include: { goal: true },
  });

  // Пересчитываем прогресс цели
  await recalculateGoalProgress(subtask.goalId);

  revalidatePath("/");
  return subtask;
}

// Пересчитать прогресс цели на основе подзадач
export async function recalculateGoalProgress(goalId: string) {
  const subtasks = await db.subtask.findMany({
    where: { goalId },
  });

  if (subtasks.length === 0) {
    return; // Нет подзадач - прогресс не меняем
  }

  const completedCount = subtasks.filter((s) => s.completed).length;
  const progress = Math.round((completedCount / subtasks.length) * 100);

  await db.goal.update({
    where: { id: goalId },
    data: {
      progress,
      status: progress === 100 ? "COMPLETED" : undefined,
    },
  });
}

// Получить подзадачи цели
export async function getSubtasks(goalId: string) {
  return db.subtask.findMany({
    where: { goalId },
    orderBy: { order: "asc" },
    include: {
      completedInCheckIn: {
        include: { user: true },
      },
    },
  });
}

// Создать несколько подзадач сразу
export async function createSubtasks(goalId: string, titles: string[]) {
  const maxOrder = await db.subtask.aggregate({
    where: { goalId },
    _max: { order: true },
  });

  let order = (maxOrder._max.order || 0) + 1;

  const subtasks = await db.subtask.createMany({
    data: titles.map((title) => ({
      goalId,
      title,
      order: order++,
    })),
  });

  revalidatePath("/");
  return subtasks;
}
