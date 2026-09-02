// data/onboarding.ts — Constantes del wizard y de las pantallas de stats.
// "use client" safe.

import type { ActivityLevel, GoalKey, HistoryScale, Sex, StatsRange } from "@/types";

export const SEX_OPTIONS: ReadonlyArray<{ key: Sex; value: Sex; label: string }> = [
  { key: "male",   value: "male",   label: "Hombre" },
  { key: "female", value: "female", label: "Mujer" },
];

export interface ActivityOption {
  key: ActivityLevel;
  value: ActivityLevel;
  label: string;
  description: string;
  iconPath: string;
  hasCircle: boolean;
}

export const ACTIVITY_OPTIONS: ReadonlyArray<ActivityOption> = [
  { key: "sedentary",   value: "sedentary",   label: "Sedentario", description: "Trabajo de oficina, sin deporte", iconPath: "M5 22h14M5 18h14M9 14a3 3 0 1 1 6 0v4H9zM12 6v4M9 10h6", hasCircle: false },
  { key: "light",       value: "light",       label: "Ligero",     description: "1-2 días/semana suave",          iconPath: "M13 4l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L4 11l6-1z",          hasCircle: false },
  { key: "moderate",    value: "moderate",    label: "Moderado",   description: "3-4 días/semana",                iconPath: "M12 3a4 4 0 0 0-4 4v3a4 4 0 0 0 8 0V7a4 4 0 0 0-4-4zM6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2", hasCircle: true },
  { key: "active",      value: "active",      label: "Activo",     description: "5-6 días/semana intenso",        iconPath: "M5 12h4l2-6 4 12 2-6h4",                                       hasCircle: false },
  { key: "very_active", value: "very_active", label: "Muy activo", description: "Atleta / trabajo físico",        iconPath: "M13 2L4 14h7l-1 8 9-12h-7z",                                   hasCircle: false },
];

const HEIGHT_TICKS_NUM: number[] = Array.from({ length: 71 }, (_, i) => 140 + i);
const WEIGHT_TICKS_NUM: number[] = Array.from({ length: 121 }, (_, i) => 40 + i);

export const HEIGHT_TICKS: Array<{ label: string }> = HEIGHT_TICKS_NUM.map((v) => ({ label: String(v) }));
export const WEIGHT_TICKS: Array<{ label: string }> = WEIGHT_TICKS_NUM.map((v) => ({ label: String(v) }));

export const MEAL_OPTIONS = [
  { value: 3, label: "3 comidas" },
  { value: 4, label: "4 comidas" },
  { value: 5, label: "5 comidas" },
  { value: 6, label: "6 comidas" },
] as const;

export interface GoalOption {
  key: GoalKey;
  value: GoalKey;
  title: string;
  description: string;
  bullets: string[];
  /** SVG path d del icono */
  iconPath: string;
  /** Si el icono lleva además un <circle> */
  isTarget: boolean;
  /** Alias de description para los consumidores que lo piden como `desc` */
  desc: string;
}

export const GOAL_OPTIONS: ReadonlyArray<GoalOption> = [
  { key: "lose_fast", value: "lose_fast", title: "Perder rápido", description: "Déficit agresivo (~25%) para perder peso a buen ritmo.", bullets: ["~1 kg/semana", "Plan estricto", "Mayor disciplina"],         iconPath: "M3 17l6-6 4 4 8-8",                              isTarget: false, desc: "Déficit agresivo (~25%) para perder peso a buen ritmo." },
  { key: "lose",      value: "lose",      title: "Perder peso",   description: "Déficit moderado (~15%) sostenible en el tiempo.",       bullets: ["~0.5 kg/semana", "Equilibrado", "Recomendado"],          iconPath: "M3 12h4l3-9 6 18 3-9",                              isTarget: false, desc: "Déficit moderado (~15%) sostenible en el tiempo." },
  { key: "maintain",  value: "maintain",  title: "Mantener",      description: "Equilibrio calórico, sin perder ni ganar peso.",        bullets: ["Calorías = gasto", "Sin restricciones", "Para recomponer"], iconPath: "M3 12l3 3 7-7",                                  isTarget: false, desc: "Equilibrio calórico, sin perder ni ganar peso." },
  { key: "gain",      value: "gain",      title: "Ganar peso",    description: "Superávit (~10%) para ganar masa magra o peso.",        bullets: ["~0.3 kg/semana", "Más comida", "Volumen limpio"],         iconPath: "M3 7l9-4 9 4M3 7l9 4 9-4M3 7v10l9 4 9-4V7",            isTarget: true,  desc: "Superávit (~10%) para ganar masa magra o peso." },
  { key: "recomp",    value: "recomp",    title: "Recomposición", description: "Mantener peso mientras ganas músculo y pierdes grasa.", bullets: ["Lento pero óptimo", "Para principiantes", "Mejores resultados a largo plazo"], iconPath: "M12 3v18M3 12h18",                          isTarget: true,  desc: "Mantener peso mientras ganas músculo y pierdes grasa." },
];

