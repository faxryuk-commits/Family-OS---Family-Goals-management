"use client";

import { Goal, User } from "@prisma/client";
import { RESOURCES, HORIZONS, STATUSES, ResourceType, HorizonType, StatusType } from "@/lib/types";

type GoalCardProps = {
  goal: Goal & { owner: User };
  hasConflict?: boolean;
  onProgressChange?: (progress: number) => void;
  onStatusChange?: (status: string) => void;
  onClick?: () => void;
};

export function GoalCard({ 
  goal, 
  hasConflict, 
  onProgressChange,
  onClick 
}: GoalCardProps) {
  const resources = JSON.parse(goal.resources || "[]") as ResourceType[];
  const horizon = HORIZONS[goal.horizon as HorizonType] || HORIZONS.MID;
  const status = STATUSES[goal.status as StatusType] || STATUSES.DRAFT;

  return (
    <div 
      className={`card card-hover cursor-pointer animate-fade-in ${
        hasConflict ? "conflict-indicator border-red-500/50" : ""
      } ${goal.status === "BLOCKED" ? "opacity-70" : ""}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`badge ${horizon.color}`}>
              {horizon.label}
            </span>
            <span className={`badge ${status.color}`}>
              {status.label}
            </span>
          </div>
          <h3 className="text-lg font-semibold">{goal.title}</h3>
        </div>
        
        {/* Owner Avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold">
            {(goal.owner.name || "?").charAt(0)}
          </div>
        </div>
      </div>

      {/* Description */}
      {goal.description && (
        <p className="text-sm text-[var(--muted)] mb-3 line-clamp-2">
          {goal.description}
        </p>
      )}

      {/* Resources */}
      {resources.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {resources.map((resource) => (
            <span 
              key={resource}
              className={`text-sm ${RESOURCES[resource]?.color || ""}`}
              title={RESOURCES[resource]?.label}
            >
              {RESOURCES[resource]?.icon} {RESOURCES[resource]?.label}
            </span>
          ))}
        </div>
      )}

      {/* Metric */}
      {goal.metric && (
        <div className="flex items-center gap-2 text-sm text-[var(--muted)] mb-3">
          <span>📊</span>
          <span>{goal.metric}</span>
        </div>
      )}

      {/* Progress */}
      <div className="mt-auto">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-[var(--muted)]">Прогресс</span>
          <span className="font-medium">{goal.progress}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-bar-fill"
            style={{ width: `${goal.progress}%` }}
          />
        </div>
        
        {/* Quick progress buttons */}
        {goal.status === "ACTIVE" && onProgressChange && (
          <div className="flex gap-1 mt-2">
            {[25, 50, 75, 100].map((value) => (
              <button
                key={value}
                onClick={(e) => {
                  e.stopPropagation();
                  onProgressChange(value);
                }}
                className={`flex-1 py-1 text-xs rounded transition-colors ${
                  goal.progress >= value 
                    ? "bg-blue-500 text-white" 
                    : "bg-[var(--card-border)] hover:bg-[var(--muted)]"
                }`}
              >
                {value}%
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Deadline */}
      {goal.deadline && (
        <div className="flex items-center gap-2 text-sm text-[var(--muted)] mt-3 pt-3 border-t border-[var(--card-border)]">
          <span>📅</span>
          <span>
            {new Date(goal.deadline).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      )}
    </div>
  );
}
