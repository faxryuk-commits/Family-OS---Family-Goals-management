import { auth } from "@/auth";
import { FamilyBoard } from "@/components/FamilyBoard";
import { getUserFamily } from "@/lib/actions/family";
import { getNotifications, getUnreadCount } from "@/lib/actions/notifications";
import { getUpcomingEvents } from "@/lib/actions/events";
import { redirect } from "next/navigation";
import { NoFamilyView } from "@/components/NoFamilyView";

// Динамическая страница - не пререндерится при билде
export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Получаем семью текущего пользователя
  let family = await getUserFamily(session.user.id);

  // Если у пользователя нет семьи - показываем экран создания/присоединения
  if (!family) {
    return <NoFamilyView userId={session.user.id} userName={session.user.name || ""} />;
  }

  // Получаем уведомления и события
  const notifications = await getNotifications(10);
  const unreadCount = await getUnreadCount();
  const upcomingEvents = await getUpcomingEvents(family.id, 5);

  return (
    <FamilyBoard 
      family={family} 
      currentUserId={session.user.id}
      notifications={notifications}
      unreadNotificationsCount={unreadCount}
      upcomingEvents={upcomingEvents}
    />
  );
}
