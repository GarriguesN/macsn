// tests/unit/photo-validation.test.ts — photo_base64 solo acepta data URLs de imagen

import { describe, expect, it } from "vitest";
import {
  MealInputSchema,
  MealPatchSchema,
  PHOTO_DATA_URL_REGEX,
} from "../../src/lib/schemas";

const base = {
  date: "2026-08-30",
  meal: "lunch" as const,
  items: [{ name: "pollo", grams: 200, kcal: 330, p: 62, f: 7, h: 0 }],
};

describe("PHOTO_DATA_URL_REGEX", () => {
  it("acepta data URLs jpeg/jpg/png/webp", () => {
    for (const mime of ["jpeg", "jpg", "png", "webp"]) {
      expect(
        PHOTO_DATA_URL_REGEX.test(`data:image/${mime};base64,/9j/4AAQ`)
      ).toBe(true);
    }
  });

  it("rechaza URLs arbitrarias, blob:, otros mime y vacío", () => {
    expect(PHOTO_DATA_URL_REGEX.test("http://evil.example/x.jpg")).toBe(false);
    expect(PHOTO_DATA_URL_REGEX.test("https://evil.example/track.gif")).toBe(
      false
    );
    expect(PHOTO_DATA_URL_REGEX.test("blob:https://app.example/abc")).toBe(
      false
    );
    expect(PHOTO_DATA_URL_REGEX.test("data:image/svg+xml;base64,PHN2Zz4=")).toBe(
      false
    );
    expect(PHOTO_DATA_URL_REGEX.test("data:image/jpeg;charset=utf-8,/9j")).toBe(
      false
    );
    expect(PHOTO_DATA_URL_REGEX.test("")).toBe(false);
  });
});

describe("MealInputSchema.photo_base64", () => {
  it("rechaza una URL http arbitraria (tracking pixel)", () => {
    const r = MealInputSchema.safeParse({
      ...base,
      photo_base64: "http://evil.example/x.jpg",
    });
    expect(r.success).toBe(false);
  });

  it("acepta un data URL de imagen válido", () => {
    const r = MealInputSchema.safeParse({
      ...base,
      photo_base64: "data:image/jpeg;base64,/9j/4AAQ",
    });
    expect(r.success).toBe(true);
  });

  it("acepta null y undefined (campo opcional)", () => {
    expect(
      MealInputSchema.safeParse({ ...base, photo_base64: null }).success
    ).toBe(true);
    expect(MealInputSchema.safeParse(base).success).toBe(true);
  });
});

describe("MealPatchSchema.photo_base64", () => {
  it("rechaza una URL arbitraria", () => {
    const r = MealPatchSchema.safeParse({
      photo_base64: "https://evil.example/track.gif",
    });
    expect(r.success).toBe(false);
  });

  it("acepta data URL válido y null", () => {
    expect(
      MealPatchSchema.safeParse({
        photo_base64: "data:image/png;base64,iVBORw0KGgo",
      }).success
    ).toBe(true);
    expect(MealPatchSchema.safeParse({ photo_base64: null }).success).toBe(true);
  });
});