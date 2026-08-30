// lib/postprocess.ts — Calibración post-análisis.
//
// Toma el MealAnalysis que devuelve MiniMax M3 y le aplica tres validaciones:
//   1. Density outlier: cada item cuya kcal/g declarada cae fuera del rango
//      plausible de su categoría (con tolerancia ±30% inf, +40% sup) genera flag.
//   2. Sum mismatch: si la suma de items[].kcal difiere de kcal_total en >10%.
//   3. Auto-degradación de confianza: ≥2 outliers -> "baja"; 1 outlier + "alta"
//      -> "media". El objetivo es que el usuario se fíe de la confianza.
//
// NO modifica kcal ni gramos. Solo marca flags y, opcionalmente, baja la
// confianza. Devuelve ambos (meal y diagnóstico) para que el endpoint pueda
// exponer la calibración al cliente.

import type { MealAnalysis } from "./schemas";
import { classifyFood, densityRange } from "./calibration";

export interface CalibrationResult {
  flags: string[];
  calibrated: boolean;
  original_confidence: "alta" | "media" | "baja";
  final_confidence: "alta" | "media" | "baja";
}

export interface CalibratedMeal {
  result: MealAnalysis;
  calib: CalibrationResult;
}

export function calibrateMeal(meal: MealAnalysis): CalibratedMeal {
  const flags: string[] = [];
  const original_confidence = meal.confidence;

  // 1. Validar densidad kcal/g por item
  for (const item of meal.items) {
    const category = classifyFood(item.name);
    if (!category) continue;
    const range = densityRange(category);
    if (!range) continue;
    const [min, max] = range;
    if (item.grams <= 0) continue;
    const density = item.kcal / item.grams;
    // tolerancia ±30% en el lado inferior, +40% en el superior
    const low_ok = density >= min * 0.7;
    const high_ok = density <= max * 1.4;
    if (!low_ok || !high_ok) {
      flags.push(
        `density_outlier: ${item.name} = ${density.toFixed(2)} kcal/g (esperado ${min}-${max})`
      );
    }
  }

  // 2. Verificar consistencia suma kcal
  const sum_kcal = meal.items.reduce((a, i) => a + i.kcal, 0);
  const diff_pct =
    meal.kcal_total > 0 ? Math.abs(sum_kcal - meal.kcal_total) / meal.kcal_total : 0;
  if (diff_pct > 0.1) {
    flags.push(
      `sum_mismatch: items=${sum_kcal} vs total=${meal.kcal_total} (diff ${(diff_pct * 100).toFixed(1)}%)`
    );
  }

  // 3. Auto-degradar confianza según número de outliers
  const outlier_count = flags.filter((f) => f.startsWith("density_outlier")).length;
  let final_confidence: "alta" | "media" | "baja" = original_confidence;
  if (outlier_count >= 2) {
    final_confidence = "baja";
  } else if (outlier_count === 1 && original_confidence === "alta") {
    final_confidence = "media";
  }
  // 4. Si también hay sum_mismatch, baja un escalón adicional (media->baja)
  const has_sum_mismatch = flags.some((f) => f.startsWith("sum_mismatch"));
  if (has_sum_mismatch && final_confidence === "media") {
    final_confidence = "baja";
  }

  return {
    result: { ...meal, confidence: final_confidence },
    calib: {
      flags,
      calibrated: flags.length > 0,
      original_confidence,
      final_confidence,
    },
  };
}
