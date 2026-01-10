"use client";

import { useState, useEffect } from "react";
import { Goal, Subtask, Comment } from "@prisma/client";
import { ResourceType, RESOURCES, HORIZONS, STATUSES, HorizonType, StatusType } from "@/lib/types";
import { createComment, getGoalComments, deleteComment } from "@/lib/actions/comments";
import { getLevelFromXp } from "@/lib/gamification-utils";

type Author = {
  id: string;
  name: string | null;
  image: string | null;
  level: number;
};

type CommentWithAuthor = Comment & {
  author: Author;
};

type AssignedUser = {
  id: string;
  name: string | null;
  image: string | null;
};

type GoalWithDetails = Goal & {
  owner: Author;
  assignedTo?: AssignedUser | null;
  subtasks: Subtask[];
  comments: CommentWithAuthor[];
  _count: { comments: number };
  images?: string | null;
};

type GoalDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  goal: GoalWithDetails;
  currentUserId: string;
  onEdit?: () => void;
};

function getLevelColor(level: number): string {
  if (level >= 25) return "from-yellow-400 to-amber-600";
  if (level >= 10) return "from-purple-400 to-pink-600";
  if (level >= 5) return "from-blue-400 to-cyan-600";
  return "from-emerald-400 to-green-600";
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "только что";
  if (minutes < 60) return `${minutes} мин`;
  if (hours < 24) return `${hours} ч`;
  if (days < 7) return `${days} д`;
  return new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function GoalDetailsModal({
  isOpen,
  onClose,
  goal,
  currentUserId,
  onEdit,
}: GoalDetailsModalProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>(goal.comments || []);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);

  const isOwner = goal.ownerId === currentUserId;
  const resources = JSON.parse(goal.resources || "[]") as ResourceType[];
  const images = goal.images ? JSON.parse(goal.images) as string[] : [];
  const horizon = HORIZONS[goal.horizon as HorizonType] || HORIZONS.MID;
  const status = STATUSES[goal.status as StatusType] || STATUSES.DRAFT;
  const completedSubtasks = goal.subtasks.filter(s => s.completed).length;
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && showAllComments) {
      loadAllComments();
    }
  }, [isOpen, showAllComments]);

  const loadAllComments = async () => {
    setIsLoadingComments(true);
    try {
      const allComments = await getGoalComments(goal.id);
      setComments(allComments);
    } catch (error) {
      console.error("Ошибка загрузки комментариев:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || isSending) return;

    setIsSending(true);
    try {
      const comment = await createComment(goal.id, newComment.trim());
      setComments(prev => [...prev, comment]);
      setNewComment("");
    } catch (error) {
      console.error("Ошибка отправки:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error("Ошибка удаления:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-[var(--card)] border border-[var(--border)] sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[90vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-start justify-between shrink-0">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                status.color.includes("green") ? "bg-green-100 text-green-700" :
                status.color.includes("blue") ? "bg-blue-100 text-blue-700" :
                status.color.includes("yellow") ? "bg-yellow-100 text-yellow-700" :
                "bg-gray-100 text-gray-700"
              }`}>
                {status.label}
              </span>
              <span className="text-xs text-[var(--muted)]">{horizon.label}</span>
            </div>
            <h2 className="text-lg font-semibold">{goal.title}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <div className={`w-5 h-5 rounded bg-gradient-to-br ${getLevelColor(goal.owner.level)} flex items-center justify-center text-[10px] font-bold text-white`}>
                {(goal.owner.name || "?").charAt(0)}
              </div>
              <span className="text-sm text-[var(--muted)]">{goal.owner.name}</span>
              {goal.assignedTo && (
                <span className="text-sm text-pink-500 flex items-center gap-1">
                  <span>→ 💝</span>
                  <span>{goal.assignedTo.name}</span>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && onEdit && (
              <button onClick={onEdit} className="p-2 hover:bg-[var(--card-hover)] rounded-lg transition-colors">
                ✏️
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-[var(--card-hover)] rounded-lg transition-colors">
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Images Gallery */}
          {images.length > 0 && (
            <div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`${goal.title} - фото ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0 border border-[var(--border)]"
                    onClick={() => setSelectedImageIndex(index)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ))}
              </div>
              {images.length > 0 && (
                <p className="text-xs text-[var(--muted)] mt-1">📷 {images.length} фото • нажмите для просмотра</p>
              )}
            </div>
          )}

          {/* Description */}
          {goal.description && (
            <div>
              <p className="text-sm text-[var(--foreground)]">{goal.description}</p>
            </div>
          )}

          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[var(--muted)]">Прогресс</span>
              <span className="font-medium">{goal.progress}%</span>
            </div>
            <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                style={{ width: `${goal.progress}%` }}
              />
            </div>
          </div>

          {/* Subtasks */}
          {goal.subtasks.length > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--muted)]">Этапы</span>
                <span className="font-medium">{completedSubtasks}/{goal.subtasks.length}</span>
              </div>
              <div className="space-y-1">
                {goal.subtasks.map(subtask => (
                  <div 
                    key={subtask.id} 
                    className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                      subtask.completed 
                        ? "bg-green-50 text-green-700 line-through" 
                        : "bg-[var(--card-hover)]"
                    }`}
                  >
                    <span>{subtask.completed ? "✅" : "⬜"}</span>
                    <span>{subtask.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resources */}
          {resources.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {resources.map(r => (
                <span key={r} className="px-2 py-1 bg-[var(--card-hover)] rounded-lg text-xs">
                  {RESOURCES[r].icon} {RESOURCES[r].label}
                </span>
              ))}
            </div>
          )}

          {/* Metric */}
          {goal.metric && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
              <div className="text-xs text-indigo-600 font-medium mb-1">🎯 Критерий успеха</div>
              <div className="text-sm text-indigo-800">{goal.metric}</div>
            </div>
          )}

          {/* Comments Section */}
          <div className="border-t border-[var(--border)] pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium flex items-center gap-2">
                💬 Обсуждение
                {goal._count.comments > 0 && (
                  <span className="text-xs text-[var(--muted)]">({goal._count.comments})</span>
                )}
              </h3>
              {goal._count.comments > 3 && !showAllComments && (
                <button 
                  onClick={() => setShowAllComments(true)}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Показать все
                </button>
              )}
            </div>

            {/* Comments List */}
            <div className="space-y-3 mb-4">
              {isLoadingComments ? (
                <div className="text-center py-4 text-[var(--muted)]">Загрузка...</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-4 text-[var(--muted)] text-sm">
                  Пока нет комментариев. Начните обсуждение!
                </div>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="flex gap-2 group">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${getLevelColor(comment.author.level)} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                      {(comment.author.name || "?").charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium">{comment.author.name}</span>
                        <span className="text-xs text-[var(--muted)]">{formatRelativeTime(comment.createdAt)}</span>
                        {comment.authorId === currentUserId && (
                          <button 
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-xs text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            удалить
                          </button>
                        )}
                      </div>
                      <p className="text-sm mt-0.5">{comment.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* New Comment Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
                placeholder="Написать комментарий..."
                className="input flex-1 text-sm py-2"
              />
              <button
                onClick={handleSendComment}
                disabled={!newComment.trim() || isSending}
                className="btn btn-primary px-4 py-2 disabled:opacity-50"
              >
                {isSending ? "..." : "→"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImageIndex !== null && images.length > 0 && (
        <div 
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
          onClick={() => setSelectedImageIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-2xl p-2 hover:bg-white/10 rounded-full"
            onClick={() => setSelectedImageIndex(null)}
          >
            ✕
          </button>
          {selectedImageIndex > 0 && (
            <button
              className="absolute left-4 text-white text-4xl p-2 hover:bg-white/10 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(selectedImageIndex - 1);
              }}
            >
              ‹
            </button>
          )}
          <img
            src={images[selectedImageIndex]}
            alt={`${goal.title} - фото ${selectedImageIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {selectedImageIndex < images.length - 1 && (
            <button
              className="absolute right-4 text-white text-4xl p-2 hover:bg-white/10 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(selectedImageIndex + 1);
              }}
            >
              ›
            </button>
          )}
          <div className="absolute bottom-4 text-white text-sm">
            {selectedImageIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
