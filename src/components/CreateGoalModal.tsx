"use client";

import { useState } from "react";
import { User } from "@prisma/client";
import { ResourceType } from "@/lib/types";
import { HelpIcon } from "./Tooltip";

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

const horizonOptions = [
  { 
    value: "SHORT", 
    label: "Быстро", 
    sublabel: "1-3 месяца",
    emoji: "🏃",
    example: "Записаться в спортзал, прочитать книгу"
  },
  { 
    value: "MID", 
    label: "В этом году", 
    sublabel: "3-12 месяцев",
    emoji: "🎯",
    example: "Сменить работу, накопить на отпуск"
  },
  { 
    value: "LONG", 
    label: "Большая цель", 
    sublabel: "1+ год",
    emoji: "🏔️",
    example: "Купить квартиру, открыть бизнес"
  },
];

const resourceOptions: { value: ResourceType; label: string; emoji: string; description: string }[] = [
  { value: "MONEY", label: "Деньги", emoji: "💰", description: "Нужны финансовые вложения" },
  { value: "TIME", label: "Время", emoji: "⏰", description: "Требует много времени" },
  { value: "GEO", label: "Место", emoji: "🌍", description: "Зависит от местоположения" },
  { value: "ENERGY", label: "Силы", emoji: "⚡", description: "Нужно много энергии" },
  { value: "RISK", label: "Риск", emoji: "🎲", description: "Есть неопределённость" },
];

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
  const [step, setStep] = useState(1);

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
    setStep(1);
    onClose();
  };

  const canProceed = step === 1 ? title.trim().length > 0 : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg card animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span>🎯</span>
              Новая цель
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Шаг {step} из 2
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Чего вы хотите достичь? *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input text-lg"
                  placeholder="Например: Накопить на отпуск в Турции"
                  required
                  autoFocus
                />
                <p className="text-xs text-[var(--muted)] mt-1">
                  Сформулируйте конкретно — так проще достичь
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Зачем это важно?
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input min-h-[80px] resize-none"
                  placeholder="Почему эта цель важна для вас/семьи?"
                />
              </div>

              {/* Type */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium">Это цель для...</label>
                  <HelpIcon text="Личная цель — ваша собственная, но семья её видит. Семейная — общая для всех, работаете вместе." />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType("PERSONAL")}
                    className={`p-4 rounded-lg border transition-all ${
                      type === "PERSONAL"
                        ? "border-blue-500 bg-blue-500/10 scale-[1.02]"
                        : "border-[var(--card-border)] hover:border-[var(--muted)]"
                    }`}
                  >
                    <span className="text-2xl">👤</span>
                    <span className="block text-sm font-medium mt-1">Меня лично</span>
                    <span className="block text-xs text-[var(--muted)]">Личная цель</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("FAMILY")}
                    className={`p-4 rounded-lg border transition-all ${
                      type === "FAMILY"
                        ? "border-purple-500 bg-purple-500/10 scale-[1.02]"
                        : "border-[var(--card-border)] hover:border-[var(--muted)]"
                    }`}
                  >
                    <span className="text-2xl">👨‍👩‍👧</span>
                    <span className="block text-sm font-medium mt-1">Всей семьи</span>
                    <span className="block text-xs text-[var(--muted)]">Работаем вместе</span>
                  </button>
                </div>
              </div>

              {/* Owner (for personal goals) */}
              {type === "PERSONAL" && members.length > 1 && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Чья это цель?
                  </label>
                  <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="select"
                  >
                    {members.map((member) => (
                      <option key={member.user.id} value={member.user.id}>
                        {member.user.name} {member.user.id === currentUserId ? "(Я)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Next button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!canProceed}
                  className="btn btn-primary w-full"
                >
                  Далее →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              {/* Goal preview */}
              <div className="p-3 bg-[var(--background)] rounded-lg">
                <p className="text-sm text-[var(--muted)]">Цель:</p>
                <p className="font-medium">{title}</p>
              </div>

              {/* Horizon */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium">Когда хотите достичь?</label>
                  <HelpIcon text="Примерный срок помогает правильно планировать. Не волнуйтесь, его можно изменить позже." />
                </div>
                <div className="space-y-2">
                  {horizonOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setHorizon(option.value as "SHORT" | "MID" | "LONG")}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        horizon === option.value
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-[var(--card-border)] hover:border-[var(--muted)]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{option.emoji}</span>
                        <div className="flex-1">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-[var(--muted)] ml-2 text-sm">
                            {option.sublabel}
                          </span>
                          <p className="text-xs text-[var(--muted)]">
                            Например: {option.example}
                          </p>
                        </div>
                        {horizon === option.value && (
                          <span className="text-blue-400">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium">Что понадобится?</label>
                  <HelpIcon text="Это важно! Если две цели требуют одинаковых ресурсов (например, обе нужны деньги), система предупредит о возможном конфликте." />
                </div>
                <div className="flex flex-wrap gap-2">
                  {resourceOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleResource(option.value)}
                      title={option.description}
                      className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                        resources.includes(option.value)
                          ? "border-amber-500 bg-amber-500/10 text-amber-300"
                          : "border-[var(--card-border)] hover:border-[var(--muted)]"
                      }`}
                    >
                      {option.emoji} {option.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Выберите все, что потребуется для этой цели
                </p>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Конкретная дата (если есть)
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
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium">Как поймёте, что достигли?</label>
                  <HelpIcon text="Конкретный результат помогает понять, когда цель выполнена. Например: 'На счёте 500,000₽' или 'Получил оффер'." />
                </div>
                <input
                  type="text"
                  value={metric}
                  onChange={(e) => setMetric(e.target.value)}
                  className="input"
                  placeholder="Например: Билеты куплены, отель забронирован"
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
                <button type="submit" className="btn btn-primary flex-1">
                  Создать цель 🎯
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
