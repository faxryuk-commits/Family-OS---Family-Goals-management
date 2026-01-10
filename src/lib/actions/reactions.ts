"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { ReactionEmoji, ReactionTarget } from "@/lib/reaction-types";

// Добавить/изменить реакцию
export async function toggleReaction({
  emoji,
  targetType,
  targetId,
}: {
  emoji: ReactionEmoji;
  targetType: ReactionTarget;
  targetId: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Необходима авторизация");
    }

    const userId = session.user.id;

    // Определяем поля для запроса в зависимости от типа
    const targetField = targetType === "GOAL" ? "goalId" : "checkInId";

    // Ищем существующую реакцию
    const existingReaction = await db.reaction.findFirst({
      where: {
        userId,
        [targetField]: targetId,
      },
    });

    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        // Та же реакция — удаляем
        await db.reaction.delete({
          where: { id: existingReaction.id },
        });
        revalidatePath("/");
        return { action: "removed", emoji };
      } else {
        // Другая реакция — обновляем
        await db.reaction.update({
          where: { id: existingReaction.id },
          data: { emoji },
        });
        revalidatePath("/");
        return { action: "changed", emoji, previousEmoji: existingReaction.emoji };
      }
    } else {
      // Новая реакция — создаём
      await db.reaction.create({
        data: {
          emoji,
          userId,
          [targetField]: targetId,
        },
      });
      revalidatePath("/");
      return { action: "added", emoji };
    }
  } catch (error) {
    console.error("Error toggling reaction:", error);
    throw new Error("Не удалось добавить реакцию. Попробуйте позже.");
  }
}

// Получить реакции для объекта
export async function getReactions({
  targetType,
  targetId,
}: {
  targetType: ReactionTarget;
  targetId: string;
}) {
  const targetField = targetType === "GOAL" ? "goalId" : "checkInId";

  const reactions = await db.reaction.findMany({
    where: {
      [targetField]: targetId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  // Группируем по эмодзи
  const grouped = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction.user);
    return acc;
  }, {} as Record<string, { id: string; name: string | null; image: string | null }[]>);

  return grouped;
}

// Получить мою реакцию на объект
export async function getMyReaction({
  targetType,
  targetId,
}: {
  targetType: ReactionTarget;
  targetId: string;
}): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const targetField = targetType === "GOAL" ? "goalId" : "checkInId";

  const reaction = await db.reaction.findFirst({
    where: {
      userId: session.user.id,
      [targetField]: targetId,
    },
  });

  return reaction?.emoji || null;
}
