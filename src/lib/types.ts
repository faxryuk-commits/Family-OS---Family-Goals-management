// Resource types for goals
export const RESOURCES = {
  MONEY: { label: "Деньги", icon: "💰", color: "text-yellow-500" },
  TIME: { label: "Время", icon: "⏳", color: "text-blue-500" },
  GEO: { label: "География", icon: "📍", color: "text-red-500" },
  ENERGY: { label: "Энергия", icon: "🧠", color: "text-purple-500" },
  RISK: { label: "Риск", icon: "⚡", color: "text-orange-500" },
} as const;

export type ResourceType = keyof typeof RESOURCES;
export type HorizonType = keyof typeof HORIZONS;
export type StatusType = keyof typeof STATUSES;
export type ConflictTypeType = keyof typeof CONFLICT_TYPES;
export type StrategyType = keyof typeof STRATEGIES;

// Goal horizon labels
export const HORIZONS = {
  SHORT: { label: "Краткосрочная", description: "До 3 месяцев", color: "bg-green-100 text-green-800" },
  MID: { label: "Среднесрочная", description: "3-24 месяца", color: "bg-blue-100 text-blue-800" },
  LONG: { label: "Долгосрочная", description: "2+ года", color: "bg-purple-100 text-purple-800" },
} as const;

// Goal status labels
export const STATUSES = {
  DRAFT: { label: "Черновик", color: "bg-gray-100 text-gray-600" },
  BLOCKED: { label: "Заблокирована", color: "bg-red-100 text-red-600" },
  ACTIVE: { label: "Активна", color: "bg-green-100 text-green-600" },
  PAUSED: { label: "На паузе", color: "bg-yellow-100 text-yellow-600" },
  COMPLETED: { label: "Достигнута", color: "bg-emerald-100 text-emerald-600" },
  DROPPED: { label: "Отменена", color: "bg-gray-100 text-gray-400" },
} as const;

// Conflict type labels
export const CONFLICT_TYPES = {
  DIRECT: { label: "Прямой конфликт", description: "Нельзя выполнить оба", color: "bg-red-500" },
  RESOURCE: { label: "Конфликт ресурсов", description: "Можно, но не одновременно", color: "bg-yellow-500" },
  PRIORITY: { label: "Конфликт приоритетов", description: "Мешают фокусироваться", color: "bg-orange-500" },
} as const;

// Resolution strategies
export const STRATEGIES = {
  COMPROMISE: { 
    label: "Компромисс", 
    icon: "🤝", 
    description: "Оба уменьшают масштаб",
    color: "border-blue-500 bg-blue-50"
  },
  SEQUENCE: { 
    label: "Очередность", 
    icon: "📋", 
    description: "Сначала одно, потом другое",
    color: "border-green-500 bg-green-50"
  },
  TRANSFORM: { 
    label: "Трансформация", 
    icon: "🔄", 
    description: "Изменение формы цели",
    color: "border-purple-500 bg-purple-50"
  },
  PRIORITY: { 
    label: "Приоритет", 
    icon: "⏸️", 
    description: "Временно заморозить одну",
    color: "border-yellow-500 bg-yellow-50"
  },
  DROP: { 
    label: "Отказ", 
    icon: "❌", 
    description: "Осознанно убрать одну цель",
    color: "border-red-500 bg-red-50"
  },
} as const;
