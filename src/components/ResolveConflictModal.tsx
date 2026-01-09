"use client";

import { useState } from "react";
import { Conflict, Goal, User } from "@prisma/client";
import { STRATEGIES, RESOURCES, ResourceType } from "@/lib/types";

type ResolveConflictModalProps = {
  isOpen: boolean;
  onClose: () => void;
  conflict: Conflict & {
    goalA: Goal & { owner: User };
    goalB: Goal & { owner: User };
  };
  onResolve: (data: {
    strategy: keyof typeof STRATEGIES;
    description?: string;
    cost?: string;
    compensation?: string;
    reviewDate?: string;
  }) => void;
};

export function ResolveConflictModal({
  isOpen,
  onClose,
  conflict,
  onResolve,
}: ResolveConflictModalProps) {
  const [strategy, setStrategy] = useState<keyof typeof STRATEGIES | null>(null);
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [compensation, setCompensation] = useState("");
  const [reviewDate, setReviewDate] = useState("");

  if (!isOpen) return null;

  const sharedResources = JSON.parse(conflict.sharedResources || "[]") as ResourceType[];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!strategy || !cost.trim() || !compensation.trim()) return;

    onResolve({
      strategy,
      description: description || undefined,
      cost,
      compensation,
      reviewDate: reviewDate || undefined,
    });

    // Reset
    setStrategy(null);
    setDescription("");
    setCost("");
    setCompensation("");
    setReviewDate("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl card animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-red-400">
            🔧 Разрешение конфликта
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Conflict Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-bold">
                {conflict.goalA.owner.name.charAt(0)}
              </div>
              <span className="text-sm text-[var(--muted)]">
                {conflict.goalA.owner.name}
              </span>
            </div>
            <p className="font-medium">{conflict.goalA.title}</p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-xs font-bold">
                {conflict.goalB.owner.name.charAt(0)}
              </div>
              <span className="text-sm text-[var(--muted)]">
                {conflict.goalB.owner.name}
              </span>
            </div>
            <p className="font-medium">{conflict.goalB.title}</p>
          </div>
        </div>

        {/* Shared Resources */}
        <div className="mb-6">
          <p className="text-sm text-[var(--muted)] mb-2">Конфликтующие ресурсы:</p>
          <div className="flex flex-wrap gap-2">
            {sharedResources.map((resource) => (
              <span
                key={resource}
                className="badge bg-red-500/20 text-red-400"
              >
                {RESOURCES[resource]?.icon} {RESOURCES[resource]?.label}
              </span>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Strategy Selection */}
          <div>
            <label className="block text-sm text-[var(--muted)] mb-3">
              Выберите стратегию разрешения *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(Object.entries(STRATEGIES) as [keyof typeof STRATEGIES, typeof STRATEGIES[keyof typeof STRATEGIES]][]).map(
                ([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setStrategy(key)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      strategy === key
                        ? value.color + " border-opacity-100"
                        : "border-[var(--card-border)] hover:border-[var(--muted)]"
                    }`}
                  >
                    <span className="text-2xl">{value.icon}</span>
                    <h4 className="font-medium mt-2">{value.label}</h4>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      {value.description}
                    </p>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Description */}
          {strategy && (
            <>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-2">
                  Описание решения
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input min-h-[80px] resize-none"
                  placeholder="Как именно будет реализована эта стратегия..."
                />
              </div>

              {/* Cost - who sacrifices what */}
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <label className="block text-sm font-medium text-yellow-400 mb-2">
                  💰 Цена решения (кто чем жертвует) *
                </label>
                <textarea
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="input min-h-[60px] resize-none"
                  placeholder="Например: Фахриддин откладывает масштабирование бизнеса на 6 месяцев"
                  required
                />
              </div>

              {/* Compensation */}
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <label className="block text-sm font-medium text-green-400 mb-2">
                  🎁 Компенсация (что получает взамен) *
                </label>
                <textarea
                  value={compensation}
                  onChange={(e) => setCompensation(e.target.value)}
                  className="input min-h-[60px] resize-none"
                  placeholder="Например: 2 семейных поездки в год + гарантия пересмотра через 6 месяцев"
                  required
                />
              </div>

              {/* Review Date */}
              <div>
                <label className="block text-sm text-[var(--muted)] mb-2">
                  📅 Дата пересмотра решения
                </label>
                <input
                  type="date"
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                  className="input"
                />
              </div>
            </>
          )}

          {/* Submit */}
          <div className="flex gap-2 pt-4 border-t border-[var(--card-border)]">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!strategy || !cost.trim() || !compensation.trim()}
              className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✅ Принять решение
            </button>
          </div>
        </form>

        {/* Warning */}
        <div className="mt-4 p-3 bg-[var(--background)] rounded-lg text-xs text-[var(--muted)]">
          ⚠️ После принятия решения создаётся семейное соглашение. Изменение условий возможно только через пересмотр.
        </div>
      </div>
    </div>
  );
}
