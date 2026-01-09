"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentWeek } from "@/lib/utils";
import { recalculateGoalProgress } from "./subtasks";

export { getCurrentWeek };

export type CreateCheckInInput = {
  userId: string;
  familyId: string;
  notes?: string;
  blockers?: string;
  wins?: string;
  completedSubtaskIds?: string[]; // Подзадачи, выполненные в этом check-in
  goalComments?: { goalId: string; comment: string }[]; // Комментарии по целям
};

export async function createCheckIn(input: CreateCheckInInput) {
  const week = getCurrentWeek();

  // Проверяем, есть ли уже check-in за эту неделю
  const existing = await db.checkIn.findFirst({
    where: {
      userId: input.userId,
      familyId: input.familyId,
      week,
    },
  });

  let checkIn;

  if (existing) {
    // Обновляем существующий
    checkIn = await db.checkIn.update({
      where: { id: existing.id },
      data: {
        notes: input.notes,
        blockers: input.blockers,
        wins: input.wins,
      },
    });
  } else {
    // Создаём новый
    checkIn = await db.checkIn.create({
      data: {
        week,
        userId: input.userId,
        familyId: input.familyId,
        notes: input.notes,
        blockers: input.blockers,
        wins: input.wins,
      },
    });
  }

  // Отмечаем подзадачи выполненными
  if (input.completedSubtaskIds && input.completedSubtaskIds.length > 0) {
    // Получаем подзадачи чтобы узнать goalId для пересчёта
    const subtasks = await db.subtask.findMany({
      where: { id: { in: input.completedSubtaskIds } },
    });

    await db.subtask.updateMany({
      where: { id: { in: input.completedSubtaskIds } },
      data: {
        completed: true,
        completedAt: new Date(),
        completedInCheckInId: checkIn.id,
      },
    });

    // Пересчитываем прогресс для каждой затронутой цели
    const goalIds = [...new Set(subtasks.map((s) => s.goalId))];
    for (const goalId of goalIds) {
      await recalculateGoalProgress(goalId);
    }
  }

  // Добавляем комментарии по целям
  if (input.goalComments && input.goalComments.length > 0) {
    for (const gc of input.goalComments) {
      await db.checkInProgress.upsert({
        where: {
          checkInId_goalId: {
            checkInId: checkIn.id,
            goalId: gc.goalId,
          },
        },
        create: {
          checkInId: checkIn.id,
          goalId: gc.goalId,
          comment: gc.comment,
        },
        update: {
          comment: gc.comment,
        },
      });
    }
  }

  revalidatePath("/");
  return checkIn;
}

// Получить или создать check-in за текущую неделю
export async function getOrCreateCurrentCheckIn(userId: string, familyId: string) {
  const week = getCurrentWeek();

  let checkIn = await db.checkIn.findFirst({
    where: { userId, familyId, week },
    include: {
      goalProgress: true,
      completedSubtasks: true,
    },
  });

  if (!checkIn) {
    checkIn = await db.checkIn.create({
      data: { userId, familyId, week },
      include: {
        goalProgress: true,
        completedSubtasks: true,
      },
    });
  }

  return checkIn;
}

export async function getCheckInsForFamily(familyId: string) {
  return db.checkIn.findMany({
    where: { familyId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function getCheckInsForWeek(familyId: string, week?: string) {
  const targetWeek = week || getCurrentWeek();
  
  return db.checkIn.findMany({
    where: { 
      familyId,
      week: targetWeek,
    },
    include: { user: true },
  });
}

export async function hasCheckedInThisWeek(userId: string, familyId: string): Promise<boolean> {
  const week = getCurrentWeek();
  const checkIn = await db.checkIn.findFirst({
    where: {
      userId,
      familyId,
      week,
    },
  });
  return !!checkIn;
}
