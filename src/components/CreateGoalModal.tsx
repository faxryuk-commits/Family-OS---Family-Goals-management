"use client";

import { useState } from "react";
import { User } from "@prisma/client";
import { RESOURCES, HORIZONS, ResourceType } from "@/lib/types";

type CreateGoalModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description?: string;
    type: "FAMILY" | "PERSONAL";
    horizon: "SHORT" | "MID" | "LONG";
    deadline?: string;
    metric?: string;
    resources: ResourceType[];
    ownerId: string;
  }) => void;
  members: { user: User }[];
  currentUserId: string;
};

export function CreateGoalModal({
  isOpen,
  onClose,
  onCreate,
  members,
  currentUserId,
}: CreateGoalModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"FAMILY" | "PERSONAL">("PERSONAL");
  const [horizon, setHorizon] = useState<"SHORT" | "MID" | "LONG">("MID");
  const [deadline, setDeadline] = useState("");
  const [metric, setMetric] = useState("");
  const [resources, setResources] = useState<ResourceType[]>([]);
  const [ownerId, setOwnerId] = useState(currentUserId);

  if (!isOpen) return null;

  const toggleResource = (resource: ResourceType) => {
    setResources((prev) =>
      prev.includes(resource)
        ? prev.filter((r) => r !== resource)
        : [...prev, resource]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreate({
      title,
      description: description || undefined,
      type,
      horizon,
      deadline: deadline || undefined,
      metric: metric || undefined,
      resources,
      ownerId,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setType("PERSONAL");
    setHorizon("MID");
    setDeadline("");
    setMetric("");
    setResources([]);
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
          <h2 className="text-xl font-semibold">Новая цель</h2>
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
            <label className="block text-sm text-[var(--muted)] mb-2">
              Что именно? *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="Например: Открыть онлайн-бизнес"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-[var(--muted)] mb-2">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-[80px] resize-none"
              placeholder="Подробности..."
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm text-[var(--muted)] mb-2">
              Тип цели
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("PERSONAL")}
                className={`p-3 rounded-lg border transition-colors ${
                  type === "PERSONAL"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-[var(--card-border)]"
                }`}
              >
                <span className="text-lg">👤</span>
                <span className="block text-sm mt-1">Личная</span>
              </button>
              <button
                type="button"
                onClick={() => setType("FAMILY")}
                className={`p-3 rounded-lg border transition-colors ${
                  type === "FAMILY"
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-[var(--card-border)]"
                }`}
              >
                <span className="text-lg">👨‍👩‍👧</span>
                <span className="block text-sm mt-1">Семейная</span>
              </button>
            </div>
          </div>

          {/* Owner (for personal goals) */}
          {type === "PERSONAL" && (
            <div>
              <label className="block text-sm text-[var(--muted)] mb-2">
                Чья цель?
              </label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="select"
              >
                {members.map((member) => (
                  <option key={member.user.id} value={member.user.id}>
                    {member.user.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Horizon */}
          <div>
            <label className="block text-sm text-[var(--muted)] mb-2">
              Горизонт
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(HORIZONS) as [keyof typeof HORIZONS, typeof HORIZONS[keyof typeof HORIZONS]][]).map(
                ([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setHorizon(key)}
                    className={`p-2 rounded-lg border text-sm transition-colors ${
                      horizon === key
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-[var(--card-border)]"
                    }`}
                  >
                    {value.label}
                    <span className="block text-xs text-[var(--muted)]">
                      {value.description}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Resources */}
          <div>
            <label className="block text-sm text-[var(--muted)] mb-2">
              Какие ресурсы потребует?
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(RESOURCES) as [ResourceType, typeof RESOURCES[ResourceType]][]).map(
                ([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleResource(key)}
                    className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                      resources.includes(key)
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-[var(--card-border)]"
                    }`}
                  >
                    {value.icon} {value.label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm text-[var(--muted)] mb-2">
              Дедлайн
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input"
            />
          </div>

          {/* Metric */}
          <div>
            <label className="block text-sm text-[var(--muted)] mb-2">
              Как понять, что достигли?
            </label>
            <input
              type="text"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="input"
              placeholder="Например: $10,000 MRR"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Отмена
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              Создать цель
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
