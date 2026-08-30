// tests/unit/scan.test.ts — Real photo via MiniMax M3. SKIP on quota/no-key.

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { analyzeMeal, getApiKey } from "../../src/lib/baml";
import { MealAnalysisSchema } from "../../src/lib/schemas";

const PHOTO = "/root/.hermes/cache/images/img_def9cea61201.jpg";

function loadEnv() {
  // Load API key from /root/.hermes/.env if present (project convention)
  const envFile = "/root/.hermes/.env";
  if (!existsSync(envFile)) return;
  const text = readFileSync(envFile, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1]!;
    let value = m[2] ?? "";
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    // skip commented
    if (key.startsWith("#")) continue;
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

describe("analyzeMeal with real photo (MiniMax M3)", () => {
  beforeAll(() => {
    loadEnv();
  });

  it("returns MealAnalysis for the cached ham+tortilla photo", async () => {
    if (!existsSync(PHOTO)) {
      console.warn(`SKIP: photo not found at ${PHOTO}`);
      return;
    }
    const key = getApiKey();
    if (!key) {
      console.warn("SKIP: MINIMAX_API_KEY not configured");
      return;
    }

    const buf = readFileSync(PHOTO);
    const b64 = buf.toString("base64");
    const dataUrl = `data:image/jpeg;base64,${b64}`;

    let result;
    try {
      result = await analyzeMeal({
        imageDataUrl: dataUrl,
        meal: "lunch",
        mealContext: "almuerzo",
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("quota") || msg.includes("rate") || msg.includes("429") || msg.includes("no_key") || msg.includes("network") || msg.includes("upstream")) {
        console.warn(`SKIP: upstream unavailable — ${msg}`);
        return;
      }
      throw e;
    }

    expect(MealAnalysisSchema.safeParse(result).success).toBe(true);
    expect(result.kcal_total).toBeGreaterThan(0);
    expect(result.items.length).toBeGreaterThanOrEqual(1);
    // sanity: ham + small tortilla ≈ 80-120 kcal depending on size
    expect(result.kcal_total).toBeLessThan(2000);
    console.log(`OK: plato="${result.plato}" kcal=${result.kcal_total} items=${result.items.length}`);
  }, 60000);
});
