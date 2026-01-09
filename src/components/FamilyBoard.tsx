"use client";

import { useState } from "react";
import { Family, FamilyMember, Goal, User, Conflict, CheckIn, Agreement, Subtask } from "@prisma/client";
import { Header } from "./Header";
import { GoalCard } from "./GoalCard";
import { ConflictAlert } from "./ConflictAlert";
import { CreateGoalModal } from "./CreateGoalModal";
import { ResolveConflictModal } from "./ResolveConflictModal";
import { CheckInModal } from "./CheckInModal";
import { CheckInSection } from "./CheckInSection";
import { Onboarding, useOnboarding } from "./Onboarding";
import { HelpIcon } from "./Tooltip";
import { createGoal } from "@/lib/actions/goals";
import { updateNorthStar } from "@/lib/actions/family";
import { resolveConflict } from "@/lib/actions/conflicts";
import { updateGoalProgress } from "@/lib/actions/goals";
import { createCheckIn } from "@/lib/actions/checkins";
import { getCurrentWeek } from "@/lib/utils";
import { ResourceType } from "@/lib/types";
import { EditGoalModal } from "./EditGoalModal";
import { updateGoal, deleteGoal } from "@/lib/actions/goals";

type GoalWithSubtasks = Goal & { 
  owner: User;
  subtasks: Subtask[];
};

type FamilyWithRelations = Family & {
  members: (FamilyMember & { user: User })[];
  goals: GoalWithSubtasks[];
  conflicts: (Conflict & {
    goalA: Goal & { owner: User };
    goalB: Goal & { owner: User };
  })[];
  checkIns: (CheckIn & { user: User })[];
  agreements: Agreement[];
};

type FamilyBoardProps = {
  family: FamilyWithRelations;
  currentUserId: string;
};

