"use client";

import { useState } from "react";
import { User } from "@prisma/client";
import { getCurrentWeek } from "@/lib/utils";

type CheckInModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    notes: string;
    blockers: string;
    wins: string;
  }) => void;
  currentUser: User;
  hasCheckedIn: boolean;
};

// Форматируем номер недели в читаемый вид
function formatWeek(week: string): string {
  const match = week.match(/(\d+)-W(\d+)/);
  if (!match) return week;
  const [, year, weekNum] = match;
  return `Неделя ${weekNum}, ${year}`;
}

export function CheckInModal({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
  hasCheckedIn,
}: CheckInModalProps) {
  const [notes, setNotes] = useState("");
  const [blockers, setBlockers] = useState("");
  const [wins, setWins] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ notes, blockers, wins });
    setNotes("");
    setBlockers("");
    setWins("");
    onClose();
  };

  const week = getCurrentWeek();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg card animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span>📋</span>
              Итоги недели
            </h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              {formatWeek(week)} • {currentUser.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {hasCheckedIn && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            ✅ Вы уже отметились на этой неделе. Можете обновить ответы.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* What did you do? */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <span className="text-green-400">✓</span> Что удалось сделать?
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input min-h-[80px] resize-none"
              placeholder="Расскажите о своём прогрессе к целям..."
            />
            <p className="text-xs text-[var(--muted)] mt-1">
              Какие шаги сделали к своим целям?
            </p>
          </div>

          {/* Wins */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <span className="text-yellow-400">🏆</span> Чем гордитесь?
            </label>
            <textarea
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              className="input min-h-[60px] resize-none"
              placeholder="Маленькие и большие победы..."
            />
            <p className="text-xs text-[var(--muted)] mt-1">
              Даже маленькие успехи важны!
            </p>
          </div>

          {/* Blockers */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <span className="text-red-400">🚧</span> Где нужна помощь?
            </label>
            <textarea
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              className="input min-h-[60px] resize-none"
              placeholder="Что мешает? В чём нужна поддержка семьи?"
            />
            <p className="text-xs text-[var(--muted)] mt-1">
              Семья рядом и готова помочь
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Отмена
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              {hasCheckedIn ? "Обновить" : "Отправить"}
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-[var(--background)] rounded-lg text-xs text-[var(--muted)]">
          💡 Регулярные итоги помогают не забросить цели и вовремя попросить помощь.
        </div>
      </div>
    </div>
  );
}
