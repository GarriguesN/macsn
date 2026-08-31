// tests/integration/meals.test.ts — SQLite :memory: CRUD

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initDb, resetDbForTest } from "../../src/lib/server/db";

describe("meals CRUD (SQLite :memory:)", () => {
  beforeEach(() => {
    resetDbForTest();
  });
  afterEach(() => {
    resetDbForTest();
  });

  function makeMeal(overrides: Partial<{
    date: string;
    meal: "breakfast" | "lunch" | "dinner" | "snack";
    items: Array<{ name: string; grams: number; kcal: number; p: number; f: number; h: number }>;
    confidence?: "alta" | "media" | "baja" | null;
    notes?: string | null;
    photo_base64?: string | null;
  }> = {}) {
    return {
      date: "2026-08-30",
      meal: "lunch" as const,
      items: [
        { name: "pollo", grams: 200, kcal: 330, p: 62, f: 7, h: 0 },
        { name: "arroz", grams: 150, kcal: 195, p: 4, f: 0.5, h: 43 },
      ],
      ...overrides,
    };
  }

  it("init is idempotent (CREATE IF NOT EXISTS)", () => {
    const db = initDb(":memory:");
    initDb(":memory:"); // second call should not throw
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as Array<{ name: string }>;
    expect(tables.map((t) => t.name)).toEqual(
      expect.arrayContaining(["meals", "food_items", "daily_settings"])
    );
  });

  it("inserts a meal with items and computes totals", () => {
    const db = initDb(":memory:");
    const m = makeMeal();
    const insertMeal = db.prepare(
      `INSERT INTO meals (date, meal, kcal, p, f, h, photo_base64, confidence, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const kcal = Math.round(m.items.reduce((s, it) => s + it.kcal, 0));
    const p = Math.round(m.items.reduce((s, it) => s + it.p, 0));
    const f = Math.round(m.items.reduce((s, it) => s + it.f, 0));
    const h = Math.round(m.items.reduce((s, it) => s + it.h, 0));
    const info = insertMeal.run(m.date, m.meal, kcal, p, f, h, null, null, null, Date.now());
    const mealId = Number(info.lastInsertRowid);
    expect(mealId).toBeGreaterThan(0);
    // JS Math.round rounds half *up*: Math.round(7.5) === 8.
    // So 7 (pollo) + 0.5 (arroz) = 7.5 → Math.round === 8.
    expect(kcal).toBe(525);
    expect(p).toBe(66);
    expect(f).toBe(8);
    expect(h).toBe(43);

    const insertItem = db.prepare(
      `INSERT INTO food_items (meal_id, name, grams, kcal, p, f, h, ord) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    m.items.forEach((it, i) => insertItem.run(mealId, it.name, it.grams, it.kcal, it.p, it.f, it.h, i));
    const items = db.prepare(`SELECT * FROM food_items WHERE meal_id = ?`).all(mealId);
    expect(items).toHaveLength(2);
  });

  it("filters meals by date / meal", () => {
    const db = initDb(":memory:");
    const now = Date.now();
    db.prepare(`INSERT INTO meals (date, meal, kcal, p, f, h, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run("2026-08-30", "lunch", 500, 50, 10, 40, now);
    db.prepare(`INSERT INTO meals (date, meal, kcal, p, f, h, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run("2026-08-30", "dinner", 700, 60, 20, 50, now);
    db.prepare(`INSERT INTO meals (date, meal, kcal, p, f, h, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run("2026-08-31", "lunch", 400, 30, 5, 30, now);

    const lunchAug30 = db
      .prepare(`SELECT * FROM meals WHERE date = ? AND meal = ?`)
      .all("2026-08-30", "lunch");
    expect(lunchAug30).toHaveLength(1);

    const byDate = db.prepare(`SELECT * FROM meals WHERE date = ?`).all("2026-08-30");
    expect(byDate).toHaveLength(2);

    const byRange = db
      .prepare(`SELECT * FROM meals WHERE date BETWEEN ? AND ?`)
      .all("2026-08-29", "2026-08-30");
    expect(byRange).toHaveLength(2);
  });

  it("updates items, recomputes totals", () => {
    const db = initDb(":memory:");
    const m = makeMeal();
    const info = db
      .prepare(`INSERT INTO meals (date, meal, kcal, p, f, h, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(m.date, m.meal, 525, 66, 7, 43, Date.now());
    const mealId = Number(info.lastInsertRowid);
    db.prepare(`INSERT INTO food_items (meal_id, name, grams, kcal, p, f, h, ord) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(mealId, "pollo", 200, 330, 62, 7, 0, 0);

    const newItems = [{ name: "ensalada", grams: 250, kcal: 150, p: 5, f: 8, h: 12 }];
    const kcal = Math.round(newItems.reduce((s, it) => s + it.kcal, 0));
    db.prepare(`DELETE FROM food_items WHERE meal_id = ?`).run(mealId);
    newItems.forEach((it, i) =>
      db.prepare(`INSERT INTO food_items (meal_id, name, grams, kcal, p, f, h, ord) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(mealId, it.name, it.grams, it.kcal, it.p, it.f, it.h, i)
    );
    db.prepare(`UPDATE meals SET kcal = ? WHERE id = ?`).run(kcal, mealId);

    const updated = db.prepare(`SELECT * FROM meals WHERE id = ?`).get(mealId) as { kcal: number };
    expect(updated.kcal).toBe(150);
    const items = db.prepare(`SELECT * FROM food_items WHERE meal_id = ?`).all(mealId);
    expect(items).toHaveLength(1);
  });

  it("delete cascades to food_items", () => {
    const db = initDb(":memory:");
    const info = db
      .prepare(`INSERT INTO meals (date, meal, kcal, p, f, h, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run("2026-08-30", "lunch", 500, 50, 10, 40, Date.now());
    const mealId = Number(info.lastInsertRowid);
    db.prepare(`INSERT INTO food_items (meal_id, name, grams, kcal, p, f, h) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(mealId, "test", 100, 100, 10, 1, 20);

    expect(db.prepare(`SELECT * FROM food_items WHERE meal_id = ?`).all(mealId)).toHaveLength(1);
    db.prepare(`DELETE FROM meals WHERE id = ?`).run(mealId);
    expect(db.prepare(`SELECT * FROM food_items WHERE meal_id = ?`).all(mealId)).toHaveLength(0);
  });

  it("totals query sums correctly", () => {
    const db = initDb(":memory:");
    const now = Date.now();
    db.prepare(`INSERT INTO meals (date, meal, kcal, p, f, h, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run("2026-08-30", "breakfast", 300, 20, 5, 30, now);
    db.prepare(`INSERT INTO meals (date, meal, kcal, p, f, h, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run("2026-08-30", "lunch", 600, 50, 15, 50, now);
    db.prepare(`INSERT INTO meals (date, meal, kcal, p, f, h, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run("2026-08-31", "lunch", 400, 30, 5, 30, now);

    const sum = db
      .prepare(`SELECT COALESCE(SUM(kcal),0) AS kcal, COALESCE(SUM(p),0) AS p,
                        COALESCE(SUM(f),0) AS f, COALESCE(SUM(h),0) AS h
                 FROM meals WHERE date = ?`)
      .get("2026-08-30") as { kcal: number; p: number; f: number; h: number };
    expect(sum).toEqual({ kcal: 900, p: 70, f: 20, h: 80 });
  });

  it("rejects invalid meal type via CHECK constraint", () => {
    const db = initDb(":memory:");
    expect(() =>
      db.prepare(`INSERT INTO meals (date, meal, kcal, p, f, h, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .run("2026-08-30", "brunch", 100, 1, 1, 1, Date.now())
    ).toThrow(/CHECK/);
  });
});
