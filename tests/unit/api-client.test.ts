// tests/unit/api-client.test.ts — contratos del cliente API contra fetch mockeado

import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiClientError } from "../../src/lib/api-client";
import type { Meal, MealInput, MealPatch } from "../../src/types";

function mockFetchOnce(status: number, body: unknown) {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}

const fakeMeal: Meal = {
  id: 1,
  date: "2026-08-31",
  meal: "lunch",
  kcal: 330,
  p: 62,
  f: 7,
  h: 0,
  photo_base64: null,
  confidence: "alta",
  notes: null,
  created_at: 1756732800000,
  items: [
    { id: 1, meal_id: 1, name: "pollo", grams: 200, kcal: 330, p: 62, f: 7, h: 0, ord: 0 },
  ],
};

const fakeTotals = {
  date: "2026-08-31",
  kcal: 330,
  p: 62,
  f: 7,
  h: 0,
  kcal_goal: 2200,
  p_ratio_goal: 30,
  f_ratio_goal: 30,
  h_ratio_goal: 40,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getMeals", () => {
  it("llama a /api/meals?date= con la fecha codificada", async () => {
    const fetchMock = mockFetchOnce(200, [fakeMeal]);
    vi.stubGlobal("fetch", fetchMock);
    const result = await api.getMeals("2026-08-31");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/meals?date=2026-08-31",
      expect.objectContaining({ headers: expect.objectContaining({ "Content-Type": "application/json" }) })
    );
    expect(result).toEqual([fakeMeal]);
  });
});

describe("getTotals", () => {
  it("llama a /api/meals/totals?date= y devuelve DailyTotalsRow", async () => {
    const fetchMock = mockFetchOnce(200, fakeTotals);
    vi.stubGlobal("fetch", fetchMock);
    const result = await api.getTotals("2026-08-31");
    expect(fetchMock).toHaveBeenCalledWith("/api/meals/totals?date=2026-08-31", expect.anything());
    expect(result.kcal_goal).toBe(2200);
    expect(result.p_ratio_goal).toBe(30);
  });
});

describe("createMeal", () => {
  it("hace POST con el body JSON del MealInput", async () => {
    const fetchMock = mockFetchOnce(201, fakeMeal);
    vi.stubGlobal("fetch", fetchMock);
    const input: MealInput = {
      date: "2026-08-31",
      meal: "lunch",
      items: [{ name: "pollo", grams: 200, kcal: 330, p: 62, f: 7, h: 0 }],
      confidence: "alta",
    };
    const result = await api.createMeal(input);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/meals",
      expect.objectContaining({ method: "POST" })
    );
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual(input);
    expect(result.id).toBe(1);
  });
});

describe("updateMeal", () => {
  it("hace PATCH a /api/meals/:id", async () => {
    const fetchMock = mockFetchOnce(200, fakeMeal);
    vi.stubGlobal("fetch", fetchMock);
    const patch: MealPatch = { notes: "patched" };
    await api.updateMeal(1, patch);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/meals/1",
      expect.objectContaining({ method: "PATCH" })
    );
  });
});

describe("deleteMeal", () => {
  it("hace DELETE y resuelve undefined en 204", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(api.deleteMeal(7)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/meals/7",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("errores", () => {
  it("lanza ApiClientError con status y mensaje del body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "invalid_input" }), { status: 400 })
      )
    );
    await expect(api.getMeals("2026-08-31")).rejects.toMatchObject({
      name: "ApiClientError",
      status: 400,
      message: "invalid_input",
    });
    expect(ApiClientError).toBeDefined();
  });

  it("lanza ApiClientError status 0 en fallo de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(api.getTotals("2026-08-31")).rejects.toMatchObject({
      status: 0,
    });
  });
});