import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getLevelFromXp } from "@/lib/gamification-utils";
import { db } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Цвета уровней
function getLevelColor(level: number): string {
  if (level >= 25) return "from-yellow-400 to-amber-600"; // Gold
  if (level >= 10) return "from-purple-400 to-pink-600";  // Purple
  if (level >= 5) return "from-blue-400 to-cyan-600";     // Blue
  return "from-green-400 to-emerald-600";                  // Green
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      achievements: { 
        include: { achievement: true },
        orderBy: { unlockedAt: "desc" },
      },
      goals: {
        where: { status: "COMPLETED" },
        orderBy: { updatedAt: "desc" },
        take: 5,
      },
      checkIns: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: {
        select: {
          goals: true,
          checkIns: true,
        },
      },
    },
  });

  if (!user) redirect("/login");

  const levelInfo = getLevelFromXp(user.xp);
  const progressPercent = Math.round((levelInfo.currentXp / levelInfo.nextLevelXp) * 100);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-[var(--muted)] hover:text-white transition-colors">
              ← Назад
            </Link>
            <h1 className="text-lg font-semibold">Мой профиль</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Profile Card */}
        <section className="card overflow-hidden">
          {/* Gradient Banner */}
          <div className={`h-32 bg-gradient-to-r ${getLevelColor(user.level)} relative`}>
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--card)] to-transparent"></div>
          </div>
          
          {/* Avatar & Info */}
          <div className="px-6 pb-6 -mt-16 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
              {/* Avatar */}
              <div className={`w-28 h-28 rounded-2xl bg-gradient-to-br ${getLevelColor(user.level)} flex items-center justify-center text-4xl font-bold shadow-2xl border-4 border-[var(--card)]`}>
                {user.image ? (
                  <img src={user.image} alt={user.name || ""} className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  (user.name || "?").charAt(0).toUpperCase()
                )}
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold">{user.name || "Пользователь"}</h2>
                <p className="text-[var(--muted)]">{user.email}</p>
                {user.bio && <p className="text-sm mt-1">{user.bio}</p>}
              </div>

              {/* Level Badge */}
              <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${getLevelColor(user.level)} text-white font-bold shadow-lg`}>
                <span className="text-2xl">Lv.{user.level}</span>
              </div>
            </div>

            {/* XP Progress */}
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--muted)]">Опыт</span>
                <span>{levelInfo.currentXp} / {levelInfo.nextLevelXp} XP</span>
              </div>
              <div className="h-3 bg-[var(--background)] rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${getLevelColor(user.level)} transition-all duration-500`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-[var(--muted)] mt-1">
                {levelInfo.nextLevelXp - levelInfo.currentXp} XP до уровня {user.level + 1}
              </p>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <div className="text-3xl font-bold text-blue-400">{user._count.goals}</div>
            <div className="text-sm text-[var(--muted)]">Всего целей</div>
          </div>
          <div className="card text-center bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <div className="text-3xl font-bold text-green-400">{user.goalsCompleted}</div>
            <div className="text-sm text-[var(--muted)]">Выполнено</div>
          </div>
          <div className="card text-center bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <div className="text-3xl font-bold text-orange-400">🔥 {user.streak}</div>
            <div className="text-sm text-[var(--muted)]">Стрик недель</div>
          </div>
          <div className="card text-center bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <div className="text-3xl font-bold text-purple-400">{user.subtasksCompleted}</div>
            <div className="text-sm text-[var(--muted)]">Этапов</div>
          </div>
        </section>

        {/* Achievements */}
        <section className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🏆</span> Достижения
            <span className="text-sm text-[var(--muted)] font-normal">
              ({user.achievements.length})
            </span>
          </h3>
          
          {user.achievements.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {user.achievements.map(({ achievement, unlockedAt }) => (
                <div 
                  key={achievement.id}
                  className="p-4 bg-gradient-to-br from-[var(--background)] to-[var(--card)] rounded-xl border border-[var(--border)] hover:border-yellow-500/50 transition-colors"
                >
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <div className="font-medium text-sm">{achievement.title}</div>
                  <div className="text-xs text-[var(--muted)]">{achievement.description}</div>
                  {achievement.xpReward > 0 && (
                    <div className="text-xs text-yellow-400 mt-1">+{achievement.xpReward} XP</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--muted)]">
              <div className="text-4xl mb-2">🎯</div>
              <p>Пока нет достижений</p>
              <p className="text-sm">Создавайте цели, отмечайте прогресс — получайте награды!</p>
            </div>
          )}
        </section>

        {/* Recent Wins */}
        {user.goals.length > 0 && (
          <section className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>✅</span> Последние победы
            </h3>
            <div className="space-y-3">
              {user.goals.map((goal) => (
                <div 
                  key={goal.id}
                  className="p-3 bg-[var(--background)] rounded-lg flex items-center gap-3"
                >
                  <div className="text-2xl">🏆</div>
                  <div className="flex-1">
                    <div className="font-medium">{goal.title}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {new Date(goal.updatedAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stats Summary */}
        <section className="card bg-gradient-to-br from-[var(--card)] to-[var(--background)]">
          <h3 className="text-lg font-semibold mb-4">📊 Статистика</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Всего XP</span>
              <span className="font-medium">{user.xp.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Check-ins</span>
              <span className="font-medium">{user._count.checkIns}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Макс. стрик</span>
              <span className="font-medium">{user.longestStreak} недель</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">С нами с</span>
              <span className="font-medium">
                {new Date(user.createdAt).toLocaleDateString("ru-RU", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
