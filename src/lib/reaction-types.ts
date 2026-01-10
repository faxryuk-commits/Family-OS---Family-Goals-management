// Типы и константы для реакций (клиентская часть)

// Доступные эмодзи для реакций
export const REACTION_EMOJIS = ["👍", "❤️", "🎉", "🔥", "💪", "👀"] as const;
export type ReactionEmoji = typeof REACTION_EMOJIS[number];

// Типы объектов для реакций
export type ReactionTarget = "GOAL" | "CHECK_IN";
