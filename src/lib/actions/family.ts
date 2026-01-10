"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Получить семью пользователя (с геймификацией)
export async function getUserFamily(userId: string) {
  const membership = await db.familyMember.findFirst({
    where: { userId },
    include: {
      family: {
        include: {
          members: {
            include: { 
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  image: true,
                  createdAt: true,
                  updatedAt: true,
                  // Gamification fields
                  level: true,
                  xp: true,
                  streak: true,
                  longestStreak: true,
                  goalsCompleted: true,
                  subtasksCompleted: true,
                },
              },
            },
          },
          goals: {
            include: { 
              owner: true,
              subtasks: { orderBy: { order: "asc" } },
              comments: {
                include: {
                  author: {
                    select: {
                      id: true,
                      name: true,
                      image: true,
                      level: true,
                    },
                  },
                },
                orderBy: { createdAt: "desc" },
                take: 3, // Показываем последние 3 комментария
              },
              _count: {
                select: { comments: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          conflicts: {
            where: { status: "UNRESOLVED" },
            include: {
              goalA: { include: { owner: true } },
              goalB: { include: { owner: true } },
            },
          },
          checkIns: {
            include: { 
              user: true,
              goalProgress: true,
              completedSubtasks: true,
            },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
          agreements: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  return membership?.family || null;
}

// Создать новую семью
export async function createFamily(data: {
  name: string;
  northStar?: string;
  creatorId: string;
}) {
  const family = await db.family.create({
    data: {
      name: data.name,
      northStar: data.northStar,
      members: {
        create: {
          userId: data.creatorId,
          role: "ADULT",
        },
      },
    },
    include: {
      members: {
        include: { user: true },
      },
    },
  });

  revalidatePath("/");
  return family;
}

// Генерация кода приглашения
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Создать приглашение в семью
export async function createInvite(familyId: string, createdBy: string) {
  // Проверяем, что пользователь в этой семье
  const membership = await db.familyMember.findFirst({
    where: { familyId, userId: createdBy },
  });

  if (!membership) {
    throw new Error("Вы не являетесь членом этой семьи");
  }

  // Создаём приглашение (действует 7 дней)
  const invite = await db.invite.create({
    data: {
      code: generateInviteCode(),
      familyId,
      createdBy,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return invite;
}

// Присоединиться к семье по коду
export async function joinFamilyByInvite(code: string, userId: string) {
  // Находим приглашение
  const invite = await db.invite.findUnique({
    where: { code: code.toUpperCase() },
    include: { family: true },
  });

  if (!invite) {
    return null;
  }

  // Проверяем срок действия
  if (invite.expiresAt < new Date()) {
    return null;
  }

  // Проверяем, не использовано ли уже
  if (invite.usedAt) {
    return null;
  }

  // Проверяем, не состоит ли уже в семье
  const existingMembership = await db.familyMember.findFirst({
    where: { familyId: invite.familyId, userId },
  });

  if (existingMembership) {
    return invite.family;
  }

  // Добавляем в семью и помечаем приглашение использованным
  await db.$transaction([
    db.familyMember.create({
      data: {
        familyId: invite.familyId,
        userId,
        role: "PARTNER",
      },
    }),
    db.invite.update({
      where: { id: invite.id },
      data: {
        usedAt: new Date(),
        usedBy: userId,
      },
    }),
  ]);

  revalidatePath("/");
  return invite.family;
}

// Получить все приглашения семьи
export async function getFamilyInvites(familyId: string) {
  return db.invite.findMany({
    where: { 
      familyId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Старые функции для совместимости

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
      checkIns: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      agreements: {
        orderBy: { createdAt: "desc" },
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

// Для демо (если нужно)
export async function createDemoFamily() {
  const existingFamily = await db.family.findFirst({
    where: { name: "Демо Семья" },
  });

  if (existingFamily) {
    return existingFamily;
  }

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
