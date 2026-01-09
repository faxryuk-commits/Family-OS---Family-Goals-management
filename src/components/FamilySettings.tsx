"use client";

import { useState } from "react";
import { Family, FamilyMember, User, Invite } from "@prisma/client";
import { createInvite, updateNorthStar } from "@/lib/actions/family";

type FamilyWithMembers = Family & {
  members: (FamilyMember & { user: User })[];
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
  const [newInviteCode, setNewInviteCode] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [northStar, setNorthStar] = useState(family.northStar || "");
  const [isEditingNorthStar, setIsEditingNorthStar] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleCopyCode = () => {
    if (newInviteCode) {
      navigator.clipboard.writeText(newInviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
          <div className="text-center py-6">
            <p className="text-sm text-[var(--muted)] mb-4">
              Отправьте этот код партнёру:
            </p>
            <div
              onClick={handleCopyCode}
              className="inline-flex items-center gap-3 px-6 py-4 bg-[var(--background)] rounded-xl cursor-pointer hover:bg-[var(--card-hover)] transition-colors"
            >
              <span className="text-3xl font-mono font-bold tracking-wider">
                {newInviteCode}
              </span>
              <span className="text-[var(--muted)]">
                {copied ? "✅" : "📋"}
              </span>
            </div>
            <p className="text-xs text-[var(--muted)] mt-4">
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
                  className="flex items-center justify-between p-2 bg-[var(--background)] rounded-lg text-sm"
                >
                  <span className="font-mono">{invite.code}</span>
                  <span className="text-[var(--muted)]">
                    до{" "}
                    {new Date(invite.expiresAt).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
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
        <button className="btn btn-secondary text-red-400 hover:bg-red-500/20">
          Выйти из семьи
        </button>
      </section>
    </div>
  );
}
