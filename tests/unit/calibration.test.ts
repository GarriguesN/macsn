// tests/unit/calibration.test.ts — Unit tests for calibration + postprocess.
// No network, no DB. Deterministic.

import { describe, it, expect } from "vitest";
import { FOOD_DENSITY, classifyFood, densityRange } from "../../src/lib/calibration";
import { calibrateMeal } from "../../src/lib/postprocess";
import type { MealAnalysis } from "../../src/lib/schemas";

describe("FOOD_DENSITY table", () => {
  it("contains the expected categories (bedca + latin breakfast overlap)", () => {
    const expected = [
      "arroz_cocido",
      "pan_blanco",
      "tortilla_espanola",
      "jamon_serrano",
      "pollo",
      "gambas",
      "huevo_frito",
      "aceite_oliva",
      "queso_manchego",
      "empanada_frita",
      "chicharrones",
      "salmon",
      "bacon",
    ];
    for (const key of expected) {
      expect(FOOD_DENSITY[key]).toBeDefined();
      const [min, max] = FOOD_DENSITY[key]!;
      expect(min).toBeGreaterThan(0);
      expect(max).toBeGreaterThan(min);
    }
  });

  it("every range is strictly positive and min<max", () => {
    for (const [key, [min, max]] of Object.entries(FOOD_DENSITY)) {
      expect(min, `${key} min`).toBeGreaterThan(0);
      expect(max, `${key} max`).toBeGreaterThan(min);
    }
  });

  it("densityRange returns the same tuple for known keys and null for unknown", () => {
    expect(densityRange("pollo")).toEqual([1.4, 2.4]);
    expect(densityRange("not_a_food")).toBeNull();
  });
});

describe("classifyFood", () => {
  it("matches case-insensitively on the first root of each key", () => {
    expect(classifyFood("Arroz Blanco Cocido")).toBe("arroz_cocido");
    expect(classifyFood("filete de POLLO")).toBe("pollo");
    expect(classifyFood("Empanada Frita")).toBe("empanada_frita");
    expect(classifyFood("tortilla española")).toBe("tortilla_espanola");
    expect(classifyFood("jamón serrano")).toBe("jamon_serrano");
    expect(classifyFood("rodaja de salmon")).toBe("salmon");
  });

  it("strips accents before matching", () => {
    expect(classifyFood("aceite de oliva")).toBe("aceite_oliva");
    expect(classifyFood("salmón al horno")).toBe("salmon");
  });

  it("returns null when no category matches", () => {
    expect(classifyFood("salsa de soja")).toBeNull();
    expect(classifyFood("")).toBeNull();
  });
});

describe("calibrateMeal — density outliers", () => {
  const baseMeal: MealAnalysis = {
    plato: "Desayuno latino",
    confidence: "alta",
    kcal_total: 1000,
    proteinas_total_g: 40,
    grasas_total_g: 40,
    hidratos_total_g: 80,
    items: [],
  };

  it("flags density_outlier when empanadas are reported at 5 kcal/g", () => {
    // empanada real ~3.1 kcal/g. Si el modelo declara 400 kcal / 80g = 5.0 kcal/g, flag.
    const meal: MealAnalysis = {
      ...baseMeal,
      items: [
        { name: "empanada frita", grams: 80, kcal: 400, p: 8, f: 22, h: 40 },
        { name: "huevo frito", grams: 60, kcal: 110, p: 7, f: 9, h: 0.5 },
      ],
      kcal_total: 510, // = 400+110 (perfectly consistent)
    };
    const { result, calib } = calibrateMeal(meal);
    const outlier_flags = calib.flags.filter((f) => f.startsWith("density_outlier"));
    expect(outlier_flags.length).toBeGreaterThanOrEqual(1);
    expect(outlier_flags[0]).toMatch(/empanada frita/);
    // 1 outlier + original "alta" -> degrada a "media"
    expect(calib.final_confidence).toBe("media");
    expect(result.confidence).toBe("media");
  });

  it("degrades to baja when >=2 outliers", () => {
    const meal: MealAnalysis = {
      ...baseMeal,
      items: [
        { name: "empanada frita", grams: 80, kcal: 600, p: 8, f: 35, h: 50 }, // ~7.5 kcal/g, fuera
        { name: "chicharrones", grams: 50, kcal: 100, p: 5, f: 4, h: 0 }, // ~2 kcal/g, < 4.5*0.7=3.15
      ],
      kcal_total: 700,
    };
    const { result, calib } = calibrateMeal(meal);
    expect(calib.final_confidence).toBe("baja");
    expect(result.confidence).toBe("baja");
  });

  it("does NOT flag items within tolerance", () => {
    const meal: MealAnalysis = {
      ...baseMeal,
      items: [
        // arroz cocido 200g a 1.3 kcal/g = 260 kcal (perfecto, en rango)
        { name: "arroz cocido", grams: 200, kcal: 260, p: 4, f: 0.6, h: 56 },
        // pollo 200g a 1.65 kcal/g = 330 kcal (en rango 1.4-2.4)
        { name: "pechuga de pollo", grams: 200, kcal: 330, p: 62, f: 7, h: 0 },
      ],
      kcal_total: 590,
    };
    const { calib, result } = calibrateMeal(meal);
    const outlier_flags = calib.flags.filter((f) => f.startsWith("density_outlier"));
    expect(outlier_flags).toEqual([]);
    expect(calib.final_confidence).toBe("alta");
    expect(result.confidence).toBe("alta");
    expect(calib.calibrated).toBe(false);
  });
});

