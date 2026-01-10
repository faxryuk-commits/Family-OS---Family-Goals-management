"use client";

import { useState, useEffect, useRef } from "react";
import { Notification, User } from "@prisma/client";
import { markAsRead, markAllAsRead } from "@/lib/actions/notifications";

type NotificationWithSender = Notification & {
  fromUser: { id: string; name: string | null; image: string | null } | null;
};

type NotificationBellProps = {
  initialNotifications: NotificationWithSender[];
  initialUnreadCount: number;
};

// Иконки для типов уведомлений
const typeIcons: Record<string, string> = {
  GOAL_ASSIGNED: "💝",
  COMMENT: "💬",
  FAMILY_INVITE: "✉️",
  FAMILY_JOINED: "👋",
  GOAL_COMPLETED: "🎉",
  CHECK_IN: "📋",
  ACHIEVEMENT: "🏆",
  CONFLICT: "⚠️",
};

// Цвета для типов уведомлений
const typeColors: Record<string, string> = {
  GOAL_ASSIGNED: "bg-pink-100 text-pink-700",
  COMMENT: "bg-blue-100 text-blue-700",
  FAMILY_INVITE: "bg-purple-100 text-purple-700",
  FAMILY_JOINED: "bg-green-100 text-green-700",
  GOAL_COMPLETED: "bg-amber-100 text-amber-700",
  CHECK_IN: "bg-cyan-100 text-cyan-700",
  ACHIEVEMENT: "bg-yellow-100 text-yellow-700",
  CONFLICT: "bg-red-100 text-red-700",
};

function formatTime(date: Date): string {
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

export function NotificationBell({ initialNotifications, initialUnreadCount }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закрытие при клике вне
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-[var(--card-hover)] transition-colors"
        aria-label="Уведомления"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] overflow-hidden bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xl z-50 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--foreground)]">Уведомления</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-500 hover:text-blue-600"
              >
                Прочитать все
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-80">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <span className="text-4xl block mb-2">🔕</span>
                <p className="text-[var(--muted)]">Пока нет уведомлений</p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Здесь появятся уведомления о действиях в семье
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                  className={`flex items-start gap-3 p-4 border-b border-[var(--border)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer ${
                    !notification.read ? "bg-blue-50/50" : ""
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${typeColors[notification.type] || "bg-gray-100"}`}>
                    {typeIcons[notification.type] || "📣"}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.read ? "font-semibold" : ""} text-[var(--foreground)]`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-[var(--muted)] line-clamp-2 mt-0.5">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {notification.fromUser && (
                        <span className="text-xs text-[var(--muted)]">
                          от {notification.fromUser.name}
                        </span>
                      )}
                      <span className="text-xs text-[var(--muted)]">
                        • {formatTime(notification.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Unread Indicator */}
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-[var(--border)] text-center">
              <button className="text-sm text-blue-500 hover:text-blue-600">
                Показать все
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
