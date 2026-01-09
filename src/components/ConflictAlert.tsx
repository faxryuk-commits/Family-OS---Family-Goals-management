"use client";

import { Conflict, Goal, User } from "@prisma/client";
import { CONFLICT_TYPES, RESOURCES, ResourceType } from "@/lib/types";

type ConflictAlertProps = {
  conflict: Conflict & {
    goalA: Goal & { owner: User };
    goalB: Goal & { owner: User };
  };
  onResolve: () => void;
};

export function ConflictAlert({ conflict, onResolve }: ConflictAlertProps) {
  const conflictType = CONFLICT_TYPES[conflict.type];
  const sharedResources = JSON.parse(conflict.sharedResources || "[]") as ResourceType[];

  return (
    <div className="card border-red-500/50 animate-fade-in animate-pulse-glow">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-3 h-3 rounded-full ${conflictType.color}`} />
        <div>
          <h3 className="font-semibold text-red-400">{conflictType.label}</h3>
          <p className="text-sm text-[var(--muted)]">{conflictType.description}</p>
        </div>
      </div>

      {/* Goals in conflict */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Goal A */}
        <div className="p-4 bg-[var(--background)] rounded-lg border border-[var(--card-border)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-bold">
              {conflict.goalA.owner.name.charAt(0)}
            </div>
            <span className="text-sm text-[var(--muted)]">
              {conflict.goalA.owner.name}
            </span>
          </div>
          <h4 className="font-medium">{conflict.goalA.title}</h4>
        </div>

        {/* VS */}
        <div className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="text-2xl">⚡</span>
        </div>

        {/* Goal B */}
        <div className="p-4 bg-[var(--background)] rounded-lg border border-[var(--card-border)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-xs font-bold">
              {conflict.goalB.owner.name.charAt(0)}
            </div>
            <span className="text-sm text-[var(--muted)]">
              {conflict.goalB.owner.name}
            </span>
          </div>
          <h4 className="font-medium">{conflict.goalB.title}</h4>
        </div>
      </div>

      {/* Shared Resources */}
      {sharedResources.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-[var(--muted)] mb-2">Пересекающиеся ресурсы:</p>
          <div className="flex flex-wrap gap-2">
            {sharedResources.map((resource) => (
              <span 
                key={resource}
                className={`badge bg-red-500/20 text-red-400`}
              >
                {RESOURCES[resource]?.icon} {RESOURCES[resource]?.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action */}
      <button
        onClick={onResolve}
        className="btn btn-danger w-full"
      >
        🔧 Решить конфликт
      </button>
    </div>
  );
}
