"use client";

import { useState } from "react";
import Link from "next/link";
import { UserMenu } from "./UserMenu";
import { HelpIcon } from "./Tooltip";

type HeaderProps = {
  familyName: string;
  northStar?: string | null;
  conflictCount: number;
  onEditNorthStar?: (value: string) => void;
};

export function Header({ familyName, northStar, conflictCount, onEditNorthStar }: HeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(northStar || "");

  const handleSave = () => {
    if (onEditNorthStar && editValue.trim()) {
      onEditNorthStar(editValue);
    }
    setIsEditing(false);
  };

  return (
    <header className="border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Family Name */}
          <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow">
              F
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{familyName}</h1>
              <p className="text-sm text-[var(--muted)]">FamilyOS</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            <Link
              href="/profile"
              className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--muted)] hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <span>👤</span>
              <span className="hidden sm:inline">Профиль</span>
            </Link>
            <Link
              href="/agreements"
              className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--muted)] hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <span>📜</span>
              <span className="hidden sm:inline">Договоры</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--muted)] hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <span>⚙️</span>
              <span className="hidden sm:inline">Настройки</span>
            </Link>

            {/* Conflict Badge */}
            {conflictCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl animate-pulse-glow">
                <span className="text-red-400 text-lg">⚠️</span>
                <span className="text-red-300 font-semibold">
                  {conflictCount}
                </span>
              </div>
            )}

            {/* User Menu */}
            <UserMenu />
          </nav>
        </div>

        {/* Mission (North Star) */}
        <div className="mt-4 p-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 rounded-2xl relative overflow-hidden">
          {/* Decorative gradient orb */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl"></div>
          
          <div className="flex items-center gap-2 text-sm text-[var(--muted)] mb-2 relative">
            <span className="text-lg">🌟</span>
            <span className="font-medium">Миссия семьи</span>
            <HelpIcon text="Главная цель, к которой стремится ваша семья. Все остальные цели должны вести к ней. Например: «Финансовая свобода к 50 годам» или «Дать детям лучшее образование»." />
          </div>
          
          {isEditing ? (
            <div className="flex gap-2 relative">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="input flex-1"
                placeholder="К чему стремится ваша семья?"
                autoFocus
              />
              <button onClick={handleSave} className="btn btn-primary">
                Сохранить
              </button>
              <button 
                onClick={() => setIsEditing(false)} 
                className="btn btn-secondary"
              >
                Отмена
              </button>
            </div>
          ) : (
            <div 
              className="flex items-center justify-between cursor-pointer group relative"
              onClick={() => setIsEditing(true)}
            >
              <p className="text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {northStar || "Нажмите, чтобы задать миссию семьи..."}
              </p>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400">
                ✏️
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
