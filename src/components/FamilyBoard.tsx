"use client";

import { useState } from "react";
import { Family, FamilyMember, Goal, User, Conflict, CheckIn, Agreement, Subtask, Comment, Notification, Reaction } from "@prisma/client";
import { Header } from "./Header";
import { GoalCard } from "./GoalCard";
import { ConflictAlert } from "./ConflictAlert";
import { CreateGoalModal } from "./CreateGoalModal";
import { ResolveConflictModal } from "./ResolveConflictModal";
import { CheckInModal } from "./CheckInModal";
import { GoalDetailsModal } from "./GoalDetailsModal";
import { Onboarding, useOnboarding } from "./Onboarding";
import { HelpIcon } from "./Tooltip";
import { Reactions } from "./Reactions";
import { createGoal } from "@/lib/actions/goals";
import { updateNorthStar } from "@/lib/actions/family";
import { resolveConflict } from "@/lib/actions/conflicts";
import { updateGoalProgress } from "@/lib/actions/goals";
import { createCheckIn } from "@/lib/actions/checkins";
import { getCurrentWeek } from "@/lib/utils";
import { ResourceType } from "@/lib/types";
import { EditGoalModal } from "./EditGoalModal";
import { updateGoal, deleteGoal } from "@/lib/actions/goals";
import Link from "next/link";

type NotificationWithSender = Notification & {
  fromUser: { id: string; name: string | null; image: string | null } | null;
};

type Author = {
  id: string;
  name: string | null;
  image: string | null;
  level: number;
};

type CommentWithAuthor = Comment & {
  author: Author;
};

type ReactionWithUser = Reaction & {
  user: { id: string; name: string | null; image: string | null };
};

type GoalWithSubtasks = Goal & { 
  owner: User;
  subtasks: Subtask[];
  comments: CommentWithAuthor[];
  reactions: ReactionWithUser[];
  _count: { comments: number; reactions: number };
};

type CheckInWithReactions = CheckIn & { 
  user: User;
  reactions: ReactionWithUser[];
};

type ExtendedUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  level: number;
  xp: number;
  streak: number;
  longestStreak: number;
  goalsCompleted: number;
  subtasksCompleted: number;
};

type FamilyWithRelations = Family & {
  members: (FamilyMember & { user: ExtendedUser })[];
  goals: GoalWithSubtasks[];
  conflicts: (Conflict & {
    goalA: Goal & { owner: User };
    goalB: Goal & { owner: User };
  })[];
  checkIns: CheckInWithReactions[];
  agreements: Agreement[];
};

type FamilyBoardProps = {
  family: FamilyWithRelations;
  currentUserId: string;
  notifications?: NotificationWithSender[];
  unreadNotificationsCount?: number;
};

