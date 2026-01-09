"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getLevelFromXp, xpForLevel } from "@/lib/gamification-utils";

// Re-export utilities for convenience
export { getLevelFromXp, xpForLevel };

// Начислить XP пользователю
export async function addUserXp(userId: string, amount: number, reason: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const newXp = user.xp + amount;
  const levelInfo = getLevelFromXp(newXp);
  
  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      xp: newXp,
      level: levelInfo.level,
    },
  });

  // Проверяем ачивки после начисления XP
  await checkAchievements(userId);

  revalidatePath("/");
  return updatedUser;
}

// Обновить стрик пользователя при check-in
export async function updateStreak(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const now = new Date();
  const lastCheckIn = user.lastCheckIn;
  
  let newStreak = 1;
  
  if (lastCheckIn) {
    const daysSince = Math.floor((now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24));
    
    // Если прошло 7-14 дней (неделя с запасом), продолжаем стрик
    if (daysSince >= 5 && daysSince <= 10) {
      newStreak = user.streak + 1;
    } else if (daysSince < 5) {
      // Уже отмечался на этой неделе
      newStreak = user.streak;
    }
    // Если > 10 дней — стрик сбрасывается
  }

  const longestStreak = Math.max(user.longestStreak, newStreak);

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      streak: newStreak,
      longestStreak,
      lastCheckIn: now,
    },
  });

  // XP за стрик
  if (newStreak > user.streak) {
    await addUserXp(userId, 10 * newStreak, `Стрик ${newStreak} недель!`);
  }

  await checkAchievements(userId);
  return updatedUser;
}

// Засчитать выполненную цель
export async function recordGoalCompletion(userId: string) {
  const user = await db.user.update({
    where: { id: userId },
    data: {
      goalsCompleted: { increment: 1 },
    },
  });

  // XP за цель
  await addUserXp(userId, 50, "Цель выполнена!");
  await checkAchievements(userId);

  return user;
}

// Засчитать выполненную подзадачу
export async function recordSubtaskCompletion(userId: string) {
  const user = await db.user.update({
    where: { id: userId },
    data: {
      subtasksCompleted: { increment: 1 },
    },
  });

  // XP за подзадачу
  await addUserXp(userId, 5, "Этап выполнен!");

  return user;
}

// Определение ачивок
const ACHIEVEMENT_DEFINITIONS = [
  // Goals
  { code: "first_goal", title: "Первая цель", description: "Создал свою первую цель", icon: "🎯", xp: 20, category: "GOALS", check: (u: any) => u._count?.goals >= 1 },
  { code: "goal_5", title: "5 целей", description: "Создал 5 целей", icon: "🎯", xp: 50, category: "GOALS", check: (u: any) => u._count?.goals >= 5 },
  { code: "goal_10", title: "10 целей", description: "Создал 10 целей", icon: "🏆", xp: 100, category: "GOALS", check: (u: any) => u._count?.goals >= 10 },
  { code: "complete_1", title: "Первая победа", description: "Выполнил первую цель", icon: "✅", xp: 30, category: "GOALS", check: (u: any) => u.goalsCompleted >= 1 },
  { code: "complete_5", title: "5 побед", description: "Выполнил 5 целей", icon: "🌟", xp: 100, category: "GOALS", check: (u: any) => u.goalsCompleted >= 5 },
  
  // Streaks
  { code: "streak_2", title: "2 недели подряд", description: "2 недельных check-in подряд", icon: "🔥", xp: 20, category: "STREAKS", check: (u: any) => u.streak >= 2 },
  { code: "streak_4", title: "Месяц в игре", description: "4 недельных check-in подряд", icon: "🔥", xp: 50, category: "STREAKS", check: (u: any) => u.streak >= 4 },
  { code: "streak_12", title: "Квартал силы", description: "12 недельных check-in подряд", icon: "💪", xp: 200, category: "STREAKS", check: (u: any) => u.streak >= 12 },
  { code: "streak_52", title: "Легенда года", description: "52 недельных check-in подряд", icon: "👑", xp: 1000, category: "STREAKS", check: (u: any) => u.streak >= 52 },

  // Subtasks
  { code: "subtask_10", title: "10 этапов", description: "Выполнил 10 этапов", icon: "📋", xp: 25, category: "GOALS", check: (u: any) => u.subtasksCompleted >= 10 },
  { code: "subtask_50", title: "50 этапов", description: "Выполнил 50 этапов", icon: "📋", xp: 100, category: "GOALS", check: (u: any) => u.subtasksCompleted >= 50 },
  { code: "subtask_100", title: "100 этапов", description: "Выполнил 100 этапов", icon: "🚀", xp: 300, category: "GOALS", check: (u: any) => u.subtasksCompleted >= 100 },

  // Levels
  { code: "level_5", title: "Уровень 5", description: "Достиг 5 уровня", icon: "⭐", xp: 0, category: "SPECIAL", check: (u: any) => u.level >= 5 },
  { code: "level_10", title: "Уровень 10", description: "Достиг 10 уровня", icon: "🌟", xp: 0, category: "SPECIAL", check: (u: any) => u.level >= 10 },
  { code: "level_25", title: "Уровень 25", description: "Достиг 25 уровня", icon: "💎", xp: 0, category: "SPECIAL", check: (u: any) => u.level >= 25 },
];

// Проверить и выдать новые ачивки
export async function checkAchievements(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      achievements: { include: { achievement: true } },
      _count: { select: { goals: true, checkIns: true } },
    },
  });

  if (!user) return [];

  const unlockedCodes = new Set(user.achievements.map(a => a.achievement.code));
  const newAchievements: string[] = [];

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (unlockedCodes.has(def.code)) continue;
    if (!def.check(user)) continue;

    // Создаём ачивку если нет
    let achievement = await db.achievement.findUnique({ where: { code: def.code } });
    if (!achievement) {
      achievement = await db.achievement.create({
        data: {
          code: def.code,
          title: def.title,
          description: def.description,
          icon: def.icon,
          xpReward: def.xp,
          category: def.category,
        },
      });
    }

    // Выдаём ачивку
    await db.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
      },
    });

    // XP за ачивку
    if (def.xp > 0) {
      await db.user.update({
        where: { id: userId },
        data: { xp: { increment: def.xp } },
      });
    }

    newAchievements.push(def.code);
  }

  if (newAchievements.length > 0) {
    revalidatePath("/");
  }

  return newAchievements;
}

// Получить все ачивки пользователя
export async function getUserAchievements(userId: string) {
  return db.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
    orderBy: { unlockedAt: "desc" },
  });
}

// Получить статистику пользователя
export async function getUserStats(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      achievements: { include: { achievement: true } },
      _count: { 
        select: { 
          goals: true, 
          checkIns: true,
        } 
      },
    },
  });

  if (!user) return null;

  const levelInfo = getLevelFromXp(user.xp);

  return {
    ...user,
    levelInfo,
    totalGoals: user._count.goals,
    totalCheckIns: user._count.checkIns,
  };
}
