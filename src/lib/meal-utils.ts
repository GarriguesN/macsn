// lib/meal-utils.ts — helpers compartidos por las vistas de comidas

import type { MealType } from "@/types";

export function mealTypeLabel(t: MealType | string): string {
  switch (t) {
    case "breakfast":
      return "Desayuno";
    case "lunch":
      return "Comida";
    case "dinner":
      return "Cena";
    case "snack":
      return "Merienda";
    default:
      return "Comida";
  }
}

/** createdAt (ms epoch) -> "13:40" */
export function fmtMealTime(createdAt: number): string {
  return new Date(createdAt).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** ISO date -> "Hoy" / "Ayer" / "Mar 13" según la cercanía */
export function fmtRelativeDay(iso: string, todayISO: string): string {
  if (iso === todayISO) return "Hoy";
  // Ayer: restar 1 día a today
  const [y, m, d] = todayISO.split("-").map(Number);
  const today = new Date(Date.UTC(y!, m! - 1, d!));
  const yesterday = new Date(today);
  yesterday.setUTCDate(today.getUTCDate() - 1);
  const yesterdayISO = yesterday.toISOString().slice(0, 10);
  if (iso === yesterdayISO) return "Ayer";

  const dt = new Date(iso + "T00:00:00Z");
  const wknd = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][dt.getUTCDay()];
  const day = dt.getUTCDate();
  return `${wknd} ${day}`;
}

/** ISO date -> "15 may" */
export function fmtShortDate(iso: string): string {
  const dt = new Date(iso + "T00:00:00Z");
  const month = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ][dt.getUTCMonth()];
  return `${dt.getUTCDate()} ${month}`;
}

/** ISO date -> "Miércoles, 15 de mayo" */
export function fmtLongDate(iso: string): string {
  const dt = new Date(iso + "T00:00:00Z");
  return dt.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Calcula el stroke-dasharray para un anillo de radio `r` y porcentaje `pct` */
export function ringDash(r: number, pct: number): string {
  const C = 2 * Math.PI * r;
  const filled = Math.min(Math.max(pct, 0), 100) / 100;
  return `${C * filled} ${C - C * filled}`;
}