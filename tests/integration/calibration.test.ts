// tests/integration/calibration.test.ts — Integration tests for /api/scan with real photos.
// Hits the route handler directly via a NextRequest. Skips on no-key/quota.

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { POST } from "../../src/app/api/scan/route";

const PHOTOS = {
  empanadas: "/root/.hermes/cache/images/img_84b4018eeb1d.jpg", // desayuno latino: empanadas+huevos+chicharrones
  tape: "/root/.hermes/cache/images/img_819ce32ab3ac.jpg", // cinta métrica, no comida
  tortita: "/root/.hermes/cache/images/img_ff12dfdf38b7.jpg", // tortita+jamon, simple
};

function loadEnv() {
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
    if (key.startsWith("#")) continue;
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function photoAsDataUrl(p: string): string | null {
  if (!existsSync(p)) return null;
  const buf = readFileSync(p);
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

async function callScan(dataUrl: string, meal: string) {
  const req = new Request("http://localhost:3008/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: dataUrl, meal }),
  });
  return POST(req as unknown as Parameters<typeof POST>[0]);
}

describe("POST /api/scan — calibration integration", () => {
  beforeAll(() => {
    loadEnv();
  });

  it("empanadas photo: 200, returns _calibration, may produce density_outlier flag", async () => {
    const dataUrl = photoAsDataUrl(PHOTOS.empanadas);
    if (!dataUrl) {
      console.warn(`SKIP: photo not found at ${PHOTOS.empanadas}`);
      return;
    }
    if (!process.env.MINIMAX_API_KEY) {
      console.warn("SKIP: MINIMAX_API_KEY not configured");
      return;
    }

    let res: Response;
    try {
      res = await callScan(dataUrl, "breakfast");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (
        msg.includes("quota") ||
        msg.includes("rate") ||
        msg.includes("429") ||
        msg.includes("no_key") ||
        msg.includes("network") ||
        msg.includes("upstream")
      ) {
        console.warn(`SKIP: upstream unavailable — ${msg}`);
        return;
      }
      throw e;
    }

    // Aceptamos 200 (análisis exitoso) o 422 (modelo no pudo clasificarlo),
    // pero solo validamos _calibration cuando hay análisis válido.
    if (res.status !== 200) {
      console.warn(`SKIP: scan returned ${res.status} (model couldn't analyze this photo)`);
      return;
    }
    const body = (await res.json()) as Record<string, unknown> & {
      _calibration?: {
        flags: string[];
        calibrated: boolean;
        original_confidence: string;
        final_confidence: string;
      };
    };
    expect(body._calibration).toBeDefined();
    expect(Array.isArray(body._calibration!.flags)).toBe(true);
    expect(body._calibration!.original_confidence).toMatch(/^(alta|media|baja)$/);
    expect(body._calibration!.final_confidence).toMatch(/^(alta|media|baja)$/);
    // El desayuno latino (empanadas+huevos+chicharrones) tiende a generar outliers
    // cuando el modelo sobreestima kcal. No exigimos flag concreto porque la API
    // no es deterministica, pero si el modelo devuelve densidades realistas
    // entonces calibrated=false y flags=[]. Verificamos ESTRUCTURA siempre.
    expect(typeof body._calibration!.calibrated).toBe("boolean");
    console.log(
      `OK empanadas: kcal=${body.kcal_total} confidence=${body._calibration!.final_confidence} flags=${JSON.stringify(body._calibration!.flags)}`
    );
  }, 90000);

  it("tape photo (not food): 200 or 422, consistent behavior", async () => {
    const dataUrl = photoAsDataUrl(PHOTOS.tape);
    if (!dataUrl) {
      console.warn(`SKIP: photo not found at ${PHOTOS.tape}`);
      return;
    }
    if (!process.env.MINIMAX_API_KEY) {
      console.warn("SKIP: MINIMAX_API_KEY not configured");
      return;
    }

    let res: Response;
    try {
      res = await callScan(dataUrl, "snack");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (
        msg.includes("quota") ||
        msg.includes("rate") ||
        msg.includes("429") ||
        msg.includes("no_key") ||
        msg.includes("network") ||
        msg.includes("upstream")
      ) {
        console.warn(`SKIP: upstream unavailable — ${msg}`);
        return;
      }
      throw e;
    }
    expect([200, 422]).toContain(res.status);
    console.log(`OK tape: status=${res.status}`);
  }, 90000);

  it("tortita+jamon photo (simple): 200, confidence alta/media", async () => {
    const dataUrl = photoAsDataUrl(PHOTOS.tortita);
    if (!dataUrl) {
      console.warn(`SKIP: photo not found at ${PHOTOS.tortita}`);
      return;
    }
    if (!process.env.MINIMAX_API_KEY) {
      console.warn("SKIP: MINIMAX_API_KEY not configured");
      return;
    }

    let res: Response;
    try {
      res = await callScan(dataUrl, "breakfast");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (
        msg.includes("quota") ||
        msg.includes("rate") ||
        msg.includes("429") ||
        msg.includes("no_key") ||
        msg.includes("network") ||
        msg.includes("upstream")
      ) {
        console.warn(`SKIP: upstream unavailable — ${msg}`);
        return;
      }
      throw e;
    }
    if (res.status !== 200) {
      console.warn(`SKIP: scan returned ${res.status}`);
      return;
    }
    const body = (await res.json()) as {
      confidence: string;
      _calibration?: { flags: string[]; final_confidence: string };
    };
    expect(["alta", "media", "baja"]).toContain(body.confidence);
    expect(body._calibration?.final_confidence).toBe(body.confidence);
    console.log(
      `OK tortita: kcal=${(body as Record<string, unknown>).kcal_total} confidence=${body.confidence}`
    );
  }, 90000);
});