export const STATS_RANGES: ReadonlyArray<{ key: StatsRange; label: string; days: number }> = [
  { key: "week",  label: "Semana",  days: 7 },
  { key: "month", label: "Mes",     days: 30 },
  { key: "year",  label: "Año",     days: 365 },
  { key: "all",   label: "Todo",    days: 365 * 5 },
];

export const HISTORY_TABS: ReadonlyArray<{ key: HistoryScale; label: string; days: number }> = [
  { key: "days",   label: "Días",   days: 7 },
  { key: "weeks",  label: "Semanas", days: 30 },
  { key: "months", label: "Meses",   days: 90 },
  { key: "years",  label: "Años",    days: 365 },
];

export interface OnboardingFeature {
  iconPath: string;
  title: string;
  description: string;
  hasExtraPaths: boolean;
  isTarget: boolean;
  desc: string;
}

export const ONBOARDING_FEATURES: ReadonlyArray<OnboardingFeature> = [
  { iconPath: "M5 7h3l2-3h4l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", title: "Escanea tu plato",      description: "Una foto y listo: kcal, proteínas, grasas e hidratos en segundos.", hasExtraPaths: false, isTarget: false, desc: "Una foto y listo: kcal, proteínas, grasas e hidratos en segundos." },
  { iconPath: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",                          title: "Tus datos son tuyos",    description: "Sin login, sin cuentas. Todo vive en tu dispositivo.",              hasExtraPaths: false, isTarget: false, desc: "Sin login, sin cuentas. Todo vive en tu dispositivo." },
  { iconPath: "M3 3v18h18M7 17l4-4 3 3 5-6",                                            title: "Aprende de tus semanas", description: "Estadísticas claras para que ajustes sin pensar.",                hasExtraPaths: false, isTarget: false, desc: "Estadísticas claras para que ajustes sin pensar." },
];

export const ICON_CAMERA =
  "M5 7h3l2-3h4l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z";

export const ICON_SHIELD =
  "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z";

export interface SummaryStep {
  iconPath: string;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  isTarget: boolean;
  desc: string;
}

export const SUMMARY_NEXT_STEPS: ReadonlyArray<SummaryStep> = [
  { iconPath: "M3 7l9-4 9 4M3 7l9 4 9-4M3 7v10l9 4 9-4V7",     iconBg: "#f0f7f2", iconColor: "#1e7b3d", title: "Empieza por tu próxima comida", description: "Escanea tu primer plato o registra una comida manualmente.",          isTarget: false, desc: "Escanea tu primer plato o registra una comida manualmente." },
  { iconPath: "M3 3v18h18M7 17l4-4 3 3 5-6",                  iconBg: "#fff4ec", iconColor: "#f39c12", title: "Revisa las estadísticas",        description: "Tras unos días de uso verás tendencias, kcal y ratios de macros.",       isTarget: false, desc: "Tras unos días de uso verás tendencias, kcal y ratios de macros." },
  { iconPath: "M12 8v8m-4-4h8",                                iconBg: "#f0f7f2", iconColor: "#1e7b3d", title: "Ajusta objetivos cuando quieras", description: "Tu metabolismo cambia. Puedes modificar kcal y macros en Ajustes.",     isTarget: false, desc: "Tu metabolismo cambia. Puedes modificar kcal y macros en Ajustes." },
];
