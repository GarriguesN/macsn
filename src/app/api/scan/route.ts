// app/api/scan/route.ts — POST foto -> BAML/wrapper -> MealAnalysis -> calibrateMeal
import { NextRequest, NextResponse } from "next/server";
import { ScanInputSchema } from "@/lib/schemas";
import { analyzeMeal } from "@/lib/baml";
import { calibrateMeal } from "@/lib/postprocess";
import { ApiError, errorResponse } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json().catch(() => {
      throw new ApiError(400, "bad_json", "request body is not valid JSON");
    });
    const parsed = ScanInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "invalid_input",
        "scan input failed validation",
        parsed.error.flatten()
      );
    }
    const analysis = await analyzeMeal({
      imageDataUrl: parsed.data.image,
      meal: parsed.data.meal,
      mealContext: parsed.data.meal_context,
    });
    // Post-procesado: detecta outliers de densidad y degrada la confianza si procede.
    const { result, calib } = calibrateMeal(analysis);
    return NextResponse.json({
      ...result,
      _calibration: {
        flags: calib.flags,
        calibrated: calib.calibrated,
        original_confidence: calib.original_confidence,
        final_confidence: calib.final_confidence,
      },
    });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