// Форматирование даты
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "только что";
  if (minutes < 60) return `${minutes} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  if (days < 7) return `${days} д назад`;
  return new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

// Цвет уровня
function getLevelColor(level: number): string {
  if (level >= 25) return "from-yellow-400 to-amber-600";
  if (level >= 10) return "from-purple-400 to-pink-600";
  if (level >= 5) return "from-blue-400 to-cyan-600";
  return "from-emerald-400 to-green-600";
}

export function FamilyBoard({ family, currentUserId, notifications = [], unreadNotificationsCount = 0 }: FamilyBoardProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<(typeof family.conflicts)[0] | null>(null);
  const [viewingGoal, setViewingGoal] = useState<(typeof family.goals)[0] | null>(null);
  const [editingGoal, setEditingGoal] = useState<(typeof family.goals)[0] | null>(null);
  const [activeTab, setActiveTab] = useState<"feed" | "goals" | "family">("feed");

  const { needsOnboarding, completeOnboarding } = useOnboarding(currentUserId);
  const currentMember = family.members.find(m => m.user.id === currentUserId);
  const currentUser = currentMember?.user;

  const currentWeek = getCurrentWeek();
  const currentUserCheckedIn = family.checkIns.some(
    (c) => c.userId === currentUser?.id && c.week === currentWeek
  );

  // Создаём ленту активности
  const feedItems = [
    // Check-ins
    ...family.checkIns.map(checkIn => ({
      type: "checkin" as const,
      id: checkIn.id,
      user: checkIn.user,
      date: checkIn.createdAt,
      data: checkIn,
    })),
    // Completed goals
    ...family.goals
      .filter(g => g.status === "COMPLETED")
      .map(goal => ({
        type: "goal_completed" as const,
        id: goal.id,
        user: goal.owner,
        date: goal.updatedAt,
        data: goal,
      })),
    // New goals (last 7 days)
    ...family.goals
      .filter(g => {
        const created = new Date(g.createdAt);
        const now = new Date();
        return now.getTime() - created.getTime() < 7 * 24 * 60 * 60 * 1000;
      })
      .map(goal => ({
        type: "goal_created" as const,
        id: goal.id,
        user: goal.owner,
        date: goal.createdAt,
        data: goal,
      })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   .slice(0, 20);

  const conflictGoalIds = new Set(family.conflicts.flatMap((c) => [c.goalAId, c.goalBId]));
  const userGoals = family.goals.filter(g => g.ownerId === currentUserId && (g.status === "ACTIVE" || g.status === "DRAFT"));
  const familyGoals = family.goals.filter(g => g.type === "FAMILY");

  // Handlers
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
    assignedToId?: string;
    images?: string[];
  }) => {
    await createGoal({
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      familyId: family.id,
      subtasks: data.subtasks,
      assignedToId: data.assignedToId,
      images: data.images,
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

  const handleUpdateGoal = async (data: {
    title: string;
    description?: string;
    type: "FAMILY" | "PERSONAL";
    horizon: "SHORT" | "MID" | "LONG";
    deadline?: string;
    metric?: string;
    resources: ResourceType[];
    status: string;
    subtasks?: { id?: string; title: string; completed?: boolean }[];
  }) => {
    if (!editingGoal) return;
    await updateGoal(editingGoal.id, {
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : null,
    });
    setViewingGoal(null);
  };

  const handleDeleteGoal = async () => {
    if (!editingGoal) return;
    await deleteGoal(editingGoal.id);
    setEditingGoal(null);
    setViewingGoal(null);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[var(--background)] pb-24 lg:pb-6">
      {needsOnboarding && <Onboarding onComplete={completeOnboarding} familyName={family.name} />}

      <Header
        familyName={family.name}
        northStar={family.northStar}
        conflictCount={family.conflicts.length}
        onEditNorthStar={handleUpdateNorthStar}
        currentUser={currentUser}
        familyLevel={family.level}
        familyXp={family.xp}
        notifications={notifications}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      <div className="max-w-6xl mx-auto px-4 py-4 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Left Sidebar - Hidden on mobile */}
          <aside className="hidden lg:block lg:col-span-3 space-y-4">
            {/* Quick Actions */}
            <div className="card p-4 space-y-2">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full btn btn-primary flex items-center justify-center gap-2"
              >
                <span>🎯</span> Новая цель
              </button>
              <button
                onClick={() => setIsCheckInModalOpen(true)}
                className={`w-full btn flex items-center justify-center gap-2 ${
                  currentUserCheckedIn 
                    ? "btn-secondary text-green-400" 
                    : "bg-gradient-to-r from-orange-500 to-pink-500 text-white"
                }`}
              >
                <span>{currentUserCheckedIn ? "✅" : "📋"}</span>
                {currentUserCheckedIn ? "Уже отметился" : "Check-in недели"}
              </button>
            </div>

            {/* Family Members */}
            <div className="card p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span>👨‍👩‍👧</span> Семья
                <HelpIcon text="Члены вашей семьи. Пригласите партнёра через Настройки → Пригласить." />
              </h3>
              <div className="space-y-3">
                {family.members.map(member => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getLevelColor(member.user.level)} flex items-center justify-center text-sm font-bold`}>
                      {(member.user.name || "?").charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {member.user.name}
                        {member.user.id === currentUserId && <span className="text-[var(--muted)]"> (Вы)</span>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                        <span className={`px-1.5 py-0.5 rounded bg-gradient-to-r ${getLevelColor(member.user.level)} text-white`}>
                          Lv.{member.user.level}
                        </span>
                        {member.user.streak > 0 && <span className="text-orange-400">🔥{member.user.streak}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conflicts */}
            {family.conflicts.length > 0 && (
              <div className="card p-4 border-red-500/30">
                <h3 className="font-semibold mb-3 text-red-400 flex items-center gap-2">
                  <span>⚠️</span> Конфликты
                  <HelpIcon text="Две цели требуют одинаковых ресурсов! Обсудите вместе и найдите компромисс. Нажмите на конфликт чтобы решить." />
                </h3>
                {family.conflicts.map(conflict => (
                  <div 
                    key={conflict.id}
                    className="p-3 bg-red-500/10 rounded-lg mb-2 cursor-pointer hover:bg-red-500/20 transition-colors"
                    onClick={() => setSelectedConflict(conflict)}
                  >
                    <div className="text-sm font-medium">{conflict.goalA.title}</div>
                    <div className="text-xs text-[var(--muted)]">vs</div>
                    <div className="text-sm font-medium">{conflict.goalB.title}</div>
                  </div>
                ))}
              </div>
            )}
          </aside>

          {/* Main Content - Full width on mobile */}
          <main className="col-span-1 lg:col-span-6 space-y-4">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-[var(--card)] rounded-xl border border-[var(--border)]">
              {[
                { id: "feed", label: "Лента", icon: "📰" },
                { id: "goals", label: "Цели", icon: "🎯" },
                { id: "family", label: "Семья", icon: "👨‍👩‍👧" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                      : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]"
                  }`}
                >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Feed Tab */}
            {activeTab === "feed" && (
              <div className="space-y-4">
                {feedItems.length === 0 ? (
                  <div className="card p-8 text-center">
                    <div className="text-4xl mb-3">📭</div>
                    <div className="font-semibold mb-1">Лента пуста</div>
                    <div className="text-sm text-[var(--muted)]">
                      Создайте первую цель или сделайте check-in!
                    </div>
                  </div>
                ) : (
                  feedItems.map(item => (
                    <div key={`${item.type}-${item.id}`} className="card p-4 animate-fade-in">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getLevelColor((item.user as ExtendedUser).level || 1)} flex items-center justify-center text-sm font-bold`}>
                          {(item.user.name || "?").charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.user.name}</div>
                          <div className="text-xs text-[var(--muted)]">{formatRelativeTime(item.date)}</div>
                        </div>
                        <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          item.type === "checkin" ? "bg-blue-100 text-blue-600" :
                          item.type === "goal_completed" ? "bg-green-100 text-green-600" :
                          "bg-purple-100 text-purple-600"
                        }`}>
                          {item.type === "checkin" ? "📋 Check-in" :
                           item.type === "goal_completed" ? "🏆 Выполнено" :
                           "🎯 Новая цель"}
                        </div>
                      </div>

                      {/* Content */}
                      {item.type === "checkin" && (
                        <div className="space-y-3">
                          {item.data.wins && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="text-xs text-green-600 font-medium mb-1">🏆 Победы</div>
                              <div className="text-sm text-green-800">{item.data.wins}</div>
                            </div>
                          )}
                          {item.data.notes && (
                            <div className="text-sm text-[var(--muted)]">{item.data.notes}</div>
                          )}
                          {item.data.blockers && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="text-xs text-red-600 font-medium mb-1">🚧 Нужна помощь</div>
                              <div className="text-sm text-red-800">{item.data.blockers}</div>
                            </div>
                          )}
                          
                          {/* Reactions for check-in */}
                          <div className="pt-2 border-t border-gray-100">
                            <Reactions
                              targetType="checkIn"
                              targetId={item.id}
                              reactions={(() => {
                                const checkInReactions = (item.data as CheckInWithReactions).reactions;
                                const reactionsArray = Array.isArray(checkInReactions) ? checkInReactions : [];
                                return reactionsArray.reduce((acc, r) => {
                                  if (!acc[r.emoji]) acc[r.emoji] = [];
                                  acc[r.emoji].push(r.user);
                                  return acc;
                                }, {} as Record<string, { id: string; name: string | null; image: string | null }[]>);
                              })()}
                              currentUserId={currentUserId}
                              myReaction={(() => {
                                const checkInReactions = (item.data as CheckInWithReactions).reactions;
                                const reactionsArray = Array.isArray(checkInReactions) ? checkInReactions : [];
                                return reactionsArray.find(r => r.userId === currentUserId)?.emoji;
                              })()}
                              compact
                            />
                          </div>
                        </div>
                      )}

                      {(item.type === "goal_completed" || item.type === "goal_created") && (
                        <div 
                          className="p-3 bg-[var(--background)] rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                          onClick={() => item.data.ownerId === currentUserId && setViewingGoal(item.data as GoalWithSubtasks)}
                        >
                          <div className="font-medium">{(item.data as Goal).title}</div>
                          {(item.data as Goal).description && (
                            <div className="text-sm text-[var(--muted)] mt-1 line-clamp-2">
                              {(item.data as Goal).description}
                            </div>
                          )}
                          {item.type === "goal_completed" && (
                            <div className="mt-2 text-green-400 text-sm">✅ 100% выполнено!</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Goals Tab */}
            {activeTab === "goals" && (
              <div className="space-y-4">
                {family.goals.length === 0 ? (
                  <div className="card p-8 text-center">
                    <div className="text-4xl mb-3">🎯</div>
                    <div className="font-semibold mb-1">Нет целей</div>
                    <div className="text-sm text-[var(--muted)] mb-4">
                      Добавьте первую цель, чтобы начать путь к мечте!
                    </div>
                    <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
                      Создать цель
                    </button>
                  </div>
                ) : (
                  <>
                    {familyGoals.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <span>👨‍👩‍👧</span> Семейные цели
                        </h3>
                        <div className="grid gap-4">
                          {familyGoals.map(goal => (
                            <GoalCard
                              key={goal.id}
                              goal={goal}
                              hasConflict={conflictGoalIds.has(goal.id)}
                              onProgressChange={(p) => handleProgressChange(goal.id, p)}
                              onClick={() => setViewingGoal(goal)}
                              isOwner={goal.ownerId === currentUserId}
                              isAssignedToMe={goal.assignedToId === currentUserId}
                              currentUserId={currentUserId}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {family.members.map(member => {
                      const memberGoals = family.goals.filter(g => g.type === "PERSONAL" && g.ownerId === member.user.id);
                      if (memberGoals.length === 0) return null;
                      return (
                        <div key={member.id}>
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${getLevelColor(member.user.level)} flex items-center justify-center text-xs font-bold`}>
                              {(member.user.name || "?").charAt(0)}
                            </div>
                            {member.user.id === currentUserId ? "Мои цели" : `Цели: ${member.user.name}`}
                          </h3>
                          <div className="grid gap-4">
                            {memberGoals.map(goal => (
                              <GoalCard
                                key={goal.id}
                                goal={goal}
                                hasConflict={conflictGoalIds.has(goal.id)}
                                onProgressChange={(p) => handleProgressChange(goal.id, p)}
                                onClick={() => setViewingGoal(goal)}
                                isOwner={goal.ownerId === currentUserId}
                                isAssignedToMe={goal.assignedToId === currentUserId}
                                currentUserId={currentUserId}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {/* Family Tab */}
            {activeTab === "family" && (
              <div className="space-y-4">
                {/* Leaderboard */}
                <div className="card p-4">
                  <h3 className="font-semibold mb-4">🏆 Лидерборд семьи</h3>
                  <div className="space-y-3">
                    {[...family.members]
                      .sort((a, b) => b.user.xp - a.user.xp)
                      .map((member, index) => (
                        <div key={member.id} className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-xl">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                            index === 0 ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-black" :
                            index === 1 ? "bg-gradient-to-r from-gray-300 to-gray-400 text-black" :
                            index === 2 ? "bg-gradient-to-r from-orange-400 to-orange-600 text-white" :
                            "bg-[var(--card)]"
                          }`}>
                            {index + 1}
                          </div>
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getLevelColor(member.user.level)} flex items-center justify-center text-lg font-bold`}>
                            {(member.user.name || "?").charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{member.user.name}</div>
                            <div className="text-sm text-[var(--muted)]">
                              Lv.{member.user.level} • {member.user.xp} XP
                            </div>
                          </div>
                          <div className="text-right">
                            {member.user.streak > 0 && (
                              <div className="text-orange-400 font-semibold">🔥{member.user.streak}</div>
                            )}
                            <div className="text-xs text-[var(--muted)]">
                              {member.user.goalsCompleted} побед
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Family Stats */}
                <div className="card p-4">
                  <h3 className="font-semibold mb-4">📊 Статистика семьи</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl text-center">
                      <div className="text-2xl font-bold text-blue-400">{family.goals.length}</div>
                      <div className="text-sm text-[var(--muted)]">Всего целей</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl text-center">
                      <div className="text-2xl font-bold text-green-400">{family.goalsCompleted}</div>
                      <div className="text-sm text-[var(--muted)]">Выполнено</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl text-center">
                      <div className="text-2xl font-bold text-purple-400">Lv.{family.level}</div>
                      <div className="text-sm text-[var(--muted)]">Уровень семьи</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl text-center">
                      <div className="text-2xl font-bold text-orange-400">🔥{family.weeklyStreak}</div>
                      <div className="text-sm text-[var(--muted)]">Недельный стрик</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Right Sidebar - Hidden on mobile */}
          <aside className="hidden lg:block lg:col-span-3 space-y-4">
            {/* My Progress */}
            {currentUser && (
              <div className="card p-4">
                <h3 className="font-semibold mb-3">📈 Мой прогресс</h3>
                <div className="space-y-3">
                  {userGoals.slice(0, 3).map(goal => (
                    <div 
                      key={goal.id} 
                      className="cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors"
                      onClick={() => setViewingGoal(goal)}
                    >
                      <div className="flex justify-between text-sm mb-1">
                        <span className="truncate">{goal.title}</span>
                        <span className="text-[var(--muted)]">{goal.progress}%</span>
                      </div>
                      <div className="h-2 bg-[var(--background)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {userGoals.length === 0 && (
                    <div className="text-sm text-[var(--muted)] text-center py-4">
                      Нет активных целей
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Wins */}
            <div className="card p-4">
              <h3 className="font-semibold mb-3">🏆 Последние победы</h3>
              <div className="space-y-2">
                {family.goals
                  .filter(g => g.status === "COMPLETED")
                  .slice(0, 5)
                  .map(goal => (
                    <div key={goal.id} className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg">
                      <div className={`w-6 h-6 rounded bg-gradient-to-br ${getLevelColor((goal.owner as ExtendedUser).level || 1)} flex items-center justify-center text-xs font-bold`}>
                        {(goal.owner.name || "?").charAt(0)}
                      </div>
                      <span className="text-sm truncate flex-1">{goal.title}</span>
                      <span className="text-green-400">✓</span>
                    </div>
                  ))}
                {family.goals.filter(g => g.status === "COMPLETED").length === 0 && (
                  <div className="text-sm text-[var(--muted)] text-center py-4">
                    Пока нет побед
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--card)]/95 backdrop-blur-lg border-t border-[var(--border)] p-3 pb-safe flex items-center justify-around lg:hidden z-40">
        <button
          onClick={() => setIsCheckInModalOpen(true)}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl ${
            currentUserCheckedIn ? "text-green-500" : "text-[var(--muted)]"
          }`}
        >
          <span className="text-xl">{currentUserCheckedIn ? "✅" : "📋"}</span>
          <span className="text-xs">Check-in</span>
        </button>
        
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-14 h-14 -mt-6 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/30"
        >
          +
        </button>
        
        <button
          onClick={() => setActiveTab("family")}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl ${
            activeTab === "family" ? "text-indigo-500" : "text-[var(--muted)]"
          }`}
        >
          <span className="text-xl">👨‍👩‍👧</span>
          <span className="text-xs">Семья</span>
        </button>
      </div>

      {/* Modals */}
      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateGoal}
        members={family.members}
        currentUserId={currentUserId}
      />

      {selectedConflict && (
        <ResolveConflictModal
          isOpen={!!selectedConflict}
          onClose={() => setSelectedConflict(null)}
          conflict={selectedConflict}
          onResolve={handleResolveConflict}
        />
      )}

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

      {/* Goal Details Modal (with comments) */}
      {viewingGoal && (
        <GoalDetailsModal
          isOpen={!!viewingGoal}
          onClose={() => setViewingGoal(null)}
          goal={viewingGoal}
          currentUserId={currentUserId}
          onEdit={viewingGoal.ownerId === currentUserId ? () => {
            setEditingGoal(viewingGoal);
            setViewingGoal(null);
          } : undefined}
        />
      )}

      {/* Edit Goal Modal */}
      {editingGoal && (
        <EditGoalModal
          isOpen={!!editingGoal}
          onClose={() => setEditingGoal(null)}
          goal={editingGoal}
          onUpdate={handleUpdateGoal}
          onDelete={handleDeleteGoal}
        />
      )}
    </div>
  );
}