export function FamilyBoard({ family, currentUserId }: FamilyBoardProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<
    (typeof family.conflicts)[0] | null
  >(null);
  const [selectedGoal, setSelectedGoal] = useState<
    (typeof family.goals)[0] | null
  >(null);

  // Онбординг
  const { needsOnboarding, completeOnboarding } = useOnboarding(currentUserId);

  // Находим текущего пользователя среди членов семьи
  const currentUser = family.members.find(m => m.user.id === currentUserId)?.user || family.members[0]?.user;

  // Группируем цели по владельцам
  const familyGoals = family.goals.filter((g) => g.type === "FAMILY");
  const personalGoalsByOwner = family.members.map((member) => ({
    member,
    goals: family.goals.filter(
      (g) => g.type === "PERSONAL" && g.ownerId === member.user.id
    ),
  }));

  // Цели с конфликтами
  const conflictGoalIds = new Set(
    family.conflicts.flatMap((c) => [c.goalAId, c.goalBId])
  );

  // Проверяем, отметился ли текущий пользователь на этой неделе
  const currentWeek = getCurrentWeek();
  const currentUserCheckedIn = family.checkIns.some(
    (c) => c.userId === currentUser?.id && c.week === currentWeek
  );

  const handleCreateGoal = async (data: {
    title: string;
    description?: string;
    type: "FAMILY" | "PERSONAL";
    horizon: "SHORT" | "MID" | "LONG";
    deadline?: string;
    metric?: string;
    resources: ResourceType[];
    ownerId: string;
    subtasks?: string[];
  }) => {
    await createGoal({
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      familyId: family.id,
      subtasks: data.subtasks,
    });
  };

  const handleUpdateNorthStar = async (value: string) => {
    await updateNorthStar(family.id, value);
  };

  const handleResolveConflict = async (data: {
    strategy: string;
    description?: string;
    cost?: string;
    compensation?: string;
    reviewDate?: string;
  }) => {
    if (!selectedConflict) return;

    await resolveConflict({
      conflictId: selectedConflict.id,
      strategy: data.strategy as "COMPROMISE" | "SEQUENCE" | "TRANSFORM" | "PRIORITY" | "DROP",
      description: data.description,
      cost: data.cost,
      compensation: data.compensation,
      reviewDate: data.reviewDate ? new Date(data.reviewDate) : undefined,
    });

    setSelectedConflict(null);
  };

  const handleProgressChange = async (goalId: string, progress: number) => {
    await updateGoalProgress(goalId, progress);
  };

  const handleCheckIn = async (data: {
    notes: string;
    blockers: string;
    wins: string;
    completedSubtaskIds: string[];
    goalComments: { goalId: string; comment: string }[];
  }) => {
    if (!currentUser) return;

    await createCheckIn({
      userId: currentUser.id,
      familyId: family.id,
      notes: data.notes,
      blockers: data.blockers,
      wins: data.wins,
      completedSubtaskIds: data.completedSubtaskIds,
      goalComments: data.goalComments,
    });
  };

  // Цели текущего пользователя для Check-in
  const userGoals = family.goals.filter(
    (g) => g.ownerId === currentUserId && (g.status === "ACTIVE" || g.status === "DRAFT")
  );

  const handleUpdateGoal = async (data: {
    title: string;
    description?: string;
    type: "FAMILY" | "PERSONAL";
    horizon: "SHORT" | "MID" | "LONG";
    deadline?: string;
    metric?: string;
    resources: ResourceType[];
  }) => {
    if (!selectedGoal) return;

    await updateGoal(selectedGoal.id, {
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
    });
  };

  const handleDeleteGoal = async () => {
    if (!selectedGoal) return;
    await deleteGoal(selectedGoal.id);
    setSelectedGoal(null);
  };

  // Показываем пустое состояние с подсказками если нет целей
  const hasNoGoals = family.goals.length === 0;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Онбординг для новых пользователей */}
      {needsOnboarding && (
        <Onboarding 
          onComplete={completeOnboarding} 
          familyName={family.name} 
        />
      )}

      <Header
        familyName={family.name}
        northStar={family.northStar}
        conflictCount={family.conflicts.length}
        onEditNorthStar={handleUpdateNorthStar}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Conflicts Section */}
        {family.conflicts.length > 0 && (
          <section className="mb-8 animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                Цели конфликтуют — нужно решить
              </h2>
              <HelpIcon text="Две цели требуют одинаковых ресурсов. Например, обе требуют денег или времени. Нажмите «Решить вместе» чтобы найти выход." />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {family.conflicts.map((conflict) => (
                <ConflictAlert
                  key={conflict.id}
                  conflict={conflict}
                  onResolve={() => setSelectedConflict(conflict)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Weekly Check-in Section */}
        <CheckInSection
          checkIns={family.checkIns}
          onOpenCheckIn={() => setIsCheckInModalOpen(true)}
          currentUserCheckedIn={currentUserCheckedIn}
        />

        {/* Empty State with Tips */}
        {hasNoGoals && (
          <section className="mb-8">
            <div className="card text-center py-12 animate-fade-in">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">
                Добавьте первую цель!
              </h3>
              <p className="text-[var(--muted)] max-w-md mx-auto mb-6">
                Начните с чего-то простого — например, «Накопить на отпуск» или 
                «Проводить больше времени вместе». Нажмите + внизу справа.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <span className="badge bg-blue-500/20 text-blue-300">💰 Финансовые</span>
                <span className="badge bg-green-500/20 text-green-300">🏃 Здоровье</span>
                <span className="badge bg-purple-500/20 text-purple-300">📚 Развитие</span>
                <span className="badge bg-amber-500/20 text-amber-300">✈️ Путешествия</span>
              </div>
            </div>
          </section>
        )}

        {/* Family Goals */}
        {!hasNoGoals && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span>👨‍👩‍👧</span>
                  Общие цели семьи
                </h2>
                <HelpIcon text="Цели, над которыми работает вся семья вместе. Например: купить дом, поехать в отпуск, накопить подушку безопасности." />
              </div>
            </div>
            {familyGoals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {familyGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    hasConflict={conflictGoalIds.has(goal.id)}
                    onProgressChange={(progress) =>
                      handleProgressChange(goal.id, progress)
                    }
                    onClick={() => setSelectedGoal(goal)}
                    isOwner={goal.ownerId === currentUserId}
                  />
                ))}
              </div>
            ) : (
              <div className="card text-center py-8 text-[var(--muted)]">
                <p>Пока нет общих целей</p>
                <p className="text-sm mt-1">Нажмите + чтобы добавить</p>
              </div>
            )}
          </section>
        )}

        {/* Personal Goals by Member */}
        {!hasNoGoals && personalGoalsByOwner.map(({ member, goals }) => (
          <section key={member.user.id} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-sm font-bold">
                {(member.user.name || "?").charAt(0)}
              </div>
              <h2 className="text-lg font-semibold">
                {member.user.id === currentUserId ? "Мои цели" : `Цели: ${member.user.name}`}
              </h2>
              <HelpIcon text="Личные цели видит вся семья. Это помогает поддерживать друг друга и избегать конфликтов." />
              <span className="text-sm text-[var(--muted)]">
                {goals.length} {goals.length === 1 ? "цель" : goals.length < 5 ? "цели" : "целей"}
              </span>
            </div>
            {goals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {goals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    hasConflict={conflictGoalIds.has(goal.id)}
                    onProgressChange={(progress) =>
                      handleProgressChange(goal.id, progress)
                    }
                    onClick={() => setSelectedGoal(goal)}
                    isOwner={goal.ownerId === currentUserId}
                  />
                ))}
              </div>
            ) : (
              <div className="card text-center py-6 text-[var(--muted)]">
                <p>Пока нет личных целей</p>
              </div>
            )}
          </section>
        ))}

        {/* Add Goal FAB with tooltip */}
        <div className="fixed bottom-8 right-8 group">
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm whitespace-nowrap shadow-xl">
              Добавить новую цель
            </div>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg hover:scale-110 transition-transform"
            aria-label="Добавить цель"
          >
            +
          </button>
        </div>
      </main>

      {/* Create Goal Modal */}
      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateGoal}
        members={family.members}
        currentUserId={currentUser?.id || ""}
      />

      {/* Resolve Conflict Modal */}
      {selectedConflict && (
        <ResolveConflictModal
          isOpen={!!selectedConflict}
          onClose={() => setSelectedConflict(null)}
          conflict={selectedConflict}
          onResolve={handleResolveConflict}
        />
      )}

      {/* Check-in Modal */}
      {currentUser && (
        <CheckInModal
          isOpen={isCheckInModalOpen}
          onClose={() => setIsCheckInModalOpen(false)}
          onSubmit={handleCheckIn}
          currentUser={currentUser}
          hasCheckedIn={currentUserCheckedIn}
          userGoals={userGoals}
        />
      )}

      {/* Edit Goal Modal */}
      {selectedGoal && (
        <EditGoalModal
          isOpen={!!selectedGoal}
          onClose={() => setSelectedGoal(null)}
          goal={selectedGoal}
          onUpdate={handleUpdateGoal}
          onDelete={handleDeleteGoal}
        />
      )}
    </div>
  );
}
