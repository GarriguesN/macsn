// lib/baml.ts — MiniMax M3 vision wrapper.
// We use the custom openai-generic endpoint /v1/text/chatcompletion_v2 directly,
// because BAML's openai-generic provider doesn't expose a per-endpoint path override.
//
// Schema (BAML) stays as the source of truth for validation; this wrapper
// constructs the MiniMax M2 messages format and validates the response with Zod.

import type { MealAnalysis } from "./schemas";
import { MealAnalysisSchema } from "./schemas";
import { ApiError } from "./errors";

const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL ?? "https://api.minimax.io/v1/text";
const MINIMAX_MODEL = "MiniMax-M3";

const SYSTEM_PROMPT = `Eres un nutricionista profesional. Analiza la foto de comida y devuelve EXCLUSIVAMENTE JSON valido con esta forma exacta:
{
  "plato": string corto (<=80 chars),
  "confidence": "alta" | "media" | "baja",
  "kcal_total": integer,
  "proteinas_total_g": number,
  "grasas_total_g": number,
  "hidratos_total_g": number,
  "items": [
    { "name": string, "grams": integer, "kcal": integer, "p": float, "f": float, "h": float }
  ]
}

REGLAS DE PRECISION (criticas):
1. Cantidades realistas: una tortilla espanola mediana son ~120g (no 250g). Una empanada frita son ~80g (no 270g para 3 unidades). Una paella individual son ~250-350g TOTAL (incluyendo arroz+marisco).
2. Densidades kcal/g plausibles: arroz cocido 1.3 kcal/g, pan 2.7, carne 2.0, marisco 0.85, aceite 9.0, queso 3.5, bacon 4.5. Si tu estimacion da kcal/g fuera de rango plausible, REVISALA.
3. Empanadas fritas: ~250 kcal/unidad, no 500+. Si ves 2-3 unidades, multiplica correctamente.
4. Sofrito y aceite: el aceite en una paella son 10-15g (no 30g). Cuentalo como item separado solo si es visualmente significativo.
5. Consistencia interna: kcal_total debe ser la SUMA de items[].kcal (tolerancia +/-5%). Lo mismo con macros.
6. Confianza calibrada:
   - "alta" = plato simple y/o evidente (1-2 items reconocibles, cantidades obvias)
   - "media" = plato con 3+ items, alguno estimado
   - "baja" = foto ambigua, plato no reconocible, o al menos un item dudoso
7. Si NO es comida (utensilios, mesa vacia, objeto no comestible), devuelve {"items":[], "kcal_total":0} (sera rechazado por schema).
8. NO anadas texto fuera del JSON.`;

export interface AnalyzeArgs {
  imageDataUrl: string;
  meal: string;
  mealContext?: string;
}

export function getApiKey(): string | null {
  const k = process.env.MINIMAX_API_KEY;
  if (!k || k.length < 10) return null;
  return k;
}

function extractJson(raw: string): unknown {
  // Strip code fences if present
  const fenced = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  const candidate = fenced ? fenced[1] : raw;
  // Try direct parse, else locate first {...} block
  try {
    return JSON.parse(candidate);
  } catch {
    const first = candidate.indexOf("{");
    const last = candidate.lastIndexOf("}");
    if (first >= 0 && last > first) {
      return JSON.parse(candidate.slice(first, last + 1));
    }
    throw new Error("model did not return valid JSON");
  }
}

export async function analyzeMeal(args: AnalyzeArgs): Promise<MealAnalysis> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new ApiError(
      503,
      "minimax_no_key",
      "MINIMAX_API_KEY not configured or invalid"
    );
  }

  const userText = args.mealContext
    ? `Momento del dia: ${args.mealContext}. Devuelve SOLO el JSON pedido.`
    : "Devuelve SOLO el JSON pedido.";

  const body = {
    model: MINIMAX_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: args.imageDataUrl } },
        ],
      },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  };

  const url = `${MINIMAX_BASE_URL.replace(/\/$/, "")}/chatcompletion_v2`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new ApiError(503, "minimax_network", `network error: ${msg}`);
  }

  if (res.status === 429) {
    throw new ApiError(503, "minimax_quota", "rate limited or quota exhausted");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status >= 500) {
      throw new ApiError(503, "minimax_upstream", `upstream ${res.status}: ${text.slice(0, 200)}`);
    }
    throw new ApiError(500, "minimax_error", `upstream ${res.status}: ${text.slice(0, 200)}`);
  }

  const payload = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new ApiError(422, "minimax_no_content", "model returned no content");
  }

  let parsed: unknown;
  try {
    parsed = extractJson(content);
  } catch {
    throw new ApiError(422, "minimax_bad_json", "model output was not valid JSON");
  }

  const validation = MealAnalysisSchema.safeParse(parsed);
  if (!validation.success) {
    throw new ApiError(
      422,
      "minimax_schema_mismatch",
      "model JSON did not match MealAnalysis schema",
      validation.error.flatten()
    );
  }
  return validation.data;
}

// Re-export BAML schema types so consumers can import from a single place
export type { MealAnalysis };
