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
    <header className="border-b border-[var(--card-border)] bg-[var(--card)]">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Family Name */}
          <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold">
              F
            </div>
            <div>
              <h1 className="text-xl font-semibold">{familyName}</h1>
              <p className="text-sm text-[var(--muted)]">Семейные цели</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-4">
            <Link
              href="/agreements"
              className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--muted)] hover:text-white hover:bg-[var(--background)] rounded-lg transition-colors"
            >
              <span>📜</span>
              <span className="hidden sm:inline">Договоры</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--muted)] hover:text-white hover:bg-[var(--background)] rounded-lg transition-colors"
            >
              <span>⚙️</span>
              <span className="hidden sm:inline">Настройки</span>
            </Link>

            {/* Conflict Badge */}
            {conflictCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg animate-pulse-glow">
                <span className="text-red-500 text-lg">⚠️</span>
                <span className="text-red-400 font-medium">
                  {conflictCount} {conflictCount === 1 ? "конфликт" : "конфликта"}
                </span>
              </div>
            )}

            {/* User Menu */}
            <UserMenu />
          </nav>
        </div>

        {/* Mission (North Star) */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-[var(--muted)] mb-2">
            <span>🌟</span>
            <span>Миссия семьи</span>
            <HelpIcon text="Главная цель, к которой стремится ваша семья. Все остальные цели должны вести к ней. Например: «Финансовая свобода к 50 годам» или «Дать детям лучшее образование»." />
          </div>
          
          {isEditing ? (
            <div className="flex gap-2">
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
              className="flex items-center justify-between cursor-pointer group"
              onClick={() => setIsEditing(true)}
            >
              <p className="text-lg font-medium">
                {northStar || "Нажмите, чтобы задать миссию семьи..."}
              </p>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--muted)]">
                ✏️
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
