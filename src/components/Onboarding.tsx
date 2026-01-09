"use client";

import { useState, useEffect } from "react";

type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  action?: string;
};

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Добро пожаловать в FamilyOS! 🎉",
    description:
      "Это приложение помогает семье ставить цели и достигать их вместе. Главная идея: цели членов семьи не обязаны совпадать, но должны быть совместимы.",
    emoji: "👨‍👩‍👧",
  },
  {
    id: "mission",
    title: "Миссия семьи",
    description:
      'Это главный ориентир вашей семьи — к чему вы стремитесь вместе. Например: "Финансовая свобода и путешествия" или "Дать детям лучшее образование". Все цели должны вести к этой миссии.',
    emoji: "🌟",
  },
  {
    id: "goals",
    title: "Личные и семейные цели",
    description:
      "Каждый член семьи может ставить свои цели. Семейные цели — общие для всех. Личные — только ваши, но семья их видит и поддерживает.",
    emoji: "🎯",
  },
  {
    id: "resources",
    title: "Ресурсы целей",
    description:
      "Каждая цель требует ресурсов: деньги, время, место, энергию или готовность рисковать. Это важно — система покажет, если две цели требуют одинаковых ресурсов.",
    emoji: "💎",
  },
  {
    id: "conflicts",
    title: "Когда цели конфликтуют",
    description:
      'Если муж хочет "Открыть бизнес в Москве", а жена "Переехать в Турцию" — обе цели требуют одного ресурса: места жительства. Система это заметит и предложит решить вместе.',
    emoji: "⚡",
  },
  {
    id: "resolution",
    title: "5 способов решить конфликт",
    description:
      "Компромисс (оба уступают), По очереди (сначала одно, потом другое), Объединить (найти третий путь), Приоритет (одна цель важнее), или Отказ (отменить одну цель).",
    emoji: "🤝",
  },
  {
    id: "weekly",
    title: "Еженедельные итоги",
    description:
      "Раз в неделю каждый отмечается: что сделал, чем гордится, где застрял. Это помогает не забросить цели и вовремя попросить помощь.",
    emoji: "📋",
  },
  {
    id: "start",
    title: "Готовы начать?",
    description:
      "Создайте первую цель, пригласите партнёра по коду, и начните путь к мечтам вместе!",
    emoji: "🚀",
    action: "Начать!",
  },
];

type OnboardingProps = {
  onComplete: () => void;
  familyName: string;
};

export function Onboarding({ onComplete, familyName }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      setIsVisible(false);
      setTimeout(onComplete, 300);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Content */}
      <div
        className={`relative w-full max-w-lg transition-all duration-300 ${
          isVisible ? "animate-fade-in" : "opacity-0 scale-95"
        }`}
      >
        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-1 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-[var(--muted)]">
            <span>
              {currentStep + 1} / {ONBOARDING_STEPS.length}
            </span>
            <button
              onClick={handleSkip}
              className="hover:text-white transition-colors"
            >
              Пропустить
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="card text-center">
          {/* Emoji */}
          <div className="text-6xl mb-6 animate-bounce-subtle">{step.emoji}</div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-4">
            {step.id === "welcome"
              ? step.title.replace("FamilyOS", familyName)
              : step.title}
          </h2>

          {/* Description */}
          <p className="text-[var(--muted)] leading-relaxed mb-8">
            {step.description}
          </p>

          {/* Navigation */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="btn btn-secondary flex-1"
              >
                ← Назад
              </button>
            )}
            <button onClick={handleNext} className="btn btn-primary flex-1">
              {step.action || (isLastStep ? "Завершить" : "Далее →")}
            </button>
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-4">
          {ONBOARDING_STEPS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? "w-6 bg-blue-500"
                  : index < currentStep
                  ? "bg-blue-500/50"
                  : "bg-[var(--border)]"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Hook для проверки, прошёл ли пользователь онбординг
export function useOnboarding(userId: string) {
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const storageKey = `familyos_onboarding_${userId}`;

  useEffect(() => {
    const completed = localStorage.getItem(storageKey);
    setNeedsOnboarding(!completed);
  }, [storageKey]);

  const completeOnboarding = () => {
    localStorage.setItem(storageKey, "true");
    setNeedsOnboarding(false);
  };

  return { needsOnboarding, completeOnboarding };
}
