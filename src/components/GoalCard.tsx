"use client";

import { Goal, User } from "@prisma/client";
import { RESOURCES, HORIZONS, STATUSES, ResourceType, HorizonType, StatusType } from "@/lib/types";

type AssignedUser = {
  id: string;
  name: string | null;
  image: string | null;
};

type GoalCardProps = {
  goal: Goal & { owner: User; assignedTo?: AssignedUser | null; _count?: { comments: number } };
  hasConflict?: boolean;
  onProgressChange?: (progress: number) => void;
  onStatusChange?: (status: string) => void;
  onClick?: () => void;
  isOwner?: boolean; // Является ли текущий пользователь владельцем
  isAssignedToMe?: boolean; // Отмечен ли текущий пользователь
};

export function GoalCard({ 
  goal, 
  hasConflict, 
  onProgressChange,
  onClick,
  isOwner = false,
  isAssignedToMe = false,
}: GoalCardProps) {
  const resources = JSON.parse(goal.resources || "[]") as ResourceType[];
  const horizon = HORIZONS[goal.horizon as HorizonType] || HORIZONS.MID;
  const status = STATUSES[goal.status as StatusType] || STATUSES.DRAFT;
  const commentCount = goal._count?.comments || 0;

  return (
    <div 
      className={`card animate-fade-in group card-hover cursor-pointer ${
        hasConflict ? "conflict-indicator border-red-500/50" : ""
      } ${goal.status === "BLOCKED" ? "opacity-70" : ""} ${
        isAssignedToMe ? "ring-2 ring-pink-400/50 bg-pink-50/30" : ""
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`badge ${horizon.color}`}>
              {horizon.label}
            </span>
            <span className={`badge ${status.color}`}>
              {status.label}
            </span>
            {isAssignedToMe && (
              <span className="badge bg-pink-100 text-pink-600 border-pink-200">
                💝 Для тебя
              </span>
            )}
            {goal.assignedTo && !isAssignedToMe && (
              <span className="badge bg-pink-50 text-pink-500 border-pink-100">
                👋 {goal.assignedTo.name}
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold">{goal.title}</h3>
        </div>
        
        {/* Owner Avatar */}
        <div className="flex items-center gap-2">
          {isOwner && (
            <span className="text-xs text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">
              ✏️
            </span>
          )}
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              isOwner 
                ? "bg-gradient-to-br from-blue-400 to-purple-500 ring-2 ring-blue-400/50" 
                : "bg-gradient-to-br from-gray-400 to-gray-500"
            }`}
            title={goal.owner.name || ""}
          >
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

      {/* Footer: Deadline + Comments */}
      <div className="flex items-center justify-between text-sm text-[var(--muted)] mt-3 pt-3 border-t border-[var(--card-border)]">
        <div className="flex items-center gap-3">
          {goal.deadline && (
            <div className="flex items-center gap-1">
              <span>📅</span>
              <span>
                {new Date(goal.deadline).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
          )}
          {commentCount > 0 && (
            <div className="flex items-center gap-1">
              <span>💬</span>
              <span>{commentCount}</span>
            </div>
          )}
        </div>
        <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          Подробнее →
        </span>
      </div>
    </div>
  );
}
