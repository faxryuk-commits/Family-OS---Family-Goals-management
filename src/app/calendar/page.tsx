import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserFamily } from "@/lib/actions/family";
import { getEvents, getUpcomingEvents } from "@/lib/actions/events";
import { CalendarView } from "@/components/CalendarView";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const family = await getUserFamily(session.user.id);
  
  if (!family) {
    redirect("/");
  }

  // Получаем события на текущий месяц ±1 месяц
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  
  const events = await getEvents(family.id, startDate, endDate);
  const upcomingEvents = await getUpcomingEvents(family.id, 10);

  // Получаем членов семьи для выбора "для кого"
  const familyMembers = family.members.map(m => ({
    id: m.user.id,
    name: m.user.name,
    image: m.user.image,
  }));

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[var(--background)]">
      {/* Header */}
      <header className="bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                ← Назад
              </Link>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <span>📅</span>
                Семейный календарь
              </h1>
            </div>
            <div className="text-sm text-[var(--muted)]">
              {family.name}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <CalendarView 
          events={events}
          upcomingEvents={upcomingEvents}
          familyId={family.id}
          familyMembers={familyMembers}
          currentUserId={session.user.id}
        />
      </main>
    </div>
  );
}
