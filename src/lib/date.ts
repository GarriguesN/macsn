// lib/date.ts — helpers de fecha es-ES (zona Europe/Madrid, sin libs)

const WEEKDAYS_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

/** Fecha local (Europe/Madrid) en formato YYYY-MM-DD */
export function todayISO(tz = "Europe/Madrid"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** "2026-08-31" -> Date a medianoche UTC (sin desfases de zona) */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1));
}

/** "2026-08-31" -> "Lunes, 31 de agosto" */
export function formatSpanishLong(iso: string, tz = "Europe/Madrid"): string {
  const d = new Date(`${iso}T00:00:00`);
  const parts = new Intl.DateTimeFormat("es-ES", {
    timeZone: tz,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).formatToParts(d);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${weekdayCap}, ${day} de ${month}`;
}

/** Timestamp epoch ms -> "08:15" (Europe/Madrid, 24h) */
export function formatTime(ts: number, tz = "Europe/Madrid"): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(ts));
}

/** Restar N días a un YYYY-MM-DD (aritmética UTC segura) */
export function addDaysISO(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Números estilo es-ES: 1650 -> "1.650" */
export function fmtNum(n: number): string {
  return Math.round(n).toLocaleString("es-ES");
}

/** Etiquetas de tipo de comida (es-ES) */
export const MEAL_LABELS: Record<string, string> = {
  breakfast: "Desayuno",
  lunch: "Comida",
  dinner: "Cena",
  snack: "Snack",
};