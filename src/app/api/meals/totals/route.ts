// app/api/meals/totals/route.ts — GET ?date=YYYY-MM-DD -> sums + daily_settings
import { NextRequest, NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { ApiError, errorResponse } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = initDb();
    const url = new URL(req.url);
    const date = url.searchParams.get("date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new ApiError(400, "invalid_date", "date query param required (YYYY-MM-DD)");
    }
    const sum = db
      .prepare(
        `SELECT COALESCE(SUM(kcal), 0) AS kcal,
                COALESCE(SUM(p), 0)     AS p,
                COALESCE(SUM(f), 0)     AS f,
                COALESCE(SUM(h), 0)     AS h
         FROM meals WHERE date = ?`
      )
      .get(date) as { kcal: number; p: number; f: number; h: number };

    const settings =
      (db
        .prepare(
          `SELECT kcal_goal, p_ratio, f_ratio, h_ratio
           FROM daily_settings WHERE date = ?`
        )
        .get(date) as
        | { kcal_goal: number | null; p_ratio: number | null; f_ratio: number | null; h_ratio: number | null }
        | undefined) ?? null;

    return NextResponse.json({
      date,
      kcal: sum.kcal,
      p: sum.p,
      f: sum.f,
      h: sum.h,
      kcal_goal: settings?.kcal_goal ?? null,
      p_ratio_goal: settings?.p_ratio ?? null,
      f_ratio_goal: settings?.f_ratio ?? null,
      h_ratio_goal: settings?.h_ratio ?? null,
    });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
