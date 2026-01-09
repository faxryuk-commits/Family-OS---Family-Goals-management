"use client";

import { useState } from "react";
import { Goal, User } from "@prisma/client";
import { ResourceType } from "@/lib/types";

type GoalWithOwner = Goal & { owner: User };

type EditGoalModalProps = {
  isOpen: boolean;
  onClose: () => void;
  goal: GoalWithOwner;
  onUpdate: (data: {
    title: string;
    description?: string;
    type: "FAMILY" | "PERSONAL";
    horizon: "SHORT" | "MID" | "LONG";
    deadline?: string;
    metric?: string;
    resources: ResourceType[];
  }) => void;
  onDelete: () => void;
};

const horizonOptions = [
  { value: "SHORT", label: "1-3 месяца", emoji: "🏃" },
  { value: "MID", label: "3-12 месяцев", emoji: "🚶" },
  { value: "LONG", label: "1+ год", emoji: "🎯" },
];

const resourceOptions: { value: ResourceType; label: string; emoji: string }[] = [
  { value: "MONEY", label: "Деньги", emoji: "💰" },
  { value: "TIME", label: "Время", emoji: "⏰" },
  { value: "GEO", label: "Место", emoji: "🌍" },
  { value: "ENERGY", label: "Энергия", emoji: "⚡" },
  { value: "RISK", label: "Риск", emoji: "🎲" },
];

export function EditGoalModal({
  isOpen,
  onClose,
  goal,
  onUpdate,
  onDelete,
}: EditGoalModalProps) {
  const parsedResources = (() => {
    try {
      return JSON.parse(goal.resources || "[]") as ResourceType[];
    } catch {
      return [];
    }
  })();

  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description || "");
  const [type, setType] = useState<"FAMILY" | "PERSONAL">(goal.type as "FAMILY" | "PERSONAL");
  const [horizon, setHorizon] = useState<"SHORT" | "MID" | "LONG">(goal.horizon as "SHORT" | "MID" | "LONG");
  const [deadline, setDeadline] = useState(
    goal.deadline ? new Date(goal.deadline).toISOString().split("T")[0] : ""
  );
  const [metric, setMetric] = useState(goal.metric || "");
  const [resources, setResources] = useState<ResourceType[]>(parsedResources);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onUpdate({
      title,
      description: description || undefined,
      type,
      horizon,
      deadline: deadline || undefined,
      metric: metric || undefined,
      resources,
    });
    onClose();
  };

  const toggleResource = (resource: ResourceType) => {
    setResources((prev) =>
      prev.includes(resource)
        ? prev.filter((r) => r !== resource)
        : [...prev, resource]
    );
  };

  const handleDelete = () => {
    onDelete();
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
      <div className="relative w-full max-w-lg card animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">✏️ Редактировать цель</h2>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Название цели *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="Например: Переехать в новую квартиру"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-[80px] resize-none"
              placeholder="Подробности о цели..."
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Тип цели</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("PERSONAL")}
                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                  type === "PERSONAL"
                    ? "bg-blue-500/20 border-blue-500 text-blue-300"
                    : "border-[var(--border)] hover:border-[var(--muted)]"
                }`}
              >
                👤 Личная
              </button>
              <button
                type="button"
                onClick={() => setType("FAMILY")}
                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                  type === "FAMILY"
                    ? "bg-purple-500/20 border-purple-500 text-purple-300"
                    : "border-[var(--border)] hover:border-[var(--muted)]"
                }`}
              >
                👨‍👩‍👧 Семейная
              </button>
            </div>
          </div>

          {/* Horizon */}
          <div>
            <label className="block text-sm font-medium mb-2">Горизонт</label>
            <div className="flex gap-2">
              {horizonOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setHorizon(option.value as "SHORT" | "MID" | "LONG")}
                  className={`flex-1 py-2 px-3 rounded-lg border transition-colors text-sm ${
                    horizon === option.value
                      ? "bg-green-500/20 border-green-500 text-green-300"
                      : "border-[var(--border)] hover:border-[var(--muted)]"
                  }`}
                >
                  {option.emoji} {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Какие ресурсы потребуются?
            </label>
            <div className="flex flex-wrap gap-2">
              {resourceOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleResource(option.value)}
                  className={`py-2 px-3 rounded-lg border transition-colors text-sm ${
                    resources.includes(option.value)
                      ? "bg-amber-500/20 border-amber-500 text-amber-300"
                      : "border-[var(--border)] hover:border-[var(--muted)]"
                  }`}
                >
                  {option.emoji} {option.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--muted)] mt-1">
              Важно для определения конфликтов между целями
            </p>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium mb-2">Дедлайн</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input"
            />
          </div>

          {/* Metric */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Как поймёте, что достигли?
            </label>
            <input
              type="text"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="input"
              placeholder="Например: Подписан договор аренды"
            />
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
              Сохранить
            </button>
          </div>
        </form>

        {/* Delete Section */}
        <div className="mt-6 pt-6 border-t border-[var(--border)]">
          {showDeleteConfirm ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm mb-3">
                Вы уверены? Цель будет удалена безвозвратно.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn btn-secondary flex-1"
                >
                  Отмена
                </button>
                <button
                  onClick={handleDelete}
                  className="btn flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  Удалить
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-400 text-sm hover:text-red-300"
            >
              🗑️ Удалить цель
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
