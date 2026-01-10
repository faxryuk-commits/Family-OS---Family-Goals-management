"use client";

import { useState } from "react";
import { Family, FamilyMember, Invite } from "@prisma/client";
import { createInvite, updateNorthStar, leaveFamily } from "@/lib/actions/family";
import { useRouter } from "next/navigation";

type UserBasic = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  level: number;
};

type FamilyWithMembers = Family & {
  members: (FamilyMember & { user: UserBasic })[];
};

type FamilySettingsProps = {
  family: FamilyWithMembers;
  invites: Invite[];
  currentUserId: string;
};

export function FamilySettings({
  family,
  invites,
  currentUserId,
}: FamilySettingsProps) {
  const router = useRouter();
  const [newInviteCode, setNewInviteCode] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [northStar, setNorthStar] = useState(family.northStar || "");
  const [isEditingNorthStar, setIsEditingNorthStar] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeaveFamily = async () => {
    setIsLeaving(true);
    try {
      await leaveFamily(family.id, currentUserId);
      router.push("/"); // Редирект на главную, где покажется NoFamilyView
      router.refresh(); // Обновляем данные
    } catch (error) {
      console.error("Ошибка при выходе из семьи:", error);
      alert("Не удалось выйти из семьи. Попробуйте снова.");
    } finally {
      setIsLeaving(false);
      setShowLeaveConfirm(false);
    }
  };

  const handleCreateInvite = async () => {
    setIsCreatingInvite(true);
    try {
      const invite = await createInvite(family.id, currentUserId);
      setNewInviteCode(invite.code);
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreatingInvite(false);
    }
  };

  // Получаем URL сайта
  const siteUrl = typeof window !== "undefined" 
    ? window.location.origin 
    : "https://family-os-family-goals-management.vercel.app";

  const getInviteLink = (code: string) => `${siteUrl}/join?code=${code}`;
  
  const getInviteMessage = (code: string) => 
    `🏠 Присоединяйся к нашей семье в FamilyOS!\n\n` +
    `Перейди по ссылке:\n${getInviteLink(code)}\n\n` +
    `Или введи код: ${code}`;

  const handleCopyLink = (code: string) => {
    navigator.clipboard.writeText(getInviteMessage(code));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveNorthStar = async () => {
    await updateNorthStar(family.id, northStar);
    setIsEditingNorthStar(false);
  };

  return (
    <div className="space-y-8">
      {/* Family Members */}
      <section className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>👨‍👩‍👧</span>
          Члены семьи
        </h2>

        <div className="space-y-3">
          {family.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-lg"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-sm font-bold">
                {(member.user.name || "?").charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium">{member.user.name}</p>
                <p className="text-sm text-[var(--muted)]">{member.user.email}</p>
              </div>
              <span className="badge bg-blue-500/20 text-blue-300 text-xs">
                {member.role === "ADULT" ? "Создатель" : "Партнёр"}
              </span>
              {member.user.id === currentUserId && (
                <span className="text-xs text-[var(--muted)]">(Вы)</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Invite */}
      <section className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>🔗</span>
          Пригласить в семью
        </h2>

        {newInviteCode ? (
          <div className="py-4">
            <p className="text-sm text-[var(--muted)] mb-4 text-center">
              Отправьте это приглашение партнёру:
            </p>
            
            {/* Invite Message Preview */}
            <div className="p-4 bg-[var(--background)] rounded-xl mb-4 text-sm">
              <p className="mb-2">🏠 Присоединяйся к нашей семье в FamilyOS!</p>
              <p className="text-[var(--muted)] mb-2">Перейди по ссылке:</p>
              <p className="text-blue-400 break-all mb-2">{getInviteLink(newInviteCode)}</p>
              <p className="text-[var(--muted)]">Или введи код: <span className="font-mono font-bold">{newInviteCode}</span></p>
            </div>

            {/* Copy Button */}
            <button
              onClick={() => handleCopyLink(newInviteCode)}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {copied ? (
                <>✅ Скопировано!</>
              ) : (
                <>📋 Скопировать приглашение</>
              )}
            </button>
            
            <p className="text-xs text-[var(--muted)] mt-4 text-center">
              Код действует 7 дней
            </p>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-[var(--muted)] mb-4">
              Создайте код приглашения для партнёра
            </p>
            <button
              onClick={handleCreateInvite}
              disabled={isCreatingInvite}
              className="btn btn-primary"
            >
              {isCreatingInvite ? "Создаём..." : "Создать приглашение"}
            </button>
          </div>
        )}

        {/* Active Invites */}
        {invites.length > 0 && (
          <div className="mt-6 pt-6 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--muted)] mb-3">
              Активные приглашения:
            </p>
            <div className="space-y-2">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 bg-[var(--background)] rounded-lg text-sm"
                >
                  <div>
                    <span className="font-mono font-bold">{invite.code}</span>
                    <span className="text-[var(--muted)] ml-2">
                      до{" "}
                      {new Date(invite.expiresAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyLink(invite.code)}
                    className="btn btn-secondary btn-sm"
                  >
                    📋 Копировать
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

        {/* Mission */}
        <section className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🌟</span>
            Миссия семьи
          </h2>

        {isEditingNorthStar ? (
          <div className="space-y-3">
            <input
              type="text"
              value={northStar}
              onChange={(e) => setNorthStar(e.target.value)}
              className="input"
              placeholder="Главная цель семьи..."
            />
            <div className="flex gap-2">
              <button onClick={handleSaveNorthStar} className="btn btn-primary">
                Сохранить
              </button>
              <button
                onClick={() => setIsEditingNorthStar(false)}
                className="btn btn-secondary"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingNorthStar(true)}
            className="p-4 bg-[var(--background)] rounded-lg cursor-pointer hover:bg-[var(--card-hover)] transition-colors group"
          >
            <p className="text-lg">
              {family.northStar || "Нажмите, чтобы задать..."}
            </p>
            <span className="text-sm text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">
              ✏️ Редактировать
            </span>
          </div>
        )}
      </section>

      {/* Danger Zone */}
      <section className="card border-red-500/30">
        <h2 className="text-lg font-semibold mb-4 text-red-400">
          ⚠️ Опасная зона
        </h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          Эти действия нельзя отменить
        </p>
        <button 
          onClick={() => setShowLeaveConfirm(true)}
          className="btn btn-secondary text-red-400 hover:bg-red-500/20"
        >
          Выйти из семьи
        </button>
      </section>

      {/* Leave Family Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowLeaveConfirm(false)}
          />
          <div className="relative w-full max-w-md card animate-fade-in p-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">😢</div>
              <h3 className="text-xl font-bold mb-2">Вы уверены?</h3>
              <p className="text-[var(--muted)]">
                Вы собираетесь покинуть семью <strong>{family.name}</strong>.
              </p>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-400">
                <strong>⚠️ Внимание:</strong>
              </p>
              <ul className="text-sm text-red-300 mt-2 space-y-1">
                <li>• Ваши личные цели будут удалены</li>
                <li>• Семейные цели будут переданы другому члену</li>
                <li>• Ваши check-in&apos;ы будут удалены</li>
                {family.members.length === 1 && (
                  <li>• <strong>Вы последний член — семья будет удалена!</strong></li>
                )}
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="btn btn-secondary flex-1"
                disabled={isLeaving}
              >
                Отмена
              </button>
              <button
                onClick={handleLeaveFamily}
                disabled={isLeaving}
                className="btn bg-red-500 hover:bg-red-600 text-white flex-1"
              >
                {isLeaving ? "Выходим..." : "Да, выйти"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
