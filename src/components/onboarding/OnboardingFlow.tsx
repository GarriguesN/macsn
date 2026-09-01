// components/onboarding/OnboardingFlow.tsx — wrapper 'use client' del flujo wizard
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import OnboardingWelcome from "@/components/onboarding/OnboardingWelcome";
import GoalsStep from "@/components/onboarding/GoalsStep";
import PersonalInfoStep from "@/components/onboarding/PersonalInfoStep";
import DailyGoalStep from "@/components/onboarding/DailyGoalStep";
import SummaryStep from "@/components/onboarding/SummaryStep";
import { useApp, isOnboardingComplete } from "@/lib/store";
import { DEFAULT_TARGETS, DEFAULT_PROFILE } from "@/data/user";
import type {
  ActivityLevel,
  GoalKey,
  Sex,
} from "@/types";

export type OnboardingStep = "welcome" | "goals" | "personal" | "daily" | "summary";

export interface OnboardingState {
  goal: GoalKey;
  sex: Sex;
  birthday: string;
  height: number;
  weight: number;
  activity: ActivityLevel;
  targetKcal: number;
  macroPro: number;
  macroCar: number;
  macroFat: number;
  mealsPerDay: number;
}

const INITIAL_STATE: OnboardingState = {
  goal: DEFAULT_PROFILE.goal,
  sex: DEFAULT_PROFILE.sex,
  birthday: DEFAULT_PROFILE.birthday,
  height: DEFAULT_PROFILE.height,
  weight: DEFAULT_PROFILE.weight,
  activity: DEFAULT_PROFILE.activity,
  targetKcal: DEFAULT_TARGETS.kcal,
  macroPro: DEFAULT_TARGETS.macroPro,
  macroCar: DEFAULT_TARGETS.macroCar,
  macroFat: DEFAULT_TARGETS.macroFat,
  mealsPerDay: DEFAULT_TARGETS.mealsPerDay,
};

export default function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editMode = searchParams.get("edit"); // "personal" | "daily" | null
  const { profile, targets, updateProfile, updateTargets, hydrated } = useApp();

  // Paso inicial: si hay ?edit=daily/personal, saltamos a ese paso.
  // Si no hay edit y no se ha completado el onboarding, empezamos por "welcome".
  // Si ya completó, vamos a "summary" (que sirve como confirmación).
  const initialStep: OnboardingStep = useMemo(() => {
    if (editMode === "daily") return "daily";
    if (editMode === "personal") return "personal";
    if (!hydrated) return "welcome";
    return isOnboardingComplete(profile) ? "summary" : "welcome";
  }, [editMode, hydrated, profile]);

  const [step, setStep] = useState<OnboardingStep>(initialStep);

  // Hidratar estado desde el store al montar
  const [state, setState] = useState<OnboardingState>(INITIAL_STATE);
  useEffect(() => {
    if (!hydrated) return;
    setState({
      goal: profile.goal,
      sex: profile.sex,
      birthday: profile.birthday,
      height: profile.height,
      weight: profile.weight,
      activity: profile.activity,
      targetKcal: targets.kcal,
      macroPro: targets.macroPro,
      macroCar: targets.macroCar,
      macroFat: targets.macroFat,
      mealsPerDay: targets.mealsPerDay,
    });
  }, [hydrated, profile, targets]);

  const update = (patch: Partial<OnboardingState>) =>
    setState((prev) => ({ ...prev, ...patch }));

  const goHome = () => router.push("/");
  const next = (s: OnboardingStep) => setStep(s);

  // Construimos profile + targets nuevos para persistir al final
  const persist = async () => {
    await updateProfile({
      goal: state.goal,
      sex: state.sex,
      birthday: state.birthday,
      height: state.height,
      weight: state.weight,
      activity: state.activity,
    });
    await updateTargets({
      kcal: state.targetKcal,
      macroPro: state.macroPro,
      macroCar: state.macroCar,
      macroFat: state.macroFat,
      mealsPerDay: state.mealsPerDay,
    });
  };

  return (
    <>
      {step === "welcome" && (
        <OnboardingWelcome onContinue={() => next("goals")} onSkip={goHome} />
      )}
      {step === "goals" && (
        <GoalsStep
          selected={state.goal}
          onSelect={(goal) => update({ goal })}
          onContinue={async () => {
            // Si entramos vía edit, NO pisamos el perfil completo: solo guardamos goal
            if (editMode) {
              await updateProfile({ goal: state.goal });
              goHome();
              return;
            }
            next("personal");
          }}
          onBack={() => next("welcome")}
          onSkip={goHome}
          editMode={!!editMode}
        />
      )}
      {step === "personal" && (
        <PersonalInfoStep
          state={state}
          update={update}
          onContinue={async () => {
            if (editMode === "personal") {
              // Persistir y volver a ajustes
              await persist();
              router.push("/ajustes");
              return;
            }
            next("daily");
          }}
          onBack={() => next("goals")}
          onSkip={goHome}
          editMode={editMode === "personal"}
        />
      )}
      {step === "daily" && (
        <DailyGoalStep
          state={state}
          update={update}
          onContinue={async () => {
            if (editMode === "daily") {
              // Persistir y volver a ajustes
              await persist();
              router.push("/ajustes");
              return;
            }
            next("summary");
          }}
          onBack={() => next("personal")}
          onSkip={goHome}
          editMode={editMode === "daily"}
        />
      )}
      {step === "summary" && (
        <SummaryStep
          state={state}
          onFinish={async () => {
            // Si llegamos al summary desde "edit" o desde "ya completado",
            // aseguramos persistir y vamos a home.
            await persist();
            goHome();
          }}
        />
      )}
    </>
  );
}