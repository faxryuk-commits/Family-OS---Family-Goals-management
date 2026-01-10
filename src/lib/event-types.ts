// Типы событий для календаря (клиентская часть)

export const EVENT_TYPES = {
  BIRTHDAY: { label: "День рождения", emoji: "🎂", color: "#ec4899" },
  ANNIVERSARY: { label: "Годовщина", emoji: "💍", color: "#f59e0b" },
  HOLIDAY: { label: "Праздник", emoji: "🎉", color: "#10b981" },
  REMINDER: { label: "Напоминание", emoji: "⏰", color: "#6366f1" },
  GOAL_DEADLINE: { label: "Дедлайн цели", emoji: "🎯", color: "#ef4444" },
  MEETING: { label: "Встреча", emoji: "👥", color: "#3b82f6" },
  CUSTOM: { label: "Другое", emoji: "📅", color: "#8b5cf6" },
} as const;

export type EventType = keyof typeof EVENT_TYPES;

// Типы повторения
export const RECURRING_TYPES = {
  NONE: "Не повторяется",
  DAILY: "Ежедневно",
  WEEKLY: "Еженедельно",
  MONTHLY: "Ежемесячно",
  YEARLY: "Ежегодно",
} as const;

export type RecurringType = keyof typeof RECURRING_TYPES;
