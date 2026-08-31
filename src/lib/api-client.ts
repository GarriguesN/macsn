// lib/api-client.ts — cliente tipado contra el API del mismo host (rutas relativas)

import type {
  DailyTotalsRow,
  Meal,
  MealInput,
  MealPatch,
  MealType,
  ScanResult,
} from "@/types";

export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiClientError(0, "Sin conexión con el servidor");
  }
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // body no JSON: mantener mensaje genérico
    }
    throw new ApiClientError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  /** GET /api/meals?date=YYYY-MM-DD */
  getMeals: (date: string): Promise<Meal[]> =>
    request(`/api/meals?date=${encodeURIComponent(date)}`),

  /** GET /api/meals?from=&to= — rango para sparkline/historial */
  getMealRange: (from: string, to: string): Promise<Meal[]> =>
    request(`/api/meals?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),

  /** GET /api/meals/totals?date=YYYY-MM-DD */
  getTotals: (date: string): Promise<DailyTotalsRow> =>
    request(`/api/meals/totals?date=${encodeURIComponent(date)}`),

  /** POST /api/meals */
  createMeal: (meal: MealInput): Promise<Meal> =>
    request("/api/meals", { method: "POST", body: JSON.stringify(meal) }),

  /** PATCH /api/meals/:id */
  updateMeal: (id: number, patch: MealPatch): Promise<Meal> =>
    request(`/api/meals/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  /** DELETE /api/meals/:id -> 204 */
  deleteMeal: (id: number): Promise<void> =>
    request(`/api/meals/${id}`, { method: "DELETE" }),

  /** POST /api/scan — análisis de la foto (ticket #2) */
  scanImage: (
    image: string,
    meal: MealType,
    mealContext?: string
  ): Promise<ScanResult> =>
    request("/api/scan", {
      method: "POST",
      body: JSON.stringify({
        image,
        meal,
        ...(mealContext ? { meal_context: mealContext } : {}),
      }),
    }),
};