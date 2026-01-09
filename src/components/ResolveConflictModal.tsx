"use client";

import { useState } from "react";
import { Conflict, Goal, User } from "@prisma/client";
import { RESOURCES, ResourceType } from "@/lib/types";
import { HelpIcon } from "./Tooltip";

type ResolveConflictModalProps = {
  isOpen: boolean;
  onClose: () => void;
  conflict: Conflict & {
    goalA: Goal & { owner: User };
    goalB: Goal & { owner: User };
  };
  onResolve: (data: {
    strategy: string;
    description?: string;
    cost?: string;
    compensation?: string;
    reviewDate?: string;
  }) => void;
};

// Понятные стратегии без жаргона
const strategies = [
  {
    key: "COMPROMISE",
    icon: "🤝",
    label: "Найти золотую середину",
    shortLabel: "Компромисс",
    description: "Оба немного уступают, но оба получают часть желаемого",
    example: "Вместо Турции едем в Грузию — дешевле и ближе к бизнесу",
    color: "border-blue-500 bg-blue-500/10",
  },
  {
    key: "SEQUENCE",
    icon: "📅",
    label: "Сделать по очереди",
    shortLabel: "По очереди",
    description: "Сначала одно, потом другое. Обе цели достигаются, но не сразу",
    example: "Этот год — бизнес, следующий — переезд",
    color: "border-purple-500 bg-purple-500/10",
  },
  {
    key: "TRANSFORM",
    icon: "💡",
    label: "Объединить в одну цель",
    shortLabel: "Объединить",
    description: "Найти третий путь, который удовлетворит обе стороны",
    example: "Открыть удалённый бизнес, который можно вести из любой страны",
    color: "border-green-500 bg-green-500/10",
  },
  {
    key: "PRIORITY",
    icon: "⚖️",
    label: "Выбрать приоритет",
    shortLabel: "Приоритет",
    description: "Одна цель важнее прямо сейчас, вторая откладывается",
    example: "Переезд важнее — бизнес подождёт",
    color: "border-amber-500 bg-amber-500/10",
  },
  {
    key: "DROP",
    icon: "❌",
    label: "Отказаться от одной",
    shortLabel: "Отказ",
    description: "Осознанно отменить одну из целей — и это нормально",
    example: "Понимаю, что бизнес не вписывается в наши планы",
    color: "border-red-500 bg-red-500/10",
  },
];

export function ResolveConflictModal({
  isOpen,
  onClose,
  conflict,
  onResolve,
}: ResolveConflictModalProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [compensation, setCompensation] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  const sharedResources = JSON.parse(conflict.sharedResources || "[]") as ResourceType[];
  const strategy = strategies.find(s => s.key === selectedStrategy);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStrategy || !cost.trim() || !compensation.trim()) return;

    onResolve({
      strategy: selectedStrategy,
      description: description || undefined,
      cost,
      compensation,
      reviewDate: reviewDate || undefined,
    });

    // Reset
    setSelectedStrategy(null);
    setDescription("");
    setCost("");
    setCompensation("");
    setReviewDate("");
    setStep(1);
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
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span>🤝</span>
              Решаем вместе
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Шаг {step} из 2 — {step === 1 ? "Выбираем подход" : "Договариваемся об условиях"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Conflict Summary - Always visible */}
        <div className="mb-6 p-4 bg-[var(--background)] rounded-lg">
          <p className="text-sm text-[var(--muted)] mb-3">Конфликтующие цели:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-sm font-bold">
                {conflict.goalA.owner.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm text-[var(--muted)]">{conflict.goalA.owner.name}</p>
                <p className="font-medium">{conflict.goalA.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-sm font-bold">
                {conflict.goalB.owner.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm text-[var(--muted)]">{conflict.goalB.owner.name}</p>
                <p className="font-medium">{conflict.goalB.title}</p>
              </div>
            </div>
          </div>
          {sharedResources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--muted)]">
                Обе цели требуют: {sharedResources.map(r => RESOURCES[r]?.label).join(", ")}
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              {/* Strategy Selection */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <label className="text-sm font-medium">Как будем решать?</label>
                  <HelpIcon text="Нет правильного или неправильного способа. Выберите то, что подходит вашей ситуации." />
                </div>
                <div className="space-y-3">
                  {strategies.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setSelectedStrategy(s.key)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        selectedStrategy === s.key
                          ? s.color + " scale-[1.01]"
                          : "border-[var(--card-border)] hover:border-[var(--muted)]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{s.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-medium">{s.label}</h4>
                          <p className="text-sm text-[var(--muted)] mt-1">
                            {s.description}
                          </p>
                          <p className="text-xs text-blue-400 mt-2">
                            💡 Пример: {s.example}
                          </p>
                        </div>
                        {selectedStrategy === s.key && (
                          <span className="text-xl">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Next button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!selectedStrategy}
                  className="btn btn-primary w-full disabled:opacity-50"
                >
                  Далее — договориться об условиях →
                </button>
              </div>
            </div>
          )}

          {step === 2 && strategy && (
            <div className="space-y-4 animate-fade-in">
              {/* Selected strategy reminder */}
              <div className={`p-3 rounded-lg ${strategy.color}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{strategy.icon}</span>
                  <span className="font-medium">{strategy.label}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Как конкретно это будет работать?
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input min-h-[80px] resize-none"
                  placeholder="Опишите подробности вашего решения..."
                />
              </div>

              {/* Cost */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium text-amber-400">
                    💰 Кто чем жертвует? *
                  </label>
                  <HelpIcon text="Честно запишите, что каждый теряет или от чего отказывается. Это важно для справедливости." />
                </div>
                <textarea
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="input min-h-[60px] resize-none"
                  placeholder={`Например: ${conflict.goalA.owner.name} откладывает свою цель на 6 месяцев`}
                  required
                />
              </div>

              {/* Compensation */}
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium text-green-400">
                    🎁 Что получает взамен? *
                  </label>
                  <HelpIcon text="Тот, кто уступает больше, должен что-то получить взамен. Это делает решение честным." />
                </div>
                <textarea
                  value={compensation}
                  onChange={(e) => setCompensation(e.target.value)}
                  className="input min-h-[60px] resize-none"
                  placeholder="Например: 2 совместных отпуска в год + пересмотр решения через 6 месяцев"
                  required
                />
              </div>

              {/* Review Date */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium">
                    📅 Когда пересмотрим это решение?
                  </label>
                  <HelpIcon text="Жизнь меняется. Запланируйте дату, когда вернётесь к этому вопросу." />
                </div>
                <input
                  type="date"
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                  className="input"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-secondary flex-1"
                >
                  ← Назад
                </button>
                <button
                  type="submit"
                  disabled={!cost.trim() || !compensation.trim()}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  ✅ Договорились!
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Info */}
        <div className="mt-4 p-3 bg-[var(--background)] rounded-lg text-xs text-[var(--muted)]">
          💡 После согласия создаётся семейный договор. Вы всегда сможете его пересмотреть в разделе «Договоры».
        </div>
      </div>
    </div>
  );
}
