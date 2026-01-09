"use client";

import { useState } from "react";
import { Agreement, Conflict, Goal, User, Resolution } from "@prisma/client";
import { updateAgreementStatus } from "@/lib/actions/agreements";

type AgreementWithRelations = Agreement & {
  conflict: (Conflict & {
    goalA: Goal & { owner: User };
    goalB: Goal & { owner: User };
    resolution: Resolution | null;
  }) | null;
};

type AgreementsListProps = {
  agreements: AgreementWithRelations[];
};

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  ACTIVE: {
    label: "Активно",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
  },
  EXPIRED: {
    label: "Истекло",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
  },
  REVISED: {
    label: "Пересмотрено",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
  CANCELLED: {
    label: "Отменено",
    color: "text-gray-400",
    bgColor: "bg-gray-500/20",
  },
};

const strategyLabels: Record<string, { emoji: string; label: string }> = {
  COMPROMISE: { emoji: "🤝", label: "Компромисс" },
  SEQUENCE: { emoji: "📅", label: "По очереди" },
  TRANSFORM: { emoji: "🔄", label: "Трансформация" },
  PRIORITY: { emoji: "⚖️", label: "Приоритет" },
  DROP: { emoji: "❌", label: "Отказ" },
};

export function AgreementsList({ agreements }: AgreementsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (agreements.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-5xl mb-4">📜</p>
        <h3 className="text-xl font-semibold mb-2">Пока нет договоров</h3>
        <p className="text-[var(--muted)] max-w-md mx-auto">
          Когда вы решите первый конфликт между целями, здесь появится договор с
          условиями решения.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {agreements.map((agreement) => {
        const isExpanded = expandedId === agreement.id;
        const status = statusConfig[agreement.status] || statusConfig.ACTIVE;
        const resolution = agreement.conflict?.resolution;
        const strategy = resolution
          ? strategyLabels[resolution.strategy]
          : null;

        const daysUntilExpiry = agreement.validUntil
          ? Math.ceil(
              (new Date(agreement.validUntil).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            )
          : null;

        return (
          <div
            key={agreement.id}
            className={`card transition-all duration-200 ${
              isExpanded ? "ring-2 ring-blue-500/50" : ""
            }`}
          >
            {/* Header */}
            <div
              className="flex items-start justify-between cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : agreement.id)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`badge ${status.bgColor} ${status.color} text-xs`}
                  >
                    {status.label}
                  </span>
                  {strategy && (
                    <span className="badge bg-purple-500/20 text-purple-300 text-xs">
                      {strategy.emoji} {strategy.label}
                    </span>
                  )}
                  {daysUntilExpiry !== null && daysUntilExpiry <= 14 && daysUntilExpiry > 0 && (
                    <span className="badge bg-yellow-500/20 text-yellow-300 text-xs">
                      ⏰ {daysUntilExpiry} дн. до пересмотра
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-lg">{agreement.title}</h3>
                <p className="text-sm text-[var(--muted)] mt-1">
                  Создано{" "}
                  {new Date(agreement.createdAt).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button className="text-[var(--muted)] hover:text-white p-2">
                {isExpanded ? "▲" : "▼"}
              </button>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-[var(--border)] animate-fade-in">
                {/* Conflicting Goals */}
                {agreement.conflict && (
                  <div className="mb-4">
                    <p className="text-sm text-[var(--muted)] mb-2">
                      Конфликтующие цели:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-[var(--background)] rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold">
                            {agreement.conflict.goalA.owner.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium">
                            {agreement.conflict.goalA.owner.name}
                          </span>
                        </div>
                        <p className="text-sm">
                          {agreement.conflict.goalA.title}
                        </p>
                      </div>
                      <div className="p-3 bg-[var(--background)] rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center text-xs font-bold">
                            {agreement.conflict.goalB.owner.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium">
                            {agreement.conflict.goalB.owner.name}
                          </span>
                        </div>
                        <p className="text-sm">
                          {agreement.conflict.goalB.title}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Terms */}
                <div className="mb-4">
                  <p className="text-sm text-[var(--muted)] mb-2">
                    Условия договора:
                  </p>
                  <div className="p-3 bg-[var(--background)] rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">
                      {agreement.terms}
                    </p>
                  </div>
                </div>

                {/* Resolution Details */}
                {resolution && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {resolution.cost && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-xs text-red-400 mb-1">💸 Цена:</p>
                        <p className="text-sm">{resolution.cost}</p>
                      </div>
                    )}
                    {resolution.compensation && (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-xs text-green-400 mb-1">
                          🎁 Компенсация:
                        </p>
                        <p className="text-sm">{resolution.compensation}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Valid Until */}
                {agreement.validUntil && (
                  <div className="mb-4 p-3 bg-[var(--background)] rounded-lg">
                    <p className="text-sm">
                      📅 Действует до:{" "}
                      <span className="font-medium">
                        {new Date(agreement.validUntil).toLocaleDateString(
                          "ru-RU",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </p>
                  </div>
                )}

                {/* Actions */}
                {agreement.status === "ACTIVE" && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() =>
                        updateAgreementStatus(agreement.id, "REVISED")
                      }
                      className="btn btn-secondary text-sm"
                    >
                      🔄 Пересмотреть
                    </button>
                    <button
                      onClick={() =>
                        updateAgreementStatus(agreement.id, "CANCELLED")
                      }
                      className="btn btn-secondary text-sm text-red-400 hover:bg-red-500/20"
                    >
                      ❌ Отменить
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
