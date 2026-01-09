import { FamilyBoard } from "@/components/FamilyBoard";
import { getFamily, createDemoFamily } from "@/lib/actions/family";

export default async function Home() {
  // Для MVP: создаём демо-семью если её нет
  let family = await getFamily();
  
  if (!family) {
    await createDemoFamily();
    family = await getFamily();
  }

  if (!family) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Ошибка загрузки</h1>
          <p className="text-[var(--muted)]">Не удалось создать семью</p>
        </div>
      </div>
    );
  }

  return <FamilyBoard family={family} />;
}