describe("calibrateMeal — sum mismatch", () => {
  it("flags sum_mismatch when items and kcal_total diverge >10%", () => {
    const meal: MealAnalysis = {
      plato: "test",
      confidence: "alta",
      kcal_total: 500,
      proteinas_total_g: 30,
      grasas_total_g: 20,
      hidratos_total_g: 40,
      items: [
        { name: "arroz", grams: 200, kcal: 260, p: 4, f: 0.5, h: 56 },
        { name: "pollo", grams: 200, kcal: 330, p: 62, f: 7, h: 0 },
      ], // sum=590, total=500 -> diff 18%
    };
    const { calib } = calibrateMeal(meal);
    const mm = calib.flags.find((f) => f.startsWith("sum_mismatch"));
    expect(mm).toBeDefined();
    expect(mm).toMatch(/items=590 vs total=500/);
  });

  it("does NOT flag sum_mismatch when items and kcal_total match within 10%", () => {
    const meal: MealAnalysis = {
      plato: "test",
      confidence: "alta",
      kcal_total: 525, // sum=525 exactly
      proteinas_total_g: 66,
      grasas_total_g: 8,
      hidratos_total_g: 43,
      items: [
        { name: "pollo", grams: 200, kcal: 330, p: 62, f: 7, h: 0 },
        { name: "arroz", grams: 150, kcal: 195, p: 4, f: 0.5, h: 43 },
      ],
    };
    const { calib } = calibrateMeal(meal);
    expect(calib.flags.find((f) => f.startsWith("sum_mismatch"))).toBeUndefined();
  });
});

describe("calibrateMeal — confidence preservation", () => {
  it("keeps 'media' even with 1 outlier (no downgrade cascade)", () => {
    const meal: MealAnalysis = {
      plato: "test",
      confidence: "media",
      kcal_total: 750, // sum=750, exactamente, para NO disparar sum_mismatch
      proteinas_total_g: 54,
      grasas_total_g: 33,
      hidratos_total_g: 50,
      items: [
        { name: "empanada frita", grams: 80, kcal: 500, p: 8, f: 28, h: 50 }, // outlier
        { name: "pollo", grams: 150, kcal: 250, p: 46, f: 5, h: 0 }, // in range
      ],
    };
    const { calib } = calibrateMeal(meal);
    expect(calib.final_confidence).toBe("media"); // 1 outlier + sin sum_mismatch -> sin cambio
  });

  it("always reports both original and final confidence", () => {
    const meal: MealAnalysis = {
      plato: "test",
      confidence: "alta",
      kcal_total: 200,
      proteinas_total_g: 30,
      grasas_total_g: 5,
      hidratos_total_g: 0,
      items: [{ name: "salmon", grams: 150, kcal: 280, p: 30, f: 17, h: 0 }], // 1.87 kcal/g, en rango 1.8-2.4
    };
    const { calib } = calibrateMeal(meal);
    expect(calib.original_confidence).toBe("alta");
    expect(calib.final_confidence).toBe("alta");
  });
});

describe("calibrateMeal — escenarios reales de testing", () => {
  // Reproduce el escenario reportado por el usuario en su round de testing:
  // desayuno latino (empanadas+huevos+chicharrones) con kcal sobreestimadas.
  it("escenario empanadas+huevos sobreestimados genera flags y degrada confianza", () => {
    const meal: MealAnalysis = {
      plato: "Desayuno con huevos fritos, tocino y empanadas fritas",
      confidence: "alta",
      kcal_total: 950,
      proteinas_total_g: 51,
      grasas_total_g: 73,
      hidratos_total_g: 53,
      items: [
        { name: "Huevos fritos", grams: 100, kcal: 310, p: 26, f: 22, h: 2 }, // 3.10 kcal/g OUTLIER (huevo_frito 1.7-2.1)
        { name: "Tocino/bacon", grams: 30, kcal: 140, p: 9, f: 11, h: 1 }, // 4.67 kcal/g (bacon 4.0-5.5)
        { name: "Empanadas fritas (2 unidades)", grams: 160, kcal: 500, p: 16, f: 40, h: 50 }, // 3.12 kcal/g (empanada 2.0-3.5)
      ],
    };
    const { result, calib } = calibrateMeal(meal);
    // Huevos fritos es el unico outlier (los otros estan dentro de la tolerancia extendida)
    const outliers = calib.flags.filter((f) => f.startsWith("density_outlier"));
    expect(outliers.length).toBe(1);
    expect(outliers[0]).toMatch(/huevo/i);
    // 1 outlier + "alta" -> "media"
    expect(calib.final_confidence).toBe("media");
    expect(result.confidence).toBe("media");
    expect(calib.calibrated).toBe(true);
  });

  it("escenario chicharrones sobreestimados degrada a 'baja'", () => {
    const meal: MealAnalysis = {
      plato: "Chicharrones con limon",
      confidence: "alta",
      kcal_total: 800,
      proteinas_total_g: 20,
      grasas_total_g: 70,
      hidratos_total_g: 0,
      items: [
        // chicharrones rango 4.5-5.5, tolerancia sup 7.7. 12 kcal/g esta fuera.
        { name: "chicharrones fritos", grams: 50, kcal: 600, p: 5, f: 60, h: 0 },
        // huevos fritos rango 1.7-2.1, tolerancia sup 2.94. 4 kcal/g fuera.
        { name: "huevos fritos", grams: 50, kcal: 200, p: 13, f: 16, h: 1 },
      ],
    };
    const { calib } = calibrateMeal(meal);
    expect(calib.final_confidence).toBe("baja");
    expect(calib.flags.filter((f) => f.startsWith("density_outlier")).length).toBe(2);
  });
});
