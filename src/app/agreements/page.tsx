import { getFamily } from "@/lib/actions/family";
import { getAgreements, getAgreementStats } from "@/lib/actions/agreements";
import { AgreementsList } from "@/components/AgreementsList";
import Link from "next/link";

// Динамическая страница - не пререндерится при билде
export const dynamic = "force-dynamic";

export default async function AgreementsPage() {
  const family = await getFamily();

  if (!family) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Семья не найдена</p>
          <Link href="/" className="btn btn-primary">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  const agreements = await getAgreements(family.id);
  const stats = await getAgreementStats(family.id);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-[var(--muted)] hover:text-white transition-colors"
              >
                ← Назад
              </Link>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <span>📜</span>
                  Соглашения семьи
                </h1>
                <p className="text-sm text-[var(--muted)]">
                  {family.name} • Договоры о решении конфликтов
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-3xl font-bold text-white">{stats.total}</p>
            <p className="text-sm text-[var(--muted)]">Всего договоров</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-green-400">{stats.active}</p>
            <p className="text-sm text-[var(--muted)]">Активных</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-red-400">{stats.expired}</p>
            <p className="text-sm text-[var(--muted)]">Истекших</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-yellow-400">
              {stats.upcomingReviews}
            </p>
            <p className="text-sm text-[var(--muted)]">На пересмотр</p>
          </div>
        </div>

        {/* Agreements List */}
        <AgreementsList agreements={agreements} />
      </main>
    </div>
  );
}
