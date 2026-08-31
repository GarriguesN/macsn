// app/api/meals/[id]/route.ts — GET / PATCH / DELETE
import { NextRequest, NextResponse } from "next/server";
import { initDb } from "@/lib/server/db";
import { MealPatchSchema, MEAL_TYPES } from "@/lib/schemas";
import { ApiError, errorResponse } from "@/lib/errors";
import type { MealRow } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function loadMeal(id: number): MealRow | null {
  const db = initDb();
  return (
    (db
      .prepare(
        `SELECT id, date, meal, kcal, p, f, h, photo_base64, confidence, notes, created_at
         FROM meals WHERE id = ?`
      )
      .get(id) as MealRow | undefined) ?? null
  );
}

function loadItems(mealId: number) {
  const db = initDb();
  return db
    .prepare(
      `SELECT id, meal_id, name, grams, kcal, p, f, h, ord
       FROM food_items WHERE meal_id = ? ORDER BY ord ASC, id ASC`
    )
    .all(mealId) as Array<{
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
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const mealId = Number(id);
    if (!Number.isInteger(mealId) || mealId <= 0) {
      throw new ApiError(400, "invalid_id", "id must be a positive integer");
    }
    const meal = loadMeal(mealId);
    if (!meal) throw new ApiError(404, "not_found", `meal ${mealId} not found`);
    return NextResponse.json({ ...meal, items: loadItems(mealId) });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const db = initDb();
    const { id } = await ctx.params;
    const mealId = Number(id);
    if (!Number.isInteger(mealId) || mealId <= 0) {
      throw new ApiError(400, "invalid_id", "id must be a positive integer");
    }
    const existing = loadMeal(mealId);
    if (!existing) throw new ApiError(404, "not_found", `meal ${mealId} not found`);

    const body: unknown = await req.json().catch(() => {
      throw new ApiError(400, "bad_json", "request body is not valid JSON");
    });
    const parsed = MealPatchSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "invalid_input",
        "patch failed validation",
        parsed.error.flatten()
      );
    }
    const patch = parsed.data;

    const tx = db.transaction(() => {
      const set: string[] = [];
      const params: unknown[] = [];
      if (patch.date !== undefined) {
        set.push("date = ?");
        params.push(patch.date);
      }
      if (patch.meal !== undefined) {
        if (!MEAL_TYPES.includes(patch.meal)) {
          throw new ApiError(400, "invalid_meal", `meal must be one of ${MEAL_TYPES.join(",")}`);
        }
        set.push("meal = ?");
        params.push(patch.meal);
      }
      if (patch.photo_base64 !== undefined) {
        set.push("photo_base64 = ?");
        params.push(patch.photo_base64);
      }
      if (patch.confidence !== undefined) {
        set.push("confidence = ?");
        params.push(patch.confidence);
      }
      if (patch.notes !== undefined) {
        set.push("notes = ?");
        params.push(patch.notes);
      }

      if (patch.items !== undefined) {
        // recompute totals
        const kcal = Math.round(patch.items.reduce((s, it) => s + it.kcal, 0));
        const p = Math.round(patch.items.reduce((s, it) => s + it.p, 0));
        const f = Math.round(patch.items.reduce((s, it) => s + it.f, 0));
        const h = Math.round(patch.items.reduce((s, it) => s + it.h, 0));
        set.push("kcal = ?", "p = ?", "f = ?", "h = ?");
        params.push(kcal, p, f, h);
      }

      if (set.length > 0) {
        params.push(mealId);
        db.prepare(`UPDATE meals SET ${set.join(", ")} WHERE id = ?`).run(...params);
      }

      if (patch.items !== undefined) {
        db.prepare(`DELETE FROM food_items WHERE meal_id = ?`).run(mealId);
        const insertItem = db.prepare(
          `INSERT INTO food_items (meal_id, name, grams, kcal, p, f, h, ord)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        );
        patch.items.forEach((it, i) =>
          insertItem.run(mealId, it.name, it.grams, it.kcal, it.p, it.f, it.h, i)
        );
      }
    });
    tx();

    const meal = loadMeal(mealId)!;
    return NextResponse.json({ ...meal, items: loadItems(mealId) });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const db = initDb();
    const { id } = await ctx.params;
    const mealId = Number(id);
    if (!Number.isInteger(mealId) || mealId <= 0) {
      throw new ApiError(400, "invalid_id", "id must be a positive integer");
    }
    const info = db.prepare(`DELETE FROM meals WHERE id = ?`).run(mealId);
    if (info.changes === 0) {
      throw new ApiError(404, "not_found", `meal ${mealId} not found`);
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
