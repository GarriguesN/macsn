// app/api/meals/route.ts — GET (filters) + POST (create)
import { NextRequest, NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { MealInputSchema, MEAL_TYPES } from "@/lib/schemas";
import { ApiError, errorResponse } from "@/lib/errors";
import type { MealRow } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function rowsToMealsWithItems(meals: MealRow[]) {
  const db = initDb();
  if (meals.length === 0) return [];
  const ids = meals.map((m) => m.id);
  const placeholders = ids.map(() => "?").join(",");
  const items = db
    .prepare(
      `SELECT id, meal_id, name, grams, kcal, p, f, h, ord
       FROM food_items WHERE meal_id IN (${placeholders}) ORDER BY ord ASC, id ASC`
    )
    .all(...ids) as Array<{
      id: number;
      meal_id: number;
      name: string;
      grams: number;
      kcal: number;
      p: number;
      f: number;
      h: number;
      ord: number;
    }>;
  const byMeal = new Map<number, typeof items>();
  for (const it of items) {
    const arr = byMeal.get(it.meal_id) ?? [];
    arr.push(it);
    byMeal.set(it.meal_id, arr);
  }
  return meals.map((m) => ({
    ...m,
    items: byMeal.get(m.id) ?? [],
  }));
}

export async function GET(req: NextRequest) {
  try {
    const db = initDb();
    const url = new URL(req.url);
    const date = url.searchParams.get("date");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const meal = url.searchParams.get("meal");

    const where: string[] = [];
    const params: unknown[] = [];
    if (date) {
      where.push("date = ?");
      params.push(date);
    }
    if (from) {
      where.push("date >= ?");
      params.push(from);
    }
    if (to) {
      where.push("date <= ?");
      params.push(to);
    }
    if (meal) {
      if (!MEAL_TYPES.includes(meal as (typeof MEAL_TYPES)[number])) {
        throw new ApiError(400, "invalid_meal", `meal must be one of ${MEAL_TYPES.join(",")}`);
      }
      where.push("meal = ?");
      params.push(meal);
    }
    const sql = `SELECT id, date, meal, kcal, p, f, h, photo_base64, confidence, notes, created_at
                 FROM meals ${where.length ? "WHERE " + where.join(" AND ") : ""}
                 ORDER BY date DESC, created_at DESC`;
    const meals = db.prepare(sql).all(...params) as MealRow[];
    return NextResponse.json(rowsToMealsWithItems(meals));
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = initDb();
    const body: unknown = await req.json().catch(() => {
      throw new ApiError(400, "bad_json", "request body is not valid JSON");
    });
    const parsed = MealInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "invalid_input",
        "meal input failed validation",
        parsed.error.flatten()
      );
    }
    const m = parsed.data;
    const kcal = Math.round(m.items.reduce((s, it) => s + it.kcal, 0));
    const p = Math.round(m.items.reduce((s, it) => s + it.p, 0));
    const f = Math.round(m.items.reduce((s, it) => s + it.f, 0));
    const h = Math.round(m.items.reduce((s, it) => s + it.h, 0));
    const createdAt = Date.now();

    const insertMeal = db.prepare(
      `INSERT INTO meals (date, meal, kcal, p, f, h, photo_base64, confidence, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertItem = db.prepare(
      `INSERT INTO food_items (meal_id, name, grams, kcal, p, f, h, ord)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const tx = db.transaction(() => {
      const info = insertMeal.run(
        m.date,
        m.meal,
        kcal,
        p,
        f,
        h,
        m.photo_base64 ?? null,
        m.confidence ?? null,
        m.notes ?? null,
        createdAt
      );
      const mealId = Number(info.lastInsertRowid);
      m.items.forEach((it, i) => {
        insertItem.run(mealId, it.name, it.grams, it.kcal, it.p, it.f, it.h, i);
      });
      return mealId;
    });
    const mealId = tx();
    const meal = db
      .prepare(
        `SELECT id, date, meal, kcal, p, f, h, photo_base64, confidence, notes, created_at
         FROM meals WHERE id = ?`
      )
      .get(mealId) as MealRow;
    return NextResponse.json(rowsToMealsWithItems([meal])[0], { status: 201 });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
