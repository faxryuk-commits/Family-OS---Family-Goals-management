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
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Info */}
          <div className="space-y-8">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold shadow-lg shadow-purple-500/20 text-white">
                F
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text">FamilyOS</h1>
                <p className="text-[var(--muted)]">Операционная система семьи</p>
              </div>
            </div>

            {/* Tagline */}
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold text-[var(--foreground)] leading-tight">
                Синхронизируйте цели
                <span className="block gradient-text">вашей семьи</span>
              </h2>
              <p className="text-lg text-[var(--muted)] mt-4 max-w-lg">
                Цели членов семьи не обязаны совпадать — но они должны быть совместимы.
                FamilyOS помогает это обеспечить.
              </p>
            </div>

            {/* Problem/Solution */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                <span className="text-red-500">❌</span> Знакомо?
              </h3>
              <ul className="space-y-2 text-[var(--muted)] text-sm">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Один хочет накопить на машину, другой — потратить на отпуск</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Поставили цели, но через месяц забыли о них</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>«Почему ты меня не поддерживаешь?» — знакомая фраза</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Нет прозрачности: кто что делает и почему</span>
                </li>
              </ul>

              <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2 pt-4">
                <span className="text-green-500">✅</span> FamilyOS решает это
              </h3>
              <ul className="space-y-2 text-[var(--muted)] text-sm">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span><strong>Видимость:</strong> все цели семьи в одном месте</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span><strong>Conflict Engine:</strong> находит конфликты ДО того как они станут проблемой</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span><strong>Weekly Check-in:</strong> еженедельный ритуал синхронизации</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span><strong>Договоры:</strong> письменные соглашения о компромиссах</span>
                </li>
              </ul>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                <span className="text-2xl">🎯</span>
                <h4 className="font-semibold mt-2 text-[var(--foreground)]">Общие цели</h4>
                <p className="text-xs text-[var(--muted)] mt-1">Личные и семейные цели в одном месте</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                <span className="text-2xl">⚠️</span>
                <h4 className="font-semibold mt-2 text-[var(--foreground)]">Conflict Engine</h4>
                <p className="text-xs text-[var(--muted)] mt-1">Автоматическое обнаружение конфликтов</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                <span className="text-2xl">📋</span>
                <h4 className="font-semibold mt-2 text-[var(--foreground)]">Check-in</h4>
                <p className="text-xs text-[var(--muted)] mt-1">Еженедельные отчёты о прогрессе</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100">
                <span className="text-2xl">🏆</span>
                <h4 className="font-semibold mt-2 text-[var(--foreground)]">Геймификация</h4>
                <p className="text-xs text-[var(--muted)] mt-1">XP, уровни, достижения и стрики</p>
              </div>
            </div>
          </div>

          {/* Right: Login Form */}
          <div className="lg:pl-8">
            <div className="card max-w-md mx-auto">
              <h2 className="text-xl font-semibold mb-2 text-center text-[var(--foreground)]">
                Начните бесплатно
              </h2>
              <p className="text-sm text-[var(--muted)] text-center mb-6">
                Создайте аккаунт за 30 секунд
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">Email</label>
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
                  <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">
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
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 text-sm">
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
                    "Войти / Создать аккаунт"
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-[var(--border)]">
                <p className="text-sm text-[var(--muted)] text-center">
                  💡 Если аккаунта нет — он создастся автоматически
                </p>
              </div>

              {/* Trust signals */}
              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-[var(--muted)]">
                <span className="flex items-center gap-1">
                  <span>🔒</span> Безопасно
                </span>
                <span className="flex items-center gap-1">
                  <span>🆓</span> Бесплатно
                </span>
                <span className="flex items-center gap-1">
                  <span>⚡</span> Быстро
                </span>
              </div>
            </div>

            {/* Testimonial */}
            <div className="mt-8 max-w-md mx-auto p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
              <p className="text-sm text-[var(--foreground)] italic">
                "Наконец-то мы с мужем перестали ссориться из-за денег. 
                Когда видишь все цели на одном экране — сразу понимаешь, 
                где компромисс нужен."
              </p>
              <p className="text-xs text-[var(--muted)] mt-3">
                — Мадина, 32 года, мама двоих детей
              </p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-16 pt-16 border-t border-[var(--border)]">
          <h2 className="text-2xl font-bold text-center text-[var(--foreground)] mb-12">
            Как это работает?
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold mb-4">1</div>
              <h3 className="font-semibold mb-2 text-[var(--foreground)]">Создайте семью</h3>
              <p className="text-sm text-[var(--muted)]">
                Зарегистрируйтесь и пригласите партнёра по ссылке
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xl font-bold mb-4">2</div>
              <h3 className="font-semibold mb-2 text-[var(--foreground)]">Добавьте цели</h3>
              <p className="text-sm text-[var(--muted)]">
                Каждый член семьи вносит свои цели и указывает нужные ресурсы
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xl font-bold mb-4">3</div>
              <h3 className="font-semibold mb-2 text-[var(--foreground)]">Решите конфликты</h3>
              <p className="text-sm text-[var(--muted)]">
                Система найдёт пересечения — обсудите и договоритесь
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xl font-bold mb-4">4</div>
              <h3 className="font-semibold mb-2 text-[var(--foreground)]">Check-in каждую неделю</h3>
              <p className="text-sm text-[var(--muted)]">
                Отмечайте прогресс, делитесь победами и сложностями
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center py-12 px-6 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
          <h2 className="text-2xl font-bold text-white mb-4">
            Готовы синхронизировать вашу семью?
          </h2>
          <p className="text-white/80 mb-6 max-w-lg mx-auto">
            Присоединяйтесь к семьям, которые уже используют FamilyOS для достижения общих целей
          </p>
          <button
            onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-3 bg-white text-purple-600 font-semibold rounded-xl hover:bg-white/90 transition-colors"
          >
            Начать бесплатно →
          </button>
        </div>
      </div>
    </div>
  );
}
