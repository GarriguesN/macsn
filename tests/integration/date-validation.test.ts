// tests/integration/date-validation.test.ts — Date param validation
//
// Verifies:
//   1) Zod DateString rejects out-of-range and impossible dates
//   2) Leap years are accepted (2024-02-29)
//   3) GET /api/meals rejects ?date= and ?from=/?to= when not a valid calendar date
//   4) POST /api/meals rejects body.date="2026-13-99" and "2025-02-30"
//
// The route handlers use initDb() (singleton) under the hood; we reset the DB
// before each test via resetDbForTest() to keep state isolated.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as mealsGET, POST as mealsPOST } from "../../src/app/api/meals/route";
import { GET as totalsGET } from "../../src/app/api/meals/totals/route";
import { resetDbForTest, initDb } from "../../src/lib/db";
import { DateString } from "../../src/lib/schemas";

function makeReq(url: string, body?: unknown): NextRequest {
  // NextRequest needs RequestInit with a body when we want to POST.
  if (body !== undefined) {
    return new NextRequest(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }
  return new NextRequest(url);
}

const validMeal = {
  date: "2026-08-30",
  meal: "lunch" as const,
  items: [{ name: "pollo", grams: 200, kcal: 330, p: 62, f: 7, h: 0 }],
};

describe("DateString Zod schema (calendar validation)", () => {
  it("accepts a valid calendar date", () => {
    expect(DateString.safeParse("2026-08-30").success).toBe(true);
  });

  it("rejects a malformed shape", () => {
    expect(DateString.safeParse("rubbish").success).toBe(false);
    expect(DateString.safeParse("2026/08/30").success).toBe(false);
    expect(DateString.safeParse("26-08-30").success).toBe(false);
  });

  it("rejects an out-of-range month/day (2026-13-99)", () => {
    const r = DateString.safeParse("2026-13-99");
    expect(r.success).toBe(false);
  });

  it("rejects Feb 30 (2025-02-30)", () => {
    const r = DateString.safeParse("2025-02-30");
    expect(r.success).toBe(false);
  });

  it("accepts Feb 29 on a leap year (2024-02-29)", () => {
    expect(DateString.safeParse("2024-02-29").success).toBe(true);
  });

  it("rejects Feb 29 on a non-leap year (2025-02-29)", () => {
    const r = DateString.safeParse("2025-02-29");
    expect(r.success).toBe(false);
  });

  it("rejects Apr 31 (only 30 days)", () => {
    const r = DateString.safeParse("2026-04-31");
    expect(r.success).toBe(false);
  });
});

describe("POST /api/meals rejects impossible dates in body", () => {
  beforeEach(() => resetDbForTest());
  afterEach(() => resetDbForTest());

  it("rejects date=2026-13-99 with 400", async () => {
    initDb(":memory:");
    const req = makeReq("http://localhost/api/meals", {
      ...validMeal,
      date: "2026-13-99",
    });
    const res = await mealsPOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("invalid_input");
  });

  it("rejects date=2025-02-30 with 400", async () => {
    initDb(":memory:");
    const req = makeReq("http://localhost/api/meals", {
      ...validMeal,
      date: "2025-02-30",
    });
    const res = await mealsPOST(req);
    expect(res.status).toBe(400);
  });

  it("accepts date=2024-02-29 as a valid leap-year date", async () => {
    initDb(":memory:");
    const req = makeReq("http://localhost/api/meals", {
      ...validMeal,
      date: "2024-02-29",
    });
    const res = await mealsPOST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.date).toBe("2024-02-29");
  });
});

describe("GET /api/meals validates date/from/to query params", () => {
  beforeEach(() => resetDbForTest());
  afterEach(() => resetDbForTest());

  it("rejects ?date=rubbish with 400 (no silent empty list)", async () => {
    initDb(":memory:");
    const res = await mealsGET(makeReq("http://localhost/api/meals?date=rubbish"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("invalid_date");
  });

  it("rejects ?from=bad with 400", async () => {
    initDb(":memory:");
    const res = await mealsGET(makeReq("http://localhost/api/meals?from=bad"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("invalid_from");
  });

  it("rejects ?to=2025-02-30 with 400 (impossible calendar date)", async () => {
    initDb(":memory:");
    const res = await mealsGET(makeReq("http://localhost/api/meals?to=2025-02-30"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("invalid_to");
  });

  it("accepts a valid ?date= range and returns an empty list (not 400)", async () => {
    initDb(":memory:");
    const res = await mealsGET(makeReq("http://localhost/api/meals?date=2026-08-30"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });
});

describe("GET /api/meals/totals also enforces calendar validity", () => {
  beforeEach(() => resetDbForTest());
  afterEach(() => resetDbForTest());

  it("rejects ?date=2026-13-99 with 400", async () => {
    initDb(":memory:");
    const res = await totalsGET(makeReq("http://localhost/api/meals/totals?date=2026-13-99"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("invalid_date");
  });

  it("accepts ?date=2024-02-29 (leap year)", async () => {
    initDb(":memory:");
    const res = await totalsGET(makeReq("http://localhost/api/meals/totals?date=2024-02-29"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.date).toBe("2024-02-29");
  });
});
