"use client";

import { useState, useTransition } from "react";
import { toggleReaction } from "@/lib/actions/reactions";
import { REACTION_EMOJIS, ReactionEmoji, ReactionTarget } from "@/lib/reaction-types";

type ReactionUser = {
  id: string;
  name: string | null;
  image: string | null;
};

type ReactionsProps = {
  targetType: ReactionTarget;
  targetId: string;
  reactions: Record<string, ReactionUser[]>;
  currentUserId: string;
  myReaction?: string | null;
  compact?: boolean;
};

export function Reactions({
  targetType,
  targetId,
  reactions,
  currentUserId,
  myReaction: initialMyReaction,
  compact = false,
}: ReactionsProps) {
  const [isPending, startTransition] = useTransition();
  // Защита от undefined reactions
  const safeReactions = reactions && typeof reactions === 'object' ? reactions : {};
  const [localReactions, setLocalReactions] = useState<Record<string, ReactionUser[]>>(safeReactions);
  const [myReaction, setMyReaction] = useState(initialMyReaction);
  const [showPicker, setShowPicker] = useState(false);

  const handleReaction = (emoji: ReactionEmoji) => {
    // Оптимистичное обновление
    const wasMyReaction = myReaction === emoji;
    const oldMyReaction = myReaction;

    if (wasMyReaction) {
      // Удаляем реакцию
      setMyReaction(null);
      setLocalReactions(prev => {
        const safePrev = prev && typeof prev === 'object' ? prev : {};
        const updated = { ...safePrev };
        if (updated[emoji] && Array.isArray(updated[emoji])) {
          updated[emoji] = updated[emoji].filter(u => u.id !== currentUserId);
          if (updated[emoji].length === 0) {
            delete updated[emoji];
          }
        }
        return updated;
      });
    } else {
      // Добавляем/меняем реакцию
      setMyReaction(emoji);
      setLocalReactions(prev => {
        const safePrev = prev && typeof prev === 'object' ? prev : {};
        const updated = { ...safePrev };
        
        // Удаляем из старой реакции
        if (oldMyReaction && updated[oldMyReaction] && Array.isArray(updated[oldMyReaction])) {
          updated[oldMyReaction] = updated[oldMyReaction].filter(u => u.id !== currentUserId);
          if (updated[oldMyReaction].length === 0) {
            delete updated[oldMyReaction];
          }
        }
        
        // Добавляем в новую
        if (!updated[emoji] || !Array.isArray(updated[emoji])) {
          updated[emoji] = [];
        }
        if (!updated[emoji].find(u => u.id === currentUserId)) {
          updated[emoji].push({ id: currentUserId, name: "Вы", image: null });
        }
        
        return updated;
      });
    }

    setShowPicker(false);

    // Серверное обновление
    startTransition(async () => {
      try {
        await toggleReaction({ emoji, targetType, targetId });
      } catch (error) {
        // Откатываем изменения при ошибке
        setMyReaction(oldMyReaction);
        setLocalReactions(safeReactions);
        console.error("Ошибка при добавлении реакции:", error);
        // Можно показать toast уведомление здесь
      }
    });
  };

  // Обработчик клика для предотвращения всплытия
  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Защита от неправильных данных
  const safeLocalReactions = localReactions && typeof localReactions === 'object' ? localReactions : {};

  // Считаем общее количество реакций
  const totalReactions = Object.values(safeLocalReactions).reduce(
    (sum, users) => sum + (Array.isArray(users) ? users.length : 0),
    0
  );

  // Сортируем эмодзи по количеству реакций
  const sortedEmojis = Object.entries(safeLocalReactions)
    .filter(([, users]) => Array.isArray(users) && users.length > 0)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([emoji]) => emoji);

  if (compact) {
    return (
      <div className="flex items-center gap-1 relative" onClick={handleContainerClick}>
        {/* Existing reactions */}
        {sortedEmojis.map(emoji => (
          <button
            key={emoji}
            onClick={(e) => {
              e.stopPropagation();
              handleReaction(emoji as ReactionEmoji);
            }}
            disabled={isPending}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all ${
              myReaction === emoji
                ? "bg-blue-100 text-blue-700 border border-blue-300"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
            title={(safeLocalReactions[emoji] || []).map(u => u.name || "Аноним").join(", ")}
          >
            <span>{emoji}</span>
            <span className="text-xs font-medium">{(safeLocalReactions[emoji] || []).length}</span>
          </button>
        ))}

        {/* Add reaction button */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPicker(!showPicker);
            }}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            title="Добавить реакцию"
          >
            {totalReactions === 0 ? "😊" : "+"}
          </button>

          {/* Emoji picker */}
          {showPicker && (
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-xl shadow-lg border border-gray-200 flex gap-1 z-50 animate-fade-in">
              {REACTION_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReaction(emoji);
                  }}
                  disabled={isPending}
                  className={`w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-lg transition-all hover:scale-110 ${
                    myReaction === emoji ? "bg-blue-100" : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Existing reactions */}
      {sortedEmojis.map(emoji => {
        const users = safeLocalReactions[emoji] || [];
        const isMyReaction = myReaction === emoji;
        
        return (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji as ReactionEmoji)}
            disabled={isPending}
            className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
              isMyReaction
                ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border border-blue-300 shadow-sm"
                : "bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200"
            } ${isPending ? "opacity-50" : ""}`}
            title={users.map(u => u.name || "Аноним").join(", ")}
          >
            <span className="text-base group-hover:scale-110 transition-transform">{emoji}</span>
            <span className="font-medium">{users.length}</span>
          </button>
        );
      })}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-all ${
            showPicker
              ? "bg-gray-100 border-gray-300"
              : "bg-white hover:bg-gray-50 border-gray-200 border-dashed"
          }`}
        >
          <span>😊</span>
          <span className="text-gray-500">Реакция</span>
        </button>

        {/* Emoji picker */}
        {showPicker && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowPicker(false)} 
            />
            
            {/* Picker */}
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-2xl shadow-xl border border-gray-200 flex gap-1 z-50 animate-fade-in">
              {REACTION_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  disabled={isPending}
                  className={`w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-xl transition-all hover:scale-125 ${
                    myReaction === emoji ? "bg-blue-100 ring-2 ring-blue-300" : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Мини-версия для отображения только количества
export function ReactionsSummary({
  reactions,
}: {
  reactions: Record<string, { id: string; name: string | null }[]>;
}) {
  // Защита от undefined
  const safeReactions = reactions && typeof reactions === 'object' ? reactions : {};
  
  const totalReactions = Object.values(safeReactions).reduce(
    (sum, users) => sum + (Array.isArray(users) ? users.length : 0),
    0
  );

  if (totalReactions === 0) return null;

  const topEmojis = Object.entries(safeReactions)
    .filter(([, users]) => Array.isArray(users) && users.length > 0)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
    .map(([emoji]) => emoji);

  return (
    <div className="flex items-center gap-1 text-sm text-gray-500">
      <span className="flex -space-x-1">
        {topEmojis.map(emoji => (
          <span key={emoji} className="text-base">{emoji}</span>
        ))}
      </span>
      <span>{totalReactions}</span>
    </div>
  );
}
