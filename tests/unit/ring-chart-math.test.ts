// tests/unit/ring-chart-math.test.ts — % de llenado del ring (clamping, goal=0)

import { describe, expect, it } from "vitest";
import { fillRatio, pctText } from "../../src/lib/ring-math";

describe("fillRatio", () => {
  it("devuelve 0 cuando el goal falta o es 0 (sin dividir por cero)", () => {
    expect(fillRatio(100, 0)).toBe(0);
    expect(fillRatio(100, null)).toBe(0);
    expect(fillRatio(100, undefined)).toBe(0);
    expect(fillRatio(100, -50)).toBe(0);
  });

  it("devuelve 0 cuando current es 0 o negativo", () => {
    expect(fillRatio(0, 2200)).toBe(0);
    expect(fillRatio(-5, 2200)).toBe(0);
  });

  it("calcula el ratio lineal", () => {
    expect(fillRatio(1100, 2200)).toBeCloseTo(0.5, 5);
    expect(fillRatio(1650, 2200)).toBeCloseTo(0.75, 5);
  });

  it("clampa a 1 cuando se supera la meta", () => {
    expect(fillRatio(2600, 2200)).toBe(1);
    expect(fillRatio(5000, 2200)).toBe(1);
  });
});

describe("pctText", () => {
  it("redondea a porcentaje entero", () => {
    expect(pctText(0.756)).toBe("76%");
    expect(pctText(0)).toBe("0%");
    expect(pctText(1)).toBe("100%");
    expect(pctText(0.1)).toBe("10%");
  });
});