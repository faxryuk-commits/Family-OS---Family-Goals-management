"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        name,
        redirect: false,
      });

      if (result?.error) {
        setError("Не удалось войти. Попробуйте ещё раз.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Произошла ошибка");
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
            FamilyOS
          </h1>
          <p className="text-[var(--muted)] mt-2">
            Синхронизируйте цели вашей семьи
          </p>
        </div>

        {/* Login Form */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6 text-center">
            Вход / Регистрация
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Имя <span className="text-[var(--muted)]">(для новых)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Как вас называть?"
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
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Входим...
                </span>
              ) : (
                "Войти"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--muted)] text-center">
              💡 Если аккаунта нет — он создастся автоматически
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <p className="text-2xl mb-2">🎯</p>
            <p className="text-xs text-[var(--muted)]">Общие цели</p>
          </div>
          <div className="p-4">
            <p className="text-2xl mb-2">⚡</p>
            <p className="text-xs text-[var(--muted)]">Conflict Engine</p>
          </div>
          <div className="p-4">
            <p className="text-2xl mb-2">📋</p>
            <p className="text-xs text-[var(--muted)]">Weekly Check-in</p>
          </div>
        </div>
      </div>
    </div>
  );
}
