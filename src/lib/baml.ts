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
    { "name": string, "grams": number, "kcal": integer, "p": number, "f": number, "h": number }
  ]
}
Reglas:
- Si ves comida empaquetada con etiqueta visible, lee los macros de la etiqueta.
- Estima cantidades razonables; si dudas, marca confidence='baja'.
- Suma de items debe coincidir aproximadamente con kcal_total / macros_total.
- No anadas texto fuera del JSON.`;

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
