"use client";

import { CheckIn, User } from "@prisma/client";
import { getCurrentWeek } from "@/lib/utils";
import { HelpIcon } from "./Tooltip";

type CheckInWithUser = CheckIn & { user: User };

type CheckInSectionProps = {
  checkIns: CheckInWithUser[];
  onOpenCheckIn: () => void;
  currentUserCheckedIn: boolean;
};

// Форматируем номер недели в читаемый вид
function formatWeek(week: string): string {
  const match = week.match(/(\d+)-W(\d+)/);
  if (!match) return week;
  const [, year, weekNum] = match;
  return `Неделя ${weekNum}, ${year}`;
}

export function CheckInSection({
  checkIns,
  onOpenCheckIn,
  currentUserCheckedIn,
}: CheckInSectionProps) {
  const week = getCurrentWeek();
  const thisWeekCheckIns = checkIns.filter((c) => c.week === week);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span>📋</span>
            Итоги недели
            <span className="text-sm font-normal text-[var(--muted)]">
              ({formatWeek(week)})
            </span>
          </h2>
          <HelpIcon text="Раз в неделю каждый член семьи отмечает: что сделал, чем гордится, где нужна помощь. Это помогает не забросить цели и поддерживать друг друга." />
        </div>
        <button
          onClick={onOpenCheckIn}
          className={`btn ${
            currentUserCheckedIn ? "btn-secondary" : "btn-primary"
          }`}
        >
          {currentUserCheckedIn ? "✏️ Обновить" : "📝 Отметиться"}
        </button>
      </div>

      {thisWeekCheckIns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {thisWeekCheckIns.map((checkIn) => (
            <div key={checkIn.id} className="card animate-fade-in">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-sm font-bold">
                  {(checkIn.user.name || "?").charAt(0)}
                </div>
                <div>
                  <h3 className="font-medium">{checkIn.user.name}</h3>
                  <p className="text-xs text-[var(--muted)]">
                    {new Date(checkIn.createdAt).toLocaleDateString("ru-RU", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                <div className="ml-auto">
                  <span className="badge bg-green-500/20 text-green-400">
                    ✓ Отметился
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-3">
                {checkIn.notes && (
                  <div>
                    <p className="text-xs text-[var(--muted)] mb-1">
                      ✓ Сделано:
                    </p>
                    <p className="text-sm">{checkIn.notes}</p>
                  </div>
                )}

                {checkIn.wins && (
                  <div>
                    <p className="text-xs text-yellow-400 mb-1">🏆 Победы:</p>
                    <p className="text-sm">{checkIn.wins}</p>
                  </div>
                )}

                {checkIn.blockers && (
                  <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-xs text-red-400 mb-1">🚧 Нужна помощь:</p>
                    <p className="text-sm text-red-300">{checkIn.blockers}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-8">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-[var(--muted)] mb-2">
            Никто ещё не отметился на этой неделе
          </p>
          <p className="text-sm text-[var(--muted)] mb-4">
            Расскажите, как продвигаются ваши цели
          </p>
          <button onClick={onOpenCheckIn} className="btn btn-primary">
            Отметиться первым! 🚀
          </button>
        </div>
      )}
    </section>
  );
}
