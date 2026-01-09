// Общие утилиты (работают и на сервере, и на клиенте)

// Получить текущую неделю в формате "2024-W01"
export function getCurrentWeek(): string {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${week.toString().padStart(2, "0")}`;
}

// Форматирование ресурсов
export const resourceLabels: Record<string, { emoji: string; label: string }> = {
  MONEY: { emoji: "💰", label: "Деньги" },
  TIME: { emoji: "⏰", label: "Время" },
  GEO: { emoji: "🌍", label: "Место" },
  ENERGY: { emoji: "⚡", label: "Энергия" },
  RISK: { emoji: "🎲", label: "Риск" },
};

// Форматирование статусов
export const statusLabels: Record<string, { emoji: string; label: string; color: string }> = {
  DRAFT: { emoji: "📝", label: "Черновик", color: "text-gray-400" },
  ACTIVE: { emoji: "🚀", label: "Активна", color: "text-green-400" },
  BLOCKED: { emoji: "🚧", label: "Блокирована", color: "text-red-400" },
  PAUSED: { emoji: "⏸️", label: "Пауза", color: "text-yellow-400" },
  COMPLETED: { emoji: "✅", label: "Выполнена", color: "text-emerald-400" },
  DROPPED: { emoji: "❌", label: "Отменена", color: "text-gray-500" },
};

// Форматирование горизонтов
export const horizonLabels: Record<string, { label: string; color: string }> = {
  SHORT: { label: "1-3 мес", color: "bg-blue-500/20 text-blue-300" },
  MID: { label: "3-12 мес", color: "bg-purple-500/20 text-purple-300" },
  LONG: { label: "1+ год", color: "bg-amber-500/20 text-amber-300" },
};
