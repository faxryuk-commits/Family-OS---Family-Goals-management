"use client";

import { useState } from "react";
import { Family, FamilyMember, Goal, User, Conflict } from "@prisma/client";
import { Header } from "./Header";
import { GoalCard } from "./GoalCard";
import { ConflictAlert } from "./ConflictAlert";
import { CreateGoalModal } from "./CreateGoalModal";
import { ResolveConflictModal } from "./ResolveConflictModal";
import { createGoal } from "@/lib/actions/goals";
import { updateNorthStar } from "@/lib/actions/family";
import { resolveConflict } from "@/lib/actions/conflicts";
import { updateGoalProgress } from "@/lib/actions/goals";
import { ResourceType } from "@/lib/types";

type FamilyWithRelations = Family & {
  members: (FamilyMember & { user: User })[];
  goals: (Goal & { owner: User })[];
  conflicts: (Conflict & {
    goalA: Goal & { owner: User };
    goalB: Goal & { owner: User };
  })[];
};

type FamilyBoardProps = {
  family: FamilyWithRelations;
};

export function FamilyBoard({ family }: FamilyBoardProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<
    (typeof family.conflicts)[0] | null
  >(null);

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

  const handleCreateGoal = async (data: {
    title: string;
    description?: string;
    type: "FAMILY" | "PERSONAL";
    horizon: "SHORT" | "MID" | "LONG";
    deadline?: string;
    metric?: string;
    resources: ResourceType[];
    ownerId: string;
  }) => {
    await createGoal({
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      familyId: family.id,
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

  // Для MVP используем первого пользователя как текущего
  const currentUser = family.members[0]?.user;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header
        familyName={family.name}
        northStar={family.northStar}
        conflictCount={family.conflicts.length}
        onEditNorthStar={handleUpdateNorthStar}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Conflicts Section */}
        {family.conflicts.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              Требуют решения
            </h2>
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

        {/* Family Goals */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span>👨‍👩‍👧</span>
              Цели семьи
            </h2>
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
                />
              ))}
            </div>
          ) : (
            <div className="card text-center py-8 text-[var(--muted)]">
              <p>Пока нет семейных целей</p>
            </div>
          )}
        </section>

        {/* Personal Goals by Member */}
        {personalGoalsByOwner.map(({ member, goals }) => (
          <section key={member.user.id} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-sm font-bold">
                {member.user.name.charAt(0)}
              </div>
              <h2 className="text-lg font-semibold">{member.user.name}</h2>
              <span className="text-sm text-[var(--muted)]">
                {goals.length} {goals.length === 1 ? "цель" : "целей"}
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
                  />
                ))}
              </div>
            ) : (
              <div className="card text-center py-6 text-[var(--muted)]">
                <p>Пока нет целей</p>
              </div>
            )}
          </section>
        ))}

        {/* Add Goal FAB */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg hover:scale-110 transition-transform"
        >
          +
        </button>
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
    </div>
  );
}
