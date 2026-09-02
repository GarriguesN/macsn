// tests/integration/profile-targets.test.ts — tests de los endpoints /api/profile y /api/targets
import { describe, it, expect } from "vitest";
import { ApiError, errorResponse } from "@/lib/errors";

describe("api/profile + api/targets — handlers (unit-level shape)", () => {
  it("errorResponse mapea ApiError a {status, body} con shape correcto", () => {
    const err = new ApiError(400, "invalid_input", "bad");
    const r = errorResponse(err);
    expect(r.status).toBe(400);
    expect(r.body).toEqual({ error: "bad", code: "invalid_input" });
  });

  it("errorResponse con details los preserva", () => {
    const err = new ApiError(422, "complex", "x", { foo: 1 });
    const r = errorResponse(err);
    expect(r.body).toEqual({ error: "x", code: "complex", details: { foo: 1 } });
  });

  it("errorResponse con error genérico → 500", () => {
    const r = errorResponse(new Error("boom"));
    expect(r.status).toBe(500);
    expect(r.body).toMatchObject({ code: "internal_error", error: "boom" });
  });

  it("errorResponse con unknown → 500 mensaje fallback", () => {
    const r = errorResponse("string error");
    expect(r.status).toBe(500);
    expect(r.body).toMatchObject({ code: "internal_error" });
  });
});
