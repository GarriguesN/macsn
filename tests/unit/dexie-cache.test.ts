// tests/unit/dexie-cache.test.ts — IndexedDB cache (fake-indexeddb)
// Modelo nuevo: meals_cache como array, cola de ops pendientes.

import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import Dexie from "dexie";
import {
  deleteCachedMeal,
  drainQueue,
  getAllCachedMeals,
  getCachedMealsByDate,
  getCachedProfile,
  getCachedTargets,
  getPendingOpCount,
  queueOp,
  resetDbForTest,
  setCachedMeals,
  setCachedProfile,
  setCachedTargets,
  upsertCachedMeal,
  wipeAll,
} from "../../src/lib/db";
import type { DailyTargets, UserProfile } from "../../src/data/user";

const storedMeal = {
  id: 1,
  date: "2026-08-31",
  meal: "lunch" as const,
  kcal: 330,
  p: 62,
  f: 7,
  h: 0,
  photo_base64: null,
  confidence: "alta" as const,
  notes: null,
  created_at: 1756732800000,
  items: [
    { id: 1, meal_id: 1, name: "pollo", grams: 200, kcal: 330, p: 62, f: 7, h: 0, ord: 0 },
  ],
};

const fakeProfile: UserProfile = {
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

const fakeTargets: DailyTargets = {
  kcal: 2200,
  pro: 30,
  car: 45,
  fat: 25,
  macroPro: 30,
  macroCar: 45,
  macroFat: 25,
  mealsPerDay: 4,
};

beforeEach(async () => {
  resetDbForTest();
  await Dexie.delete("macsn");
});

describe("meals_cache (array)", () => {
  it("setCachedMeals + getAllCachedMeals hace roundtrip", async () => {
    await setCachedMeals([storedMeal]);
    const cached = await getAllCachedMeals();
    expect(cached).toHaveLength(1);
    expect(cached[0].id).toBe(1);
  });

  it("getCachedMealsByDate filtra por fecha", async () => {
    await setCachedMeals([
      storedMeal,
      { ...storedMeal, id: 2, date: "2026-09-01" },
    ]);
    const today = await getCachedMealsByDate("2026-08-31");
    expect(today).toHaveLength(1);
    expect(today[0].id).toBe(1);
  });

  it("upsertCachedMeal añade si no tiene id real, actualiza si lo tiene", async () => {
    await upsertCachedMeal({ ...storedMeal, id: undefined });
    await upsertCachedMeal({ ...storedMeal });
    const cached = await getAllCachedMeals();
    // el segundo upsert con id=1 sobreescribe al primero (que tenía id undefined pero acabó como ++id)
    expect(cached.length).toBeGreaterThanOrEqual(1);
    expect(cached.some((m) => m.id === 1)).toBe(true);
  });

  it("deleteCachedMeal elimina por id", async () => {
    await setCachedMeals([storedMeal]);
    await deleteCachedMeal(1);
    expect(await getAllCachedMeals()).toHaveLength(0);
  });
});

describe("profile/targets cache", () => {
  it("setCachedProfile + getCachedProfile roundtrip", async () => {
    expect(await getCachedProfile()).toBeNull();
    await setCachedProfile(fakeProfile);
    expect(await getCachedProfile()).toEqual(fakeProfile);
  });

  it("setCachedTargets + getCachedTargets roundtrip", async () => {
    expect(await getCachedTargets()).toBeNull();
    await setCachedTargets(fakeTargets);
    expect(await getCachedTargets()).toEqual(fakeTargets);
  });
});

describe("pending_ops (cola offline)", () => {
  it("getPendingOpCount es 0 al inicio", async () => {
    expect(await getPendingOpCount()).toBe(0);
  });

  it("queueOp encola y getPendingOpCount lo refleja", async () => {
    await queueOp({ kind: "update_profile", payload: fakeProfile });
    expect(await getPendingOpCount()).toBe(1);
  });

  it("drainQueue ejecuta handlers en orden y vacía la cola si OK", async () => {
    const calls: string[] = [];
    await queueOp({ kind: "update_profile", payload: fakeProfile });
    await queueOp({ kind: "update_targets", payload: fakeTargets });
    await drainQueue({
      create: async () => { calls.push("create"); return null; },
      update: async () => { calls.push("update"); return null; },
      delete: async () => { calls.push("delete"); return null; },
      updateProfile: async () => { calls.push("updateProfile"); return null; },
      updateTargets: async () => { calls.push("updateTargets"); return null; },
    });
    expect(calls).toEqual(["updateProfile", "updateTargets"]);
    expect(await getPendingOpCount()).toBe(0);
  });

  it("drainQueue se para si una op falla (la op problemática queda al final)", async () => {
    await queueOp({ kind: "update_profile", payload: fakeProfile });
    await queueOp({ kind: "update_targets", payload: fakeTargets });
    await drainQueue({
      create: async () => null,
      update: async () => null,
      delete: async () => null,
      updateProfile: async () => { throw new Error("backend caído"); },
      updateTargets: async () => null,
    });
    // la primera falló, las siguientes no se ejecutaron
    expect(await getPendingOpCount()).toBe(2);
  });
});

describe("wipeAll", () => {
  it("limpia meals + profile + targets + queue", async () => {
    await setCachedMeals([storedMeal]);
    await setCachedProfile(fakeProfile);
    await setCachedTargets(fakeTargets);
    await queueOp({ kind: "update_profile", payload: fakeProfile });
    await wipeAll();
    expect(await getAllCachedMeals()).toHaveLength(0);
    expect(await getCachedProfile()).toBeNull();
    expect(await getCachedTargets()).toBeNull();
    expect(await getPendingOpCount()).toBe(0);
  });
});