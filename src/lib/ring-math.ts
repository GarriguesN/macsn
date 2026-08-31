// lib/ring-math.ts — matemática de los anillos de actividad (pura, testeable)

/**
 * Ratio de llenado de un anillo, clamped a [0, 1].
 * - goal ausente o <= 0  -> 0 (nunca dividir por cero)
 * - current <= 0         -> 0
 * - current > goal       -> 1 (sobre meta)
 */
export function fillRatio(
  current: number,
  goal: number | null | undefined
): number {
  if (!goal || goal <= 0) return 0;
  if (!current || current <= 0) return 0;
  return Math.min(1, Math.max(0, current / goal));
}

/** "0.756" -> "76%" (porcentaje entero) */
export function pctText(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}