// data/user.ts — Perfil + objetivos + textos UI.
// "use client" safe.

import type { ActivityLevel, GoalKey } from "@/types";

export type Language = "es" | "en" | "ca" | "fr";
export type Theme = "system" | "light" | "dark";
export type Units = "metric" | "imperial";

export interface UserProfile {
  name: string;
  goal: GoalKey;
  sex: "male" | "female";
  /** ISO date YYYY-MM-DD */
  birthday: string;
  /** cm */
  height: number;
  /** kg */
  weight: number;
  activity: ActivityLevel;
  language: Language;
  theme: Theme;
  units: Units;
  reminders: boolean;
}

export interface DailyTargets {
  kcal: number;
  pro: number;
  car: number;
  fat: number;
  macroPro: number;
  macroCar: number;
  macroFat: number;
  mealsPerDay: number;
}

export const GOAL_BADGE_TEXT: Record<GoalKey, string> = {
  lose_fast: "Perder rápido",
  lose: "Perder peso",
  maintain: "Mantener",
  gain: "Ganar peso",
  recomp: "Recomposición",
};

export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  sedentary: "Sedentario",
  light: "Ligero",
  moderate: "Moderado",
  active: "Activo",
  very_active: "Muy activo",
};

export const DEFAULT_PROFILE: UserProfile = {
  name: "Alex",
  goal: "maintain",
  sex: "male",
  birthday: "1995-01-01",
  height: 175,
  weight: 70,
  activity: "moderate",
  language: "es",
  theme: "system",
  units: "metric",
  reminders: true,
};

export const DEFAULT_TARGETS: DailyTargets = {
  kcal: 2200,
  pro: 30,
  car: 45,
  fat: 25,
  macroPro: 30,
  macroCar: 45,
  macroFat: 25,
  mealsPerDay: 4,
};

export const LANG_LABELS: Record<Language, string> = {
  es: "Español",
  en: "English",
  ca: "Català",
  fr: "Français",
};

export const GOAL_SHORT_BADGE: Record<GoalKey, string> = {
  lose_fast: "Pérdida rápida",
  lose: "Pérdida",
  maintain: "Mantenimiento",
  gain: "Volumen",
  recomp: "Recomp.",
};

export const GOAL_SUMMARY_TITLE: Record<GoalKey, string> = {
  lose_fast: "Plan de pérdida acelerada",
  lose: "Plan de pérdida moderada",
  maintain: "Plan de mantenimiento",
  gain: "Plan de ganancia de peso",
  recomp: "Plan de recomposición corporal",
};
