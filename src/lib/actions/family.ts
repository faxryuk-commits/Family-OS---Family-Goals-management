"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Для MVP: создаём демо-семью и пользователей
export async function createDemoFamily() {
  // Проверяем, есть ли уже демо-семья
  const existingFamily = await db.family.findFirst({
    where: { name: "Демо Семья" },
  });

  if (existingFamily) {
    return existingFamily;
  }

  // Создаём демо-пользователей
  const husband = await db.user.upsert({
    where: { email: "husband@demo.com" },
    update: {},
    create: {
      email: "husband@demo.com",
      name: "Фахриддин",
    },
  });

  const wife = await db.user.upsert({
    where: { email: "wife@demo.com" },
    update: {},
    create: {
      email: "wife@demo.com",
      name: "Мадина",
    },
  });

  // Создаём семью
  const family = await db.family.create({
    data: {
      name: "Демо Семья",
      northStar: "Стабильная жизнь + рост + свобода выбора",
      members: {
        create: [
          { userId: husband.id, role: "ADULT" },
          { userId: wife.id, role: "PARTNER" },
        ],
      },
    },
    include: {
      members: {
        include: { user: true },
      },
    },
  });

  return family;
}

export async function getFamily() {
  const family = await db.family.findFirst({
    include: {
      members: {
        include: { user: true },
      },
      goals: {
        include: { owner: true },
        orderBy: { createdAt: "desc" },
      },
      conflicts: {
        where: { status: "UNRESOLVED" },
        include: {
          goalA: { include: { owner: true } },
          goalB: { include: { owner: true } },
        },
      },
    },
  });

  return family;
}

export async function updateNorthStar(familyId: string, northStar: string) {
  const family = await db.family.update({
    where: { id: familyId },
    data: { northStar },
  });

  revalidatePath("/");
  return family;
}
