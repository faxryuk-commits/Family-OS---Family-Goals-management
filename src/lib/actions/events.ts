"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { EVENT_TYPES, EventType, RecurringType } from "@/lib/event-types";

// Input для создания события
export type CreateEventInput = {
  title: string;
  description?: string;
  date: Date;
  endDate?: Date;
  allDay?: boolean;
  type?: EventType;
  recurring?: RecurringType;
  remindDays?: number;
  emoji?: string;
  color?: string;
  goalId?: string;
  forUserId?: string;
};

// Создать событие
export async function createEvent(familyId: string, input: CreateEventInput) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Необходима авторизация");
  }

  const event = await db.event.create({
    data: {
      title: input.title,
      description: input.description,
      date: input.date,
      endDate: input.endDate,
      allDay: input.allDay ?? true,
      type: input.type || "CUSTOM",
      recurring: input.recurring || "NONE",
      remindDays: input.remindDays ?? 1,
      emoji: input.emoji || EVENT_TYPES[input.type || "CUSTOM"].emoji,
      color: input.color || EVENT_TYPES[input.type || "CUSTOM"].color,
      creatorId: session.user.id,
      familyId,
      goalId: input.goalId,
      forUserId: input.forUserId,
    },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      forUser: { select: { id: true, name: true, image: true } },
      goal: { select: { id: true, title: true } },
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/");
  return event;
}

// Обновить событие
export async function updateEvent(
  eventId: string,
  input: Partial<CreateEventInput>
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Необходима авторизация");
  }

  // Проверяем что событие существует и пользователь его создатель
  const existing = await db.event.findUnique({
    where: { id: eventId },
    select: { creatorId: true },
  });

  if (!existing) {
    throw new Error("Событие не найдено");
  }

  if (existing.creatorId !== session.user.id) {
    throw new Error("Вы можете редактировать только свои события");
  }

  const event = await db.event.update({
    where: { id: eventId },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.date && { date: input.date }),
      ...(input.endDate !== undefined && { endDate: input.endDate }),
      ...(input.allDay !== undefined && { allDay: input.allDay }),
      ...(input.type && { type: input.type }),
      ...(input.recurring && { recurring: input.recurring }),
      ...(input.remindDays !== undefined && { remindDays: input.remindDays }),
      ...(input.emoji && { emoji: input.emoji }),
      ...(input.color && { color: input.color }),
      ...(input.goalId !== undefined && { goalId: input.goalId }),
      ...(input.forUserId !== undefined && { forUserId: input.forUserId }),
    },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      forUser: { select: { id: true, name: true, image: true } },
      goal: { select: { id: true, title: true } },
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/");
  return event;
}

// Удалить событие
export async function deleteEvent(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Необходима авторизация");
  }

  // Проверяем что событие существует и пользователь его создатель
  const existing = await db.event.findUnique({
    where: { id: eventId },
    select: { creatorId: true },
  });

  if (!existing) {
    throw new Error("Событие не найдено");
  }

  if (existing.creatorId !== session.user.id) {
    throw new Error("Вы можете удалять только свои события");
  }

  await db.event.delete({ where: { id: eventId } });

  revalidatePath("/calendar");
  revalidatePath("/");
}

// Получить события семьи за период
export async function getEvents(
  familyId: string,
  startDate: Date,
  endDate: Date
) {
  const events = await db.event.findMany({
    where: {
      familyId,
      OR: [
        // События в заданном диапазоне
        {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        // Повторяющиеся события (загружаем все, фильтруем на клиенте)
        {
          recurring: { not: "NONE" },
        },
      ],
    },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      forUser: { select: { id: true, name: true, image: true } },
      goal: { select: { id: true, title: true } },
    },
    orderBy: { date: "asc" },
  });

  return events;
}

// Получить предстоящие события (для виджета)
export async function getUpcomingEvents(familyId: string, limit = 5) {
  const now = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

  const events = await db.event.findMany({
    where: {
      familyId,
      date: {
        gte: now,
        lte: thirtyDaysLater,
      },
    },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      forUser: { select: { id: true, name: true, image: true } },
      goal: { select: { id: true, title: true } },
    },
    orderBy: { date: "asc" },
    take: limit,
  });

  return events;
}

// Получить события на сегодня
export async function getTodayEvents(familyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const events = await db.event.findMany({
    where: {
      familyId,
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      forUser: { select: { id: true, name: true, image: true } },
      goal: { select: { id: true, title: true } },
    },
    orderBy: { date: "asc" },
  });

  return events;
}

// Получить дни рождения в этом месяце
export async function getBirthdays(familyId: string) {
  const now = new Date();
  const currentMonth = now.getMonth();

  const events = await db.event.findMany({
    where: {
      familyId,
      type: "BIRTHDAY",
    },
    include: {
      forUser: { select: { id: true, name: true, image: true } },
    },
    orderBy: { date: "asc" },
  });

  // Фильтруем по текущему месяцу (учитывая что дни рождения повторяются каждый год)
  return events.filter(e => e.date.getMonth() === currentMonth);
}

// Автоматическое создание события для дедлайна цели
export async function createGoalDeadlineEvent(
  goalId: string,
  goalTitle: string,
  deadline: Date,
  familyId: string,
  creatorId: string
) {
  // Проверяем, нет ли уже события для этой цели
  const existing = await db.event.findFirst({
    where: { goalId, type: "GOAL_DEADLINE" },
  });

  if (existing) {
    // Обновляем существующее
    return db.event.update({
      where: { id: existing.id },
      data: { date: deadline, title: `🎯 Дедлайн: ${goalTitle}` },
    });
  }

  // Создаём новое
  return db.event.create({
    data: {
      title: `🎯 Дедлайн: ${goalTitle}`,
      date: deadline,
      type: "GOAL_DEADLINE",
      emoji: "🎯",
      color: "#ef4444",
      remindDays: 3,
      creatorId,
      familyId,
      goalId,
    },
  });
}

// Отправить напоминание о событии
export async function sendEventReminder(eventId: string) {
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: {
      family: {
        include: {
          members: { select: { userId: true } },
        },
      },
      forUser: true,
    },
  });

  if (!event || event.reminded) return;

  // Создаём уведомления для всех членов семьи
  const notifications = event.family.members.map(member => ({
    type: "EVENT_REMINDER",
    title: `📅 Напоминание: ${event.title}`,
    message: event.forUser
      ? `Скоро ${event.title} (${event.forUser.name})`
      : `Скоро: ${event.title}`,
    link: "/calendar",
    userId: member.userId,
    familyId: event.familyId,
    eventId: event.id,
  }));

  await db.$transaction([
    db.notification.createMany({ data: notifications }),
    db.event.update({
      where: { id: eventId },
      data: { reminded: true },
    }),
  ]);
}
