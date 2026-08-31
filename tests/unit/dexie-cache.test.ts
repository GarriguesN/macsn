// tests/unit/dexie-cache.test.ts — IndexedDB cache (fake-indexeddb)

import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import Dexie from "dexie";
import {
  enqueueScan,
  getCachedMeals,
  pendingScanCount,
  resetDbForTest,
  setCachedMeals,
} from "../../src/lib/db";
import type { Meal } from "../../src/types";

const mealA: Meal = {
  id: 1,
  date: "2026-08-31",
  meal: "lunch",
  kcal: 330,
  p: 62,
  f: 7,
  h: 0,
  photo_base64: null,
  confidence: "alta",
  notes: null,
  created_at: 1756732800000,
  items: [
    { id: 1, meal_id: 1, name: "pollo", grams: 200, kcal: 330, p: 62, f: 7, h: 0, ord: 0 },
  ],
};

beforeEach(async () => {
  resetDbForTest();
  await Dexie.delete("macsn");
});

describe("meals_cache", () => {
  it("getCachedMeals devuelve null para una fecha sin cache", async () => {
    expect(await getCachedMeals("2026-08-31")).toBeNull();
  });

  it("setCachedMeals + getCachedMeals hace roundtrip", async () => {
    await setCachedMeals("2026-08-31", [mealA]);
    const cached = await getCachedMeals("2026-08-31");
    expect(cached).toEqual([mealA]);
    expect(cached).not.toBeNull();
  });

  it("sobrescribe la misma fecha", async () => {
    const mealB: Meal = { ...mealA, id: 2, kcal: 520 };
    await setCachedMeals("2026-08-31", [mealA]);
    await setCachedMeals("2026-08-31", [mealB]);
    const cached = await getCachedMeals("2026-08-31");
    expect(cached).toEqual([mealB]);
  });
});

describe("pending_scans", () => {
  it("pendingScanCount es 0 sin scans", async () => {
    expect(await pendingScanCount()).toBe(0);
  });

  it("enqueueScan encola y pendingScanCount lo cuenta", async () => {
    const id1 = await enqueueScan("data:image/jpeg;base64,AAAA", "lunch");
    const id2 = await enqueueScan("data:image/jpeg;base64,BBBB", "dinner");
    expect(id1).toBeGreaterThan(0);
    expect(id2).toBeGreaterThan(id1);
    expect(await pendingScanCount()).toBe(2);
  });
});