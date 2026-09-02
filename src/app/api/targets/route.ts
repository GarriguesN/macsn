// app/api/targets/route.ts — GET / PUT singleton de objetivos diarios (kcal + macros).
import { NextRequest, NextResponse } from "next/server";
import { initDb } from "@/lib/server/db";
import { ApiError, errorResponse } from "@/lib/errors";

const DEFAULT_TARGETS = {
  kcal: 2200,
  pro: 30,
  car: 45,
  fat: 25,
  macroPro: 30,
  macroCar: 45,
  macroFat: 25,
  mealsPerDay: 4,
};

function validateTargets(input: unknown): Record<string, number> {
  if (!input || typeof input !== "object") {
    throw new ApiError(400, "invalid_input", "Targets must be an object");
  }
  const t = input as Record<string, unknown>;
  const out: Record<string, number> = {};
  for (const f of ["kcal", "pro", "car", "fat", "macroPro", "macroCar", "macroFat", "mealsPerDay"]) {
    if (!(f in t)) {
      throw new ApiError(400, "invalid_input", `Missing field: ${f}`);
    }
    const v = t[f];
    if (typeof v !== "number" || !Number.isFinite(v)) {
      throw new ApiError(400, "invalid_input", `${f} must be a finite number`);
    }
    out[f] = v;
  }
  // Rangos razonables
  if (out.kcal < 800 || out.kcal > 6000) throw new ApiError(400, "invalid_input", "kcal must be 800..6000");
  for (const k of ["pro", "car", "fat", "macroPro", "macroCar", "macroFat"]) {
    if (out[k] < 0 || out[k] > 100) throw new ApiError(400, "invalid_input", `${k} must be 0..100`);
  }
  // Ratio integrity: pro + car + fat ≈ 100 (tolerancia ±0.5)
  const sum = out.pro + out.car + out.fat;
  if (Math.abs(sum - 100) > 0.5) {
    throw new ApiError(400, "invalid_input", `pro+car+fat must sum ~100 (got ${sum.toFixed(1)})`);
  }
  if (out.mealsPerDay < 1 || out.mealsPerDay > 10) {
    throw new ApiError(400, "invalid_input", "mealsPerDay must be 1..10");
  }
  return out;
}

export async function GET(): Promise<NextResponse> {
  const db = initDb();
  const row = db.prepare("SELECT * FROM targets WHERE id = 'singleton'").get() as Record<string, unknown> | undefined;
  if (!row) {
    return NextResponse.json(DEFAULT_TARGETS);
  }
  return NextResponse.json({
    kcal: row.kcal,
    pro: row.pro,
    car: row.car,
    fat: row.fat,
    macroPro: row.macro_pro,
    macroCar: row.macro_car,
    macroFat: row.macro_fat,
    mealsPerDay: row.meals_per_day,
  });
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const t = validateTargets(body);
    const db = initDb();
    const now = Date.now();
    db.prepare(
      `INSERT INTO targets (id, kcal, pro, car, fat, macro_pro, macro_car, macro_fat, meals_per_day, updated_at)
       VALUES ('singleton', @kcal, @pro, @car, @fat, @macroPro, @macroCar, @macroFat, @mealsPerDay, @updated_at)
       ON CONFLICT(id) DO UPDATE SET
         kcal=excluded.kcal, pro=excluded.pro, car=excluded.car, fat=excluded.fat,
         macro_pro=excluded.macro_pro, macro_car=excluded.macro_car, macro_fat=excluded.macro_fat,
         meals_per_day=excluded.meals_per_day, updated_at=excluded.updated_at`
    ).run({
      kcal: t.kcal,
      pro: t.pro,
      car: t.car,
      fat: t.fat,
      macroPro: t.macroPro,
      macroCar: t.macroCar,
      macroFat: t.macroFat,
      mealsPerDay: t.mealsPerDay,
      updated_at: now,
    });
    return NextResponse.json(t);
  } catch (e) {
    const { status, body } = errorResponse(e);
    return NextResponse.json(body, { status });
  }
}
