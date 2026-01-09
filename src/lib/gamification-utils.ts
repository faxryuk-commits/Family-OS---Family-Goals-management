// XP для каждого уровня (экспоненциальный рост)
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Получить уровень по XP
export function getLevelFromXp(xp: number): { level: number; currentXp: number; nextLevelXp: number } {
  let level = 1;
  let totalXp = 0;
  
  while (totalXp + xpForLevel(level) <= xp) {
    totalXp += xpForLevel(level);
    level++;
  }
  
  return {
    level,
    currentXp: xp - totalXp,
    nextLevelXp: xpForLevel(level),
  };
}
