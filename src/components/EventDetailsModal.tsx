"use client";

import { useState, useTransition } from "react";
import { Event } from "@prisma/client";
import { deleteEvent, updateEvent } from "@/lib/actions/events";
import { EVENT_TYPES, RECURRING_TYPES, EventType, RecurringType } from "@/lib/event-types";

type EventWithRelations = Event & {
  creator: { id: string; name: string | null; image: string | null };
  forUser: { id: string; name: string | null; image: string | null } | null;
  goal: { id: string; title: string } | null;
};

type FamilyMember = {
  id: string;
  name: string | null;
  image: string | null;
};

type EventDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  event: EventWithRelations;
  currentUserId: string;
  familyMembers: FamilyMember[];
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EventDetailsModal({
  isOpen,
  onClose,
  event,
  currentUserId,
  familyMembers,
}: EventDetailsModalProps) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState(event.title);
  const [editDescription, setEditDescription] = useState(event.description || "");
  const [editDate, setEditDate] = useState(
    new Date(event.date).toISOString().split("T")[0]
  );
  const [editTime, setEditTime] = useState(
    event.allDay ? "" : formatTime(new Date(event.date))
  );
  const [editAllDay, setEditAllDay] = useState(event.allDay);
  const [editRecurring, setEditRecurring] = useState(
    (event.recurring || "NONE") as RecurringType
  );
  const [editRemindDays, setEditRemindDays] = useState(event.remindDays);

  const isOwner = event.creatorId === currentUserId;
  const eventType = EVENT_TYPES[event.type as EventType] || EVENT_TYPES.CUSTOM;

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteEvent(event.id);
        onClose();
      } catch (error) {
        console.error("Ошибка удаления:", error);
        alert("Не удалось удалить событие");
      }
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const eventDate = new Date(editDate);
        if (!editAllDay && editTime) {
          const [hours, minutes] = editTime.split(":");
          eventDate.setHours(parseInt(hours), parseInt(minutes));
        }

        await updateEvent(event.id, {
          title: editTitle,
          description: editDescription || undefined,
          date: eventDate,
          allDay: editAllDay,
          recurring: editRecurring,
          remindDays: editRemindDays,
        });
        setIsEditing(false);
      } catch (error) {
        console.error("Ошибка обновления:", error);
        alert("Не удалось обновить событие");
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div 
          className="p-6 text-white rounded-t-2xl"
          style={{ backgroundColor: event.color || "#6366f1" }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{event.emoji || eventType.emoji}</span>
              <div>
                <span className="text-sm opacity-80">{eventType.label}</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="block w-full bg-white/20 rounded px-2 py-1 text-lg font-bold placeholder-white/50"
                  />
                ) : (
                  <h2 className="text-xl font-bold">{event.title}</h2>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Date & Time */}
          <div className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-lg">
            <span className="text-2xl">📅</span>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="input"
                  />
                  {!editAllDay && (
                    <input
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="input"
                    />
                  )}
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editAllDay}
                      onChange={(e) => setEditAllDay(e.target.checked)}
                      className="rounded"
                    />
                    Весь день
                  </label>
                </div>
              ) : (
                <>
                  <p className="font-medium">{formatDate(new Date(event.date))}</p>
                  {!event.allDay && (
                    <p className="text-sm text-[var(--muted)]">
                      {formatTime(new Date(event.date))}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Recurring */}
          {(event.recurring && event.recurring !== "NONE") || isEditing ? (
            <div className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-lg">
              <span className="text-2xl">🔄</span>
              {isEditing ? (
                <select
                  value={editRecurring}
                  onChange={(e) => setEditRecurring(e.target.value as RecurringType)}
                  className="input flex-1"
                >
                  {Object.entries(RECURRING_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm">{RECURRING_TYPES[event.recurring as RecurringType]}</p>
              )}
            </div>
          ) : null}

          {/* For User */}
          {event.forUser && (
            <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
              <span className="text-2xl">👤</span>
              <div>
                <p className="text-sm text-pink-600">Для</p>
                <p className="font-medium text-pink-800">{event.forUser.name}</p>
              </div>
            </div>
          )}

          {/* Goal Link */}
          {event.goal && (
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="text-sm text-red-600">Связано с целью</p>
                <p className="font-medium text-red-800">{event.goal.title}</p>
              </div>
            </div>
          )}

          {/* Remind */}
          <div className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-lg">
            <span className="text-2xl">⏰</span>
            {isEditing ? (
              <select
                value={editRemindDays}
                onChange={(e) => setEditRemindDays(parseInt(e.target.value))}
                className="input flex-1"
              >
                <option value="0">В день события</option>
                <option value="1">За 1 день</option>
                <option value="3">За 3 дня</option>
                <option value="7">За неделю</option>
              </select>
            ) : (
              <p className="text-sm">
                Напоминание: {
                  event.remindDays === 0 ? "в день события" :
                  event.remindDays === 1 ? "за 1 день" :
                  `за ${event.remindDays} дней`
                }
                {event.reminded && <span className="text-green-500 ml-2">✓ Отправлено</span>}
              </p>
            )}
          </div>

          {/* Description */}
          {(event.description || isEditing) && (
            <div className="p-3 bg-[var(--background)] rounded-lg">
              <p className="text-sm text-[var(--muted)] mb-1">Описание</p>
              {isEditing ? (
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="input min-h-[80px]"
                  placeholder="Добавьте описание..."
                />
              ) : (
                <p className="text-sm">{event.description}</p>
              )}
            </div>
          )}

          {/* Creator */}
          <div className="text-xs text-[var(--muted)] text-center">
            Создано: {event.creator.name} • {
              new Date(event.createdAt).toLocaleDateString("ru-RU")
            }
          </div>
        </div>

        {/* Footer */}
        {isOwner && (
          <div className="border-t border-[var(--border)] p-4">
            {showDeleteConfirm ? (
              <div className="space-y-3">
                <p className="text-sm text-center text-red-600">
                  Удалить это событие?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="btn btn-secondary flex-1"
                    disabled={isPending}
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleDelete}
                    className="btn bg-red-500 hover:bg-red-600 text-white flex-1"
                    disabled={isPending}
                  >
                    {isPending ? "Удаление..." : "Да, удалить"}
                  </button>
                </div>
              </div>
            ) : isEditing ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn btn-secondary flex-1"
                  disabled={isPending}
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  className="btn btn-primary flex-1"
                  disabled={isPending}
                >
                  {isPending ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn btn-secondary text-red-500 flex-1"
                >
                  🗑️ Удалить
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-primary flex-1"
                >
                  ✏️ Редактировать
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
