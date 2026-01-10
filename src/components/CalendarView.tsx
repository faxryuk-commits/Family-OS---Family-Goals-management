"use client";

import { useState } from "react";
import { Event } from "@prisma/client";
import { CreateEventModal } from "./CreateEventModal";
import { EventDetailsModal } from "./EventDetailsModal";

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

type CalendarViewProps = {
  events: EventWithRelations[];
  upcomingEvents: EventWithRelations[];
  familyId: string;
  familyMembers: FamilyMember[];
  currentUserId: string;
};

const DAYS_OF_WEEK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Convert Sunday = 0 to Monday = 0
}

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function formatDate(date: Date) {
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}

function formatRelativeDate(date: Date) {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Сегодня";
  if (days === 1) return "Завтра";
  if (days === 2) return "Послезавтра";
  if (days < 7) return `Через ${days} дн.`;
  return formatDate(date);
}

export function CalendarView({
  events,
  upcomingEvents,
  familyId,
  familyMembers,
  currentUserId,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventWithRelations | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  // Генерируем дни календаря
  const calendarDays: (number | null)[] = [];
  
  // Пустые ячейки до первого дня месяца
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Дни месяца
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Получаем события для конкретного дня
  const getEventsForDay = (day: number) => {
    const date = new Date(year, month, day);
    return events.filter(event => {
      const eventDate = new Date(event.date);
      
      // Проверяем точное совпадение
      if (isSameDay(eventDate, date)) return true;
      
      // Проверяем повторяющиеся события
      if (event.recurring && event.recurring !== "NONE") {
        if (event.recurring === "YEARLY") {
          return eventDate.getMonth() === date.getMonth() && 
                 eventDate.getDate() === date.getDate();
        }
        if (event.recurring === "MONTHLY") {
          return eventDate.getDate() === date.getDate();
        }
        if (event.recurring === "WEEKLY") {
          return eventDate.getDay() === date.getDay();
        }
      }
      
      return false;
    });
  };

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (day: number) => {
    const date = new Date(year, month, day);
    setSelectedDate(date);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Календарь */}
      <div className="lg:col-span-2">
        <div className="card">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevMonth}
                className="p-2 hover:bg-[var(--card-hover)] rounded-lg transition-colors"
              >
                ←
              </button>
              <h2 className="text-xl font-bold">
                {MONTHS[month]} {year}
              </h2>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-[var(--card-hover)] rounded-lg transition-colors"
              >
                →
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={goToToday}
                className="btn btn-secondary text-sm"
              >
                Сегодня
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn btn-primary text-sm"
              >
                + Событие
              </button>
            </div>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_OF_WEEK.map(day => (
              <div
                key={day}
                className="text-center text-sm font-medium text-[var(--muted)] py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const date = new Date(year, month, day);
              const isToday = isSameDay(date, today);
              const dayEvents = getEventsForDay(day);
              const isPast = date < today && !isToday;

              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`
                    aspect-square p-1 rounded-lg cursor-pointer transition-all
                    ${isToday 
                      ? "bg-gradient-to-br from-indigo-500/20 to-purple-500/20 ring-2 ring-indigo-500" 
                      : "hover:bg-[var(--card-hover)]"
                    }
                    ${isPast ? "opacity-50" : ""}
                  `}
                >
                  <div className={`
                    text-sm font-medium mb-1
                    ${isToday ? "text-indigo-600 font-bold" : ""}
                  `}>
                    {day}
                  </div>
                  
                  {/* Event dots */}
                  {dayEvents.length > 0 && (
                    <div className="flex flex-wrap gap-0.5">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }}
                          className="text-xs truncate cursor-pointer hover:opacity-80"
                          style={{ color: event.color || "#6366f1" }}
                          title={event.title}
                        >
                          {event.emoji || "📅"}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-xs text-[var(--muted)]">
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Upcoming Events */}
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span>📆</span>
            Предстоящие события
          </h3>
          
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-6 text-[var(--muted)]">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm">Нет предстоящих событий</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn btn-secondary text-sm mt-3"
              >
                Добавить событие
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="p-3 rounded-lg bg-[var(--background)] hover:bg-[var(--card-hover)] cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: `${event.color}20` }}
                    >
                      {event.emoji || "📅"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{event.title}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {formatRelativeDate(new Date(event.date))}
                      </p>
                      {event.forUser && (
                        <p className="text-xs text-pink-500 mt-1">
                          👤 {event.forUser.name}
                        </p>
                      )}
                    </div>
                    {event.goal && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        🎯
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Add */}
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span>⚡</span>
            Быстрое добавление
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { type: "BIRTHDAY", emoji: "🎂", label: "День рождения" },
              { type: "ANNIVERSARY", emoji: "💍", label: "Годовщина" },
              { type: "HOLIDAY", emoji: "🎉", label: "Праздник" },
              { type: "REMINDER", emoji: "⏰", label: "Напоминание" },
            ].map(item => (
              <button
                key={item.type}
                onClick={() => {
                  setSelectedDate(null);
                  setIsCreateModalOpen(true);
                }}
                className="p-3 rounded-lg bg-[var(--background)] hover:bg-[var(--card-hover)] transition-colors text-center"
              >
                <span className="text-2xl block mb-1">{item.emoji}</span>
                <span className="text-xs text-[var(--muted)]">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="card">
          <h3 className="font-semibold mb-3 text-sm text-[var(--muted)]">
            Типы событий
          </h3>
          <div className="space-y-2 text-sm">
            {[
              { emoji: "🎂", label: "День рождения", color: "#ec4899" },
              { emoji: "💍", label: "Годовщина", color: "#f59e0b" },
              { emoji: "🎉", label: "Праздник", color: "#10b981" },
              { emoji: "🎯", label: "Дедлайн цели", color: "#ef4444" },
              { emoji: "👥", label: "Встреча", color: "#3b82f6" },
              { emoji: "📅", label: "Другое", color: "#8b5cf6" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.emoji}</span>
                <span className="text-[var(--muted)]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedDate(null);
        }}
        familyId={familyId}
        familyMembers={familyMembers}
        initialDate={selectedDate}
      />

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          event={selectedEvent}
          currentUserId={currentUserId}
          familyMembers={familyMembers}
        />
      )}
    </div>
  );
}
