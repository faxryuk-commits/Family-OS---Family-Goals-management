"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { notifyComment } from "./notifications";

// Создать комментарий
export async function createComment(goalId: string, text: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Необходимо авторизоваться");
  }

  // Проверяем, что пользователь в той же семье, что и цель
  const goal = await db.goal.findUnique({
    where: { id: goalId },
    select: { familyId: true, ownerId: true, title: true },
  });

  if (!goal) {
    throw new Error("Цель не найдена");
  }

  const membership = await db.familyMember.findFirst({
    where: {
      userId: session.user.id,
      familyId: goal.familyId,
    },
  });

  if (!membership) {
    throw new Error("Вы не являетесь членом этой семьи");
  }

  const comment = await db.comment.create({
    data: {
      text,
      authorId: session.user.id,
      goalId,
    },
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
  });

  // 🔔 NOTIFICATION: Уведомить владельца цели о комментарии
  if (goal.ownerId !== session.user.id) {
    await notifyComment({
      goalId,
      goalTitle: goal.title,
      goalOwnerId: goal.ownerId,
      fromUserId: session.user.id,
      fromUserName: comment.author.name || "Кто-то",
      commentText: text,
      familyId: goal.familyId,
    });
  }

  revalidatePath("/");
  return comment;
}

// Получить комментарии к цели
export async function getGoalComments(goalId: string) {
  const comments = await db.comment.findMany({
    where: { goalId },
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
    orderBy: { createdAt: "asc" },
  });

  return comments;
}

// Удалить комментарий (только автор)
export async function deleteComment(commentId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Необходимо авторизоваться");
  }

  const comment = await db.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new Error("Комментарий не найден");
  }

  if (comment.authorId !== session.user.id) {
    throw new Error("Можно удалять только свои комментарии");
  }

  await db.comment.delete({
    where: { id: commentId },
  });

  revalidatePath("/");
}

// Редактировать комментарий (только автор)
export async function updateComment(commentId: string, text: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Необходимо авторизоваться");
  }

  const comment = await db.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new Error("Комментарий не найден");
  }

  if (comment.authorId !== session.user.id) {
    throw new Error("Можно редактировать только свои комментарии");
  }

  const updated = await db.comment.update({
    where: { id: commentId },
    data: { text },
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
  });

  revalidatePath("/");
  return updated;
}
