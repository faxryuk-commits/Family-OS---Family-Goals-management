"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { detectConflicts } from "./conflicts";

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
      ownerId: input.ownerId,
      familyId: input.familyId,
      status: "DRAFT",
    },
    include: { owner: true },
  });

  // Проверяем конфликты с другими целями
  await detectConflicts(goal.id, input.familyId);

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
  const goal = await db.goal.update({
    where: { id: goalId },
    data: { 
      progress: Math.min(100, Math.max(0, progress)),
      status: progress >= 100 ? "COMPLETED" : undefined,
    },
  });

  revalidatePath("/");
  return goal;
}

export async function deleteGoal(goalId: string) {
  await db.goal.delete({
    where: { id: goalId },
  });

  revalidatePath("/");
}

export async function getGoalsByFamily(familyId: string) {
  return db.goal.findMany({
    where: { familyId },
    include: { owner: true },
    orderBy: { createdAt: "desc" },
  });
}
