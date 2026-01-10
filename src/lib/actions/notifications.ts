"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// Типы уведомлений
export type NotificationType = 
  | "GOAL_ASSIGNED"      // Тебя отметили на цели
  | "COMMENT"            // Комментарий к твоей цели
  | "FAMILY_INVITE"      // Приглашение в семью
  | "FAMILY_JOINED"      // Кто-то присоединился к семье
  | "GOAL_COMPLETED"     // Цель выполнена
  | "CHECK_IN"           // Кто-то сделал check-in
  | "ACHIEVEMENT"        // Получено достижение
  | "CONFLICT"           // Обнаружен конфликт целей

// Создать уведомление
export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  fromUserId,
  goalId,
  familyId,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  fromUserId?: string;
  goalId?: string;
  familyId?: string;
}) {
  // Не отправлять уведомление самому себе
  if (fromUserId && userId === fromUserId) return null;

  const notification = await db.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      link,
      fromUserId,
      goalId,
      familyId,
    },
  });

  return notification;
}

// Получить уведомления пользователя
export async function getNotifications(limit = 20) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      fromUser: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  return notifications;
}

// Получить количество непрочитанных
export async function getUnreadCount() {
  const session = await auth();
  if (!session?.user?.id) return 0;

  const count = await db.notification.count({
    where: {
      userId: session.user.id,
      read: false,
    },
  });

  return count;
}

// Отметить как прочитанное
export async function markAsRead(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  await db.notification.update({
    where: {
      id: notificationId,
      userId: session.user.id, // Проверка владельца
    },
    data: { read: true },
  });

  revalidatePath("/");
}

// Отметить все как прочитанные
export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user?.id) return;

  await db.notification.updateMany({
    where: {
      userId: session.user.id,
      read: false,
    },
    data: { read: true },
  });

  revalidatePath("/");
}

// Удалить уведомление
export async function deleteNotification(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  await db.notification.delete({
    where: {
      id: notificationId,
      userId: session.user.id,
    },
  });

  revalidatePath("/");
}

// ============================================
// ТРИГГЕРЫ УВЕДОМЛЕНИЙ
// ============================================

// Когда тебя отметили на цели
export async function notifyGoalAssigned({
  goalId,
  goalTitle,
  assignedToId,
  fromUserId,
  fromUserName,
  familyId,
}: {
  goalId: string;
  goalTitle: string;
  assignedToId: string;
  fromUserId: string;
  fromUserName: string;
  familyId: string;
}) {
  await createNotification({
    userId: assignedToId,
    type: "GOAL_ASSIGNED",
    title: "💝 Тебя отметили на цели",
    message: `${fromUserName} хочет, чтобы ты знал(а) о цели: "${goalTitle}"`,
    link: `/?goalId=${goalId}`,
    fromUserId,
    goalId,
    familyId,
  });
}

// Когда кто-то прокомментировал твою цель
export async function notifyComment({
  goalId,
  goalTitle,
  goalOwnerId,
  fromUserId,
  fromUserName,
  commentText,
  familyId,
}: {
  goalId: string;
  goalTitle: string;
  goalOwnerId: string;
  fromUserId: string;
  fromUserName: string;
  commentText: string;
  familyId: string;
}) {
  await createNotification({
    userId: goalOwnerId,
    type: "COMMENT",
    title: "💬 Новый комментарий",
    message: `${fromUserName} прокомментировал цель "${goalTitle}": "${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}"`,
    link: `/?goalId=${goalId}`,
    fromUserId,
    goalId,
    familyId,
  });
}

// Когда кто-то присоединился к семье
export async function notifyFamilyJoined({
  familyId,
  familyName,
  newMemberName,
  newMemberId,
  memberIds,
}: {
  familyId: string;
  familyName: string;
  newMemberName: string;
  newMemberId: string;
  memberIds: string[];
}) {
  // Уведомить всех членов семьи (кроме нового)
  for (const memberId of memberIds) {
    if (memberId !== newMemberId) {
      await createNotification({
        userId: memberId,
        type: "FAMILY_JOINED",
        title: "👋 Новый член семьи",
        message: `${newMemberName} присоединился к "${familyName}"`,
        link: "/",
        fromUserId: newMemberId,
        familyId,
      });
    }
  }
}

// Когда обнаружен конфликт целей
export async function notifyConflict({
  goalATitle,
  goalBTitle,
  goalAOwnerId,
  goalBOwnerId,
  familyId,
}: {
  goalATitle: string;
  goalBTitle: string;
  goalAOwnerId: string;
  goalBOwnerId: string;
  familyId: string;
}) {
  const message = `Обнаружен конфликт между целями "${goalATitle}" и "${goalBTitle}". Обсудите это вместе!`;
  
  await createNotification({
    userId: goalAOwnerId,
    type: "CONFLICT",
    title: "⚠️ Конфликт целей",
    message,
    link: "/",
    familyId,
  });

  if (goalAOwnerId !== goalBOwnerId) {
    await createNotification({
      userId: goalBOwnerId,
      type: "CONFLICT",
      title: "⚠️ Конфликт целей",
      message,
      link: "/",
      familyId,
    });
  }
}

// Когда цель выполнена
export async function notifyGoalCompleted({
  goalId,
  goalTitle,
  ownerId,
  ownerName,
  familyId,
  memberIds,
}: {
  goalId: string;
  goalTitle: string;
  ownerId: string;
  ownerName: string;
  familyId: string;
  memberIds: string[];
}) {
  // Уведомить всех членов семьи
  for (const memberId of memberIds) {
    await createNotification({
      userId: memberId,
      type: "GOAL_COMPLETED",
      title: "🎉 Цель достигнута!",
      message: memberId === ownerId 
        ? `Поздравляем! Вы достигли цели "${goalTitle}"` 
        : `${ownerName} достиг(ла) цели "${goalTitle}"`,
      link: `/?goalId=${goalId}`,
      fromUserId: ownerId,
      goalId,
      familyId,
    });
  }
}
