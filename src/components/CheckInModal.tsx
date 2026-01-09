"use client";

import { useState } from "react";
import { User, Goal, Subtask } from "@prisma/client";
import { getCurrentWeek } from "@/lib/utils";

type GoalWithSubtasks = Goal & {
  owner: User;
  subtasks: Subtask[];
};

type CheckInModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    notes: string;
    blockers: string;
    wins: string;
    completedSubtaskIds: string[];
    goalComments: { goalId: string; comment: string }[];
  }) => void;
  currentUser: User;
  hasCheckedIn: boolean;
  userGoals: GoalWithSubtasks[]; // Цели текущего пользователя
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
  userGoals,
}: CheckInModalProps) {
  const [step, setStep] = useState(1); // 1: Прогресс по целям, 2: Общие итоги
  const [notes, setNotes] = useState("");
  const [blockers, setBlockers] = useState("");
  const [wins, setWins] = useState("");
  const [completedSubtaskIds, setCompletedSubtaskIds] = useState<string[]>([]);
  const [goalComments, setGoalComments] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const activeGoals = userGoals.filter(
    (g) => g.status === "ACTIVE" || g.status === "DRAFT"
  );

  const toggleSubtask = (subtaskId: string, currentlyCompleted: boolean) => {
    if (currentlyCompleted) {
      // Уже выполнено ранее - нельзя отменить здесь
      return;
    }
    setCompletedSubtaskIds((prev) =>
      prev.includes(subtaskId)
        ? prev.filter((id) => id !== subtaskId)
        : [...prev, subtaskId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      notes,
      blockers,
      wins,
      completedSubtaskIds,
      goalComments: Object.entries(goalComments)
        .filter(([, comment]) => comment.trim())
        .map(([goalId, comment]) => ({ goalId, comment })),
    });
    // Reset
    setNotes("");
    setBlockers("");
    setWins("");
    setCompletedSubtaskIds([]);
    setGoalComments({});
    setStep(1);
    onClose();
  };

  const week = getCurrentWeek();

  // Считаем сколько подзадач будет выполнено
  const newCompletedCount = completedSubtaskIds.length;

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
              <span>📋</span>
              Итоги недели
            </h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              {formatWeek(week)} • {currentUser.name || "Участник"} • Шаг {step} из 2
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
            ✅ Вы уже отметились на этой неделе. Можете обновить.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Goals Progress */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">🎯 Прогресс по целям</h3>
                {newCompletedCount > 0 && (
                  <span className="badge bg-green-500/20 text-green-400">
                    +{newCompletedCount} выполнено
                  </span>
                )}
              </div>

              {activeGoals.length === 0 ? (
                <div className="p-4 bg-[var(--background)] rounded-lg text-center text-[var(--muted)]">
                  <p>У вас пока нет активных целей</p>
                  <p className="text-sm mt-1">Создайте цель, чтобы отслеживать прогресс</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className="p-4 bg-[var(--background)] rounded-lg border border-[var(--card-border)]"
                    >
                      {/* Goal Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{goal.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-24 h-2 bg-[var(--card-border)] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 transition-all"
                                style={{ width: `${goal.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-[var(--muted)]">
                              {goal.progress}%
                            </span>
                          </div>
                        </div>
                        <span
                          className={`badge ${
                            goal.type === "FAMILY"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {goal.type === "FAMILY" ? "👨‍👩‍👧" : "👤"}
                        </span>
                      </div>

                      {/* Subtasks */}
                      {goal.subtasks.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs text-[var(--muted)] mb-2">
                            Отметьте выполненные этапы:
                          </p>
                          {goal.subtasks.map((subtask) => {
                            const isNewlyCompleted = completedSubtaskIds.includes(subtask.id);
                            const wasCompleted = subtask.completed;

                            return (
                              <label
                                key={subtask.id}
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                  wasCompleted
                                    ? "bg-green-500/10 opacity-60"
                                    : isNewlyCompleted
                                    ? "bg-green-500/20"
                                    : "hover:bg-[var(--card-border)]"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={wasCompleted || isNewlyCompleted}
                                  disabled={wasCompleted}
                                  onChange={() => toggleSubtask(subtask.id, wasCompleted)}
                                  className="w-5 h-5 rounded border-2 border-[var(--card-border)] bg-transparent checked:bg-green-500 checked:border-green-500"
                                />
                                <span
                                  className={
                                    wasCompleted ? "line-through text-[var(--muted)]" : ""
                                  }
                                >
                                  {subtask.title}
                                </span>
                                {wasCompleted && (
                                  <span className="ml-auto text-xs text-green-400">✓ выполнено</span>
                                )}
                                {isNewlyCompleted && !wasCompleted && (
                                  <span className="ml-auto text-xs text-green-400">+ сейчас</span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--muted)] italic">
                          Нет этапов. Добавьте их в редактировании цели.
                        </p>
                      )}

                      {/* Goal Comment */}
                      <div className="mt-3 pt-3 border-t border-[var(--card-border)]">
                        <input
                          type="text"
                          placeholder="Комментарий по этой цели..."
                          value={goalComments[goal.id] || ""}
                          onChange={(e) =>
                            setGoalComments((prev) => ({
                              ...prev,
                              [goal.id]: e.target.value,
                            }))
                          }
                          className="input text-sm py-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Next Button */}
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary flex-1"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn btn-primary flex-1"
                >
                  Далее →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: General Notes */}
          {step === 2 && (
            <div className="space-y-4">
              {/* What did you do? */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <span className="text-green-400">✓</span> Что ещё удалось сделать?
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input min-h-[80px] resize-none"
                  placeholder="Другие достижения за неделю..."
                />
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
                  placeholder="Что мешает? В чём нужна поддержка?"
                />
              </div>

              {/* Summary */}
              {newCompletedCount > 0 && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-400">
                    🎉 Отлично! Вы отметили {newCompletedCount}{" "}
                    {newCompletedCount === 1 ? "этап" : "этапа"} выполненным
                  </p>
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-secondary flex-1"
                >
                  ← Назад
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  {hasCheckedIn ? "Обновить" : "Отправить"} 🚀
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="mt-4 p-3 bg-[var(--background)] rounded-lg text-xs text-[var(--muted)]">
          💡 Отмечая этапы — вы автоматически обновляете прогресс целей!
        </div>
      </div>
    </div>
  );
}
