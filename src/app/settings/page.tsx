import { auth } from "@/auth";
import { getUserFamily, getFamilyInvites } from "@/lib/actions/family";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FamilySettings } from "@/components/FamilySettings";

// Динамическая страница - не пререндерится при билде
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const family = await getUserFamily(session.user.id);

  if (!family) {
    redirect("/");
  }

  const invites = await getFamilyInvites(family.id);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-[var(--muted)] hover:text-white transition-colors"
            >
              ← Назад
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <span>⚙️</span>
                Настройки семьи
              </h1>
              <p className="text-sm text-[var(--muted)]">{family.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <FamilySettings 
          family={family} 
          invites={invites} 
          currentUserId={session.user.id} 
        />
      </main>
    </div>
  );
}
