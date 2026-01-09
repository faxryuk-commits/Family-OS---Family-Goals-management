"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentWeek } from "@/lib/utils";

export { getCurrentWeek };

export type CreateCheckInInput = {
  userId: string;
  familyId: string;
  notes?: string;
  blockers?: string;
  wins?: string;
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

  if (existing) {
    // Обновляем существующий
    const checkIn = await db.checkIn.update({
      where: { id: existing.id },
      data: {
        notes: input.notes,
        blockers: input.blockers,
        wins: input.wins,
      },
    });
    revalidatePath("/");
    return checkIn;
  }

  // Создаём новый
  const checkIn = await db.checkIn.create({
    data: {
      week,
      userId: input.userId,
      familyId: input.familyId,
      notes: input.notes,
      blockers: input.blockers,
      wins: input.wins,
    },
  });

  revalidatePath("/");
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
