"use client";

import { Conflict, Goal, User } from "@prisma/client";
import { RESOURCES, ResourceType } from "@/lib/types";

type ConflictAlertProps = {
  conflict: Conflict & {
    goalA: Goal & { owner: User };
    goalB: Goal & { owner: User };
  };
  onResolve: () => void;
};

// Понятные названия ресурсов
const resourceLabels: Record<ResourceType, string> = {
  MONEY: "деньги",
  TIME: "время",
  GEO: "место жительства",
  ENERGY: "силы и энергию",
  RISK: "готовность рисковать",
};

export function ConflictAlert({ conflict, onResolve }: ConflictAlertProps) {
  const sharedResources = JSON.parse(conflict.sharedResources || "[]") as ResourceType[];
  
  // Генерируем понятное объяснение
  const resourcesText = sharedResources.length > 0
    ? sharedResources.map(r => resourceLabels[r]).join(" и ")
    : "одни и те же ресурсы";

  return (
    <div className="card border-red-500/50 animate-fade-in">
      {/* Header with explanation */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">⚠️</span>
          <h3 className="font-semibold text-red-400">
            Эти цели конфликтуют
          </h3>
        </div>
        <p className="text-sm text-[var(--muted)]">
          Обе цели требуют <span className="text-amber-400">{resourcesText}</span>. 
          Нужно решить, как совместить или выбрать приоритет.
        </p>
      </div>

      {/* Goals in conflict */}
      <div className="space-y-3 mb-4">
        {/* Goal A */}
        <div className="p-4 bg-[var(--background)] rounded-lg border border-[var(--card-border)] relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-sm font-bold">
              {(conflict.goalA.owner.name || "?").charAt(0)}
            </div>
            <div>
              <span className="font-medium">{conflict.goalA.owner.name}</span>
              <span className="text-[var(--muted)] text-sm ml-2">хочет:</span>
            </div>
          </div>
          <p className="text-lg font-medium">{conflict.goalA.title}</p>
        </div>

        {/* VS indicator */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full">
            <span className="text-red-400 text-sm">конфликтует с</span>
          </div>
        </div>

        {/* Goal B */}
        <div className="p-4 bg-[var(--background)] rounded-lg border border-[var(--card-border)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-sm font-bold">
              {(conflict.goalB.owner.name || "?").charAt(0)}
            </div>
            <div>
              <span className="font-medium">{conflict.goalB.owner.name}</span>
              <span className="text-[var(--muted)] text-sm ml-2">хочет:</span>
            </div>
          </div>
          <p className="text-lg font-medium">{conflict.goalB.title}</p>
        </div>
      </div>

      {/* Shared Resources */}
      {sharedResources.length > 0 && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-sm text-amber-400 mb-2">🔄 Обе цели требуют:</p>
          <div className="flex flex-wrap gap-2">
            {sharedResources.map((resource) => (
              <span 
                key={resource}
                className="badge bg-amber-500/20 text-amber-300"
              >
                {RESOURCES[resource]?.icon} {RESOURCES[resource]?.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Explainer */}
      <div className="mb-4 p-3 bg-[var(--background)] rounded-lg text-sm text-[var(--muted)]">
        💡 Это нормально! В семье часто возникают такие ситуации. 
        Важно обсудить и найти решение вместе.
      </div>

      {/* Action */}
      <button
        onClick={onResolve}
        className="btn btn-primary w-full"
      >
        🤝 Решить вместе
      </button>
    </div>
  );
}
