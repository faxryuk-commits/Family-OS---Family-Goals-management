"use client";

import { useState } from "react";
import Link from "next/link";
import { getLevelFromXp } from "@/lib/gamification-utils";

type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  level: number;
  xp: number;
  streak: number;
};

type HeaderProps = {
  familyName: string;
  northStar?: string | null;
  conflictCount: number;
  onEditNorthStar?: (value: string) => void;
  currentUser?: CurrentUser;
  familyLevel?: number;
  familyXp?: number;
};

// Цвета уровней
function getLevelColor(level: number): string {
  if (level >= 25) return "from-yellow-400 to-amber-600";
  if (level >= 10) return "from-purple-400 to-pink-600";
  if (level >= 5) return "from-blue-400 to-cyan-600";
  return "from-emerald-400 to-green-600";
}

export function Header({ 
  familyName, 
  northStar, 
  conflictCount, 
  onEditNorthStar,
  currentUser,
  familyLevel = 1,
  familyXp = 0,
}: HeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(northStar || "");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSave = () => {
    if (onEditNorthStar && editValue.trim()) {
      onEditNorthStar(editValue);
    }
    setIsEditing(false);
  };

  const levelInfo = currentUser ? getLevelFromXp(currentUser.xp) : { level: 1, currentXp: 0, nextLevelXp: 100 };
  const xpProgress = (levelInfo.currentXp / levelInfo.nextLevelXp) * 100;

  return (
    <header className="border-b border-[var(--border)] bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Family */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity group shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-lg font-bold shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow">
              F
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-[var(--foreground)]">{familyName}</h1>
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <span>Lv.{familyLevel}</span>
                <div className="w-16 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${(familyXp % 100)}%` }} />
                </div>
              </div>
            </div>
          </Link>

          {/* Center: Mission (collapsed on mobile) */}
          {northStar && !isEditing && (
            <div 
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl cursor-pointer group flex-1 max-w-md mx-4 hover:border-indigo-300 transition-colors"
              onClick={() => setIsEditing(true)}
            >
              <span>🌟</span>
              <span className="text-sm truncate text-[var(--foreground)]">{northStar}</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500">✏️</span>
            </div>
          )}

          {/* Right: Actions + Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Conflict Badge */}
            {conflictCount > 0 && (
              <div className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-lg animate-pulse-glow">
                <span className="text-red-400">⚠️</span>
                <span className="text-red-300 text-sm font-semibold">{conflictCount}</span>
              </div>
            )}

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/agreements" className="p-2 text-[var(--muted)] hover:text-white hover:bg-white/5 rounded-lg transition-all" title="Договоры">
                📜
              </Link>
              <Link href="/settings" className="p-2 text-[var(--muted)] hover:text-white hover:bg-white/5 rounded-lg transition-all" title="Настройки">
                ⚙️
              </Link>
            </nav>

            {/* Profile Card */}
            {currentUser && (
              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-gradient-to-r from-[var(--card)] to-[var(--background)] border border-[var(--border)] rounded-xl hover:border-[var(--accent)] transition-all"
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br ${getLevelColor(currentUser.level)} flex items-center justify-center text-sm font-bold shadow-md`}>
                    {currentUser.image ? (
                      <img src={currentUser.image} alt="" className="w-full h-full rounded-lg object-cover" />
                    ) : (
                      (currentUser.name || "?").charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-semibold flex items-center gap-1.5">
                      <span>{currentUser.name?.split(" ")[0] || "User"}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded bg-gradient-to-r ${getLevelColor(currentUser.level)} text-white`}>
                        {currentUser.level}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                      {currentUser.streak > 0 && (
                        <span className="text-orange-400">🔥{currentUser.streak}</span>
                      )}
                      <div className="w-12 h-1 bg-[var(--background)] rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${getLevelColor(currentUser.level)}`} 
                          style={{ width: `${xpProgress}%` }} 
                        />
                      </div>
                    </div>
                  </div>

                  <span className="text-[var(--muted)] text-xs">▼</span>
                </button>

                {/* Dropdown */}
                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-[var(--border)] rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
                      {/* Profile Header */}
                      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-[var(--border)]">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getLevelColor(currentUser.level)} flex items-center justify-center text-xl font-bold`}>
                            {(currentUser.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold">{currentUser.name}</div>
                            <div className="text-xs text-[var(--muted)]">{currentUser.email}</div>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="p-3 grid grid-cols-3 gap-2 text-center border-b border-[var(--border)]">
                        <div>
                          <div className={`text-lg font-bold bg-gradient-to-r ${getLevelColor(currentUser.level)} bg-clip-text text-transparent`}>
                            {currentUser.level}
                          </div>
                          <div className="text-xs text-[var(--muted)]">Уровень</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-orange-400">
                            🔥{currentUser.streak}
                          </div>
                          <div className="text-xs text-[var(--muted)]">Стрик</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-400">
                            {currentUser.xp}
                          </div>
                          <div className="text-xs text-[var(--muted)]">XP</div>
                        </div>
                      </div>

                      {/* XP Progress */}
                      <div className="p-3 border-b border-[var(--border)]">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[var(--muted)]">До уровня {currentUser.level + 1}</span>
                          <span>{levelInfo.currentXp}/{levelInfo.nextLevelXp} XP</span>
                        </div>
                        <div className="h-2 bg-[var(--background)] rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${getLevelColor(currentUser.level)}`}
                            style={{ width: `${xpProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* Menu */}
                      <div className="p-2">
                        <Link 
                          href="/profile" 
                          className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-white/5 rounded-lg transition-colors"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <span>👤</span>
                          <span>Мой профиль</span>
                        </Link>
                        <Link 
                          href="/settings" 
                          className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-white/5 rounded-lg transition-colors md:hidden"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <span>⚙️</span>
                          <span>Настройки</span>
                        </Link>
                        <Link 
                          href="/agreements" 
                          className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-white/5 rounded-lg transition-colors md:hidden"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <span>📜</span>
                          <span>Договоры</span>
                        </Link>
                        <hr className="my-2 border-[var(--border)]" />
                        <Link 
                          href="/api/auth/signout" 
                          className="flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <span>🚪</span>
                          <span>Выйти</span>
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mission Edit (full width when editing) */}
        {isEditing && (
          <div className="mt-3 flex gap-2 animate-fade-in">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="input flex-1"
              placeholder="К чему стремится ваша семья?"
              autoFocus
            />
            <button onClick={handleSave} className="btn btn-primary">✓</button>
            <button onClick={() => setIsEditing(false)} className="btn btn-secondary">✕</button>
          </div>
        )}

        {/* Mobile Mission */}
        {!isEditing && northStar && (
          <div 
            className="mt-3 md:hidden p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl"
            onClick={() => setIsEditing(true)}
          >
            <div className="flex items-center gap-2 text-sm">
              <span>🌟</span>
              <span className="truncate">{northStar}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
