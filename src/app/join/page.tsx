"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { joinFamilyByInvite } from "@/lib/actions/family";
import { useSession } from "next-auth/react";
import Link from "next/link";

function JoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const codeFromUrl = searchParams.get("code") || "";
  const [code, setCode] = useState(codeFromUrl);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Если пришли с кодом в URL и авторизованы - сразу пробуем присоединиться
  useEffect(() => {
    if (codeFromUrl && session?.user?.id && !isJoining && !success) {
      handleJoin();
    }
  }, [codeFromUrl, session?.user?.id]);

  const handleJoin = async () => {
    if (!code.trim()) {
      setError("Введите код приглашения");
      return;
    }

    if (!session?.user?.id) {
      // Сохраняем код и редиректим на логин
      router.push(`/login?callbackUrl=/join?code=${code}`);
      return;
    }

    setIsJoining(true);
    setError("");

    try {
      const result = await joinFamilyByInvite(code.toUpperCase(), session.user.id);
      if (result) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        setError("Неверный или истёкший код приглашения");
      }
    } catch (err) {
      setError("Не удалось присоединиться. Попробуйте ещё раз.");
    } finally {
      setIsJoining(false);
    }
  };

  // Загрузка сессии
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold mb-4 animate-pulse">
            F
          </div>
          <p className="text-[var(--muted)]">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Успех
  if (success) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="card w-full max-w-md text-center animate-fade-in">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-2">Добро пожаловать!</h1>
          <p className="text-[var(--muted)] mb-4">
            Вы успешно присоединились к семье
          </p>
          <p className="text-sm text-[var(--muted)]">
            Перенаправляем на главную...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold mb-4 shadow-lg shadow-purple-500/20">
            F
          </div>
          <h1 className="text-2xl font-bold">FamilyOS</h1>
          <p className="text-[var(--muted)] mt-2">
            Присоединиться к семье
          </p>
        </div>

        <div className="card">
          {!session ? (
            // Не авторизован
            <div className="text-center">
              <p className="text-[var(--muted)] mb-4">
                Чтобы присоединиться к семье, сначала войдите в систему
              </p>
              <Link 
                href={`/login?callbackUrl=/join?code=${code}`}
                className="btn btn-primary w-full"
              >
                Войти
              </Link>
              {code && (
                <p className="text-sm text-[var(--muted)] mt-4">
                  Код приглашения: <span className="font-mono font-bold">{code}</span>
                </p>
              )}
            </div>
          ) : (
            // Авторизован - показываем форму
            <div>
              <h2 className="text-xl font-semibold mb-4 text-center">
                🔗 Введите код приглашения
              </h2>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Код приглашения
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="input text-center text-2xl tracking-wider font-mono"
                    placeholder="ABC123"
                    maxLength={6}
                  />
                </div>

                <button
                  onClick={handleJoin}
                  disabled={isJoining || !code.trim()}
                  className="btn btn-primary w-full"
                >
                  {isJoining ? "Присоединяемся..." : "Присоединиться"}
                </button>
              </div>

              <p className="text-sm text-[var(--muted)] text-center mt-4">
                Попросите члена семьи отправить вам приглашение
              </p>
            </div>
          )}
        </div>

        {/* Back link */}
        <div className="text-center mt-4">
          <Link href="/" className="text-[var(--muted)] hover:text-white text-sm">
            ← На главную
          </Link>
        </div>
      </div>
    </div>
  );
}

// Loading component for Suspense
function JoinLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold mb-4 animate-pulse">
          F
        </div>
        <p className="text-[var(--muted)]">Загрузка...</p>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<JoinLoading />}>
      <JoinContent />
    </Suspense>
  );
}
