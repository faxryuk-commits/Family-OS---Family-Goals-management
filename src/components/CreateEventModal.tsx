"use client";

import { useState, useTransition } from "react";
import { createEvent } from "@/lib/actions/events";
import { EVENT_TYPES, RECURRING_TYPES, EventType, RecurringType } from "@/lib/event-types";

type FamilyMember = {
  id: string;
  name: string | null;
  image: string | null;
};

type CreateEventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  familyId: string;
  familyMembers: FamilyMember[];
  initialDate?: Date | null;
};

const EVENT_TYPE_OPTIONS = Object.entries(EVENT_TYPES).map(([key, value]) => ({
  value: key as EventType,
  ...value,
}));

const RECURRING_OPTIONS = Object.entries(RECURRING_TYPES).map(([key, value]) => ({
  value: key as RecurringType,
  label: value,
}));

export function CreateEventModal({
  isOpen,
  onClose,
  familyId,
  familyMembers,
  initialDate,
}: CreateEventModalProps) {
  const [isPending, startTransition] = useTransition();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<EventType>("CUSTOM");
  const [date, setDate] = useState(
    initialDate 
      ? initialDate.toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [time, setTime] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [recurring, setRecurring] = useState<RecurringType>("NONE");
  const [remindDays, setRemindDays] = useState(1);
  const [forUserId, setForUserId] = useState("");
  const [customEmoji, setCustomEmoji] = useState("");

  const selectedType = EVENT_TYPES[eventType];

  const handleSubmit = () => {
    if (!title.trim()) return;

    startTransition(async () => {
      try {
        const eventDate = new Date(date);
        if (!allDay && time) {
          const [hours, minutes] = time.split(":");
          eventDate.setHours(parseInt(hours), parseInt(minutes));
        }

        await createEvent(familyId, {
          title: title.trim(),
          description: description.trim() || undefined,
          date: eventDate,
          allDay,
          type: eventType,
          recurring,
          remindDays,
          emoji: customEmoji || selectedType.emoji,
          color: selectedType.color,
          forUserId: forUserId || undefined,
        });

        // Reset form
        setTitle("");
        setDescription("");
        setEventType("CUSTOM");
        setDate(new Date().toISOString().split("T")[0]);
        setTime("");
        setAllDay(true);
        setRecurring("NONE");
        setRemindDays(1);
        setForUserId("");
        setCustomEmoji("");
        
        onClose();
      } catch (error) {
        console.error("Ошибка создания события:", error);
        alert("Не удалось создать событие");
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
        <div className="sticky top-0 bg-[var(--card)] border-b border-[var(--border)] p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span>{customEmoji || selectedType.emoji}</span>
            Новое событие
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--card-hover)] rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Название события <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="Например: День рождения мамы"
              autoFocus
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Тип события
            </label>
            <div className="grid grid-cols-4 gap-2">
              {EVENT_TYPE_OPTIONS.map(type => (
                <button
                  key={type.value}
                  onClick={() => setEventType(type.value)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    eventType === type.value
                      ? "ring-2 ring-indigo-500 bg-indigo-50"
                      : "bg-[var(--background)] hover:bg-[var(--card-hover)]"
                  }`}
                >
                  <span className="text-2xl block mb-1">{type.emoji}</span>
                  <span className="text-xs text-[var(--muted)] line-clamp-1">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Дата <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Время
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  if (e.target.value) setAllDay(false);
                }}
                className="input"
                disabled={allDay}
              />
            </div>
          </div>

          {/* All Day Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm">Весь день</span>
          </label>

          {/* Recurring */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Повторение
            </label>
            <select
              value={recurring}
              onChange={(e) => setRecurring(e.target.value as RecurringType)}
              className="input"
            >
              {RECURRING_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[var(--muted)] mt-1">
              💡 Дни рождения повторяются ежегодно автоматически
            </p>
          </div>

          {/* For User (Birthday/Anniversary) */}
          {(eventType === "BIRTHDAY" || eventType === "ANNIVERSARY") && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Для кого {eventType === "BIRTHDAY" ? "день рождения" : "годовщина"}?
              </label>
              <select
                value={forUserId}
                onChange={(e) => setForUserId(e.target.value)}
                className="input"
              >
                <option value="">Выберите члена семьи</option>
                {familyMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name || "Без имени"}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Remind */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Напомнить заранее
            </label>
            <select
              value={remindDays}
              onChange={(e) => setRemindDays(parseInt(e.target.value))}
              className="input"
            >
              <option value="0">В день события</option>
              <option value="1">За 1 день</option>
              <option value="3">За 3 дня</option>
              <option value="7">За неделю</option>
              <option value="14">За 2 недели</option>
              <option value="30">За месяц</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-[80px]"
              placeholder="Дополнительные заметки..."
            />
          </div>

          {/* Custom Emoji */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Своя иконка (опционально)
            </label>
            <input
              type="text"
              value={customEmoji}
              onChange={(e) => setCustomEmoji(e.target.value.slice(0, 2))}
              className="input w-20 text-center text-2xl"
              placeholder="📅"
              maxLength={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[var(--card)] border-t border-[var(--border)] p-4 flex gap-3">
          <button
            onClick={onClose}
            className="btn btn-secondary flex-1"
            disabled={isPending}
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || isPending}
            className="btn btn-primary flex-1"
          >
            {isPending ? "Создание..." : "Создать событие"}
          </button>
        </div>
      </div>
    </div>
  );
}
