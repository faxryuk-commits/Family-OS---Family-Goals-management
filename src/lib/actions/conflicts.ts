"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Детекция конфликтов между целями
export async function detectConflicts(newGoalId: string, familyId: string) {
  const newGoal = await db.goal.findUnique({
    where: { id: newGoalId },
  });

  if (!newGoal) return [];

  const newResources = JSON.parse(newGoal.resources || "[]") as string[];

  // Получаем все активные цели семьи (кроме новой)
  const otherGoals = await db.goal.findMany({
    where: {
      familyId,
      id: { not: newGoalId },
      status: { in: ["ACTIVE", "DRAFT"] },
    },
  });

  const conflicts = [];

  for (const otherGoal of otherGoals) {
    const otherResources = JSON.parse(otherGoal.resources || "[]") as string[];
    
    // Находим пересекающиеся ресурсы
    const sharedResources = newResources.filter(r => otherResources.includes(r));

    if (sharedResources.length === 0) continue;

    // Определяем тип конфликта
    let conflictType = "PRIORITY";

    // Прямой конфликт: GEO или и TIME и MONEY
    if (sharedResources.includes("GEO")) {
      conflictType = "DIRECT";
    } else if (sharedResources.includes("TIME") && sharedResources.includes("MONEY")) {
      conflictType = "RESOURCE";
    } else if (sharedResources.length >= 2) {
      conflictType = "RESOURCE";
    }

    // Проверяем, нет ли уже такого конфликта
    const existingConflict = await db.conflict.findFirst({
      where: {
        OR: [
          { goalAId: newGoalId, goalBId: otherGoal.id },
          { goalAId: otherGoal.id, goalBId: newGoalId },
        ],
      },
    });

    if (!existingConflict) {
      const conflict = await db.conflict.create({
        data: {
          type: conflictType,
          sharedResources: JSON.stringify(sharedResources),
          goalAId: newGoalId,
          goalBId: otherGoal.id,
          familyId,
        },
      });

      // Блокируем обе цели
      await db.goal.updateMany({
        where: { id: { in: [newGoalId, otherGoal.id] } },
        data: { status: "BLOCKED" },
      });

      conflicts.push(conflict);
    }
  }

  revalidatePath("/");
  return conflicts;
}

export async function getUnresolvedConflicts(familyId: string) {
  return db.conflict.findMany({
    where: {
      familyId,
      status: "UNRESOLVED",
    },
    include: {
      goalA: { include: { owner: true } },
      goalB: { include: { owner: true } },
    },
  });
}

export type ResolveConflictInput = {
  conflictId: string;
  strategy: string;
  description?: string;
  cost?: string;
  compensation?: string;
  reviewDate?: Date;
};

export async function resolveConflict(input: ResolveConflictInput) {
  const conflict = await db.conflict.findUnique({
    where: { id: input.conflictId },
    include: { goalA: true, goalB: true },
  });

  if (!conflict) throw new Error("Conflict not found");

  // Создаём решение
  await db.resolution.create({
    data: {
      conflictId: input.conflictId,
      strategy: input.strategy,
      description: input.description,
      cost: input.cost,
      compensation: input.compensation,
      reviewDate: input.reviewDate,
    },
  });

  // Обновляем статус конфликта
  await db.conflict.update({
    where: { id: input.conflictId },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
    },
  });

  // Обновляем статусы целей в зависимости от стратегии
  switch (input.strategy) {
    case "DROP":
      // Одна цель отменяется (goalB)
      await db.goal.update({
        where: { id: conflict.goalBId },
        data: { status: "DROPPED" },
      });
      await db.goal.update({
        where: { id: conflict.goalAId },
        data: { status: "ACTIVE" },
      });
      break;

    case "PRIORITY":
      // Одна цель на паузе (goalB)
      await db.goal.update({
        where: { id: conflict.goalBId },
        data: { status: "PAUSED" },
      });
      await db.goal.update({
        where: { id: conflict.goalAId },
        data: { status: "ACTIVE" },
      });
      break;

    case "SEQUENCE":
      // Первая активна, вторая ждёт
      await db.goal.update({
        where: { id: conflict.goalAId },
        data: { status: "ACTIVE" },
      });
      await db.goal.update({
        where: { id: conflict.goalBId },
        data: { status: "PAUSED" },
      });
      break;

    default:
      // COMPROMISE, TRANSFORM - обе активны
      await db.goal.updateMany({
        where: { id: { in: [conflict.goalAId, conflict.goalBId] } },
        data: { status: "ACTIVE" },
      });
  }

  // Создаём соглашение
  await db.agreement.create({
    data: {
      title: `Соглашение: ${conflict.goalA.title} ↔ ${conflict.goalB.title}`,
      terms: `Стратегия: ${input.strategy}. ${input.description || ""}`,
      validUntil: input.reviewDate,
      conflictId: input.conflictId,
      familyId: conflict.familyId,
    },
  });

  revalidatePath("/");
}
