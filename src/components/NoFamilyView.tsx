"use client";

import { useState } from "react";
import { createFamily, joinFamilyByInvite } from "@/lib/actions/family";
import { useRouter } from "next/navigation";

type NoFamilyViewProps = {
  userId: string;
  userName: string;
};

export function NoFamilyView({ userId, userName }: NoFamilyViewProps) {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [familyName, setFamilyName] = useState("");
  const [northStar, setNorthStar] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      await createFamily({
        name: familyName,
        northStar: northStar || undefined,
        creatorId: userId,
      });
      router.refresh();
    } catch {
      setError("Не удалось создать семью");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await joinFamilyByInvite(inviteCode, userId);
      if (!result) {
        setError("Неверный код приглашения");
      } else {
        router.refresh();
      }
    } catch {
      setError("Не удалось присоединиться");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold mb-4 shadow-lg shadow-purple-500/20">
            F
          </div>
          <h1 className="text-2xl font-bold">
            Привет, {userName}! 👋
          </h1>
          <p className="text-[var(--muted)] mt-2">
            Для начала работы нужна семья
          </p>
        </div>

        {mode === "choose" && (
          <div className="space-y-4">
            <button
              onClick={() => setMode("create")}
              className="card w-full text-left hover:border-blue-500/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  👨‍👩‍👧
                </div>
                <div>
                  <h3 className="font-semibold">Создать семью</h3>
                  <p className="text-sm text-[var(--muted)]">
                    Начните новую семейную доску целей
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode("join")}
              className="card w-full text-left hover:border-purple-500/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🔗
                </div>
                <div>
                  <h3 className="font-semibold">Присоединиться</h3>
                  <p className="text-sm text-[var(--muted)]">
                    Введите код приглашения от партнёра
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {mode === "create" && (
          <div className="card">
            <button
              onClick={() => setMode("choose")}
              className="text-[var(--muted)] hover:text-white mb-4"
            >
              ← Назад
            </button>

            <h2 className="text-xl font-semibold mb-4">Создать семью</h2>

            <form onSubmit={handleCreateFamily} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Название семьи
                </label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="input"
                  placeholder="Семья Ивановых"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  North Star{" "}
                  <span className="text-[var(--muted)]">(опционально)</span>
                </label>
                <input
                  type="text"
                  value={northStar}
                  onChange={(e) => setNorthStar(e.target.value)}
                  className="input"
                  placeholder="Главная цель семьи..."
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? "Создаём..." : "Создать семью"}
              </button>
            </form>
          </div>
        )}

        {mode === "join" && (
          <div className="card">
            <button
              onClick={() => setMode("choose")}
              className="text-[var(--muted)] hover:text-white mb-4"
            >
              ← Назад
            </button>

            <h2 className="text-xl font-semibold mb-4">Присоединиться</h2>

            <form onSubmit={handleJoinFamily} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Код приглашения
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="input text-center text-2xl tracking-wider font-mono"
                  placeholder="ABC123"
                  maxLength={6}
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? "Проверяем..." : "Присоединиться"}
              </button>
            </form>

            <p className="text-sm text-[var(--muted)] text-center mt-4">
              Попросите партнёра создать приглашение в настройках семьи
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
