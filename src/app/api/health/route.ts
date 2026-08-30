// app/api/health/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    ts: Date.now(),
    version: "0.1.0",
  });
}
