// app/api/profile/route.ts — GET / PUT singleton del perfil del usuario.
// Sin auth: 1 dispositivo = 1 perfil (id = 'singleton').
import { NextRequest, NextResponse } from "next/server";
import { initDb } from "@/lib/server/db";
import { ApiError, errorResponse } from "@/lib/errors";

const ALLOWED_FIELDS = [
  "name",
  "goal",
  "sex",
  "birthday",
  "height",
  "weight",
  "activity",
  "language",
  "theme",
  "units",
  "reminders",
] as const;

const GOALS = ["lose_fast", "lose", "maintain", "gain", "recomp"];
const SEXES = ["male", "female"];
const ACTIVITIES = ["sedentary", "light", "moderate", "active", "very_active"];
const LANGUAGES = ["es", "en", "ca", "fr"];
const THEMES = ["system", "light", "dark"];
const UNITS = ["metric", "imperial"];

const DEFAULT_PROFILE = {
  name: "Alex",
  goal: "maintain",
  sex: "male",
  birthday: "1995-01-01",
  height: 175,
  weight: 70,
  activity: "moderate",
  language: "es",
  theme: "system",
  units: "metric",
  reminders: true,
};

function validateProfile(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object") {
    throw new ApiError(400, "invalid_input", "Profile must be an object");
  }
  const p = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const f of ALLOWED_FIELDS) {
    if (!(f in p)) {
      throw new ApiError(400, "invalid_input", `Missing field: ${f}`);
    }
    out[f] = p[f];
  }
  if (typeof out.name !== "string" || out.name.length === 0 || out.name.length > 80) {
    throw new ApiError(400, "invalid_input", "name must be 1..80 chars");
  }
  if (!GOALS.includes(out.goal as string)) {
    throw new ApiError(400, "invalid_input", `goal must be one of ${GOALS.join(", ")}`);
  }
  if (!SEXES.includes(out.sex as string)) {
    throw new ApiError(400, "invalid_input", `sex must be one of ${SEXES.join(", ")}`);
  }
  if (typeof out.birthday !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(out.birthday)) {
    throw new ApiError(400, "invalid_input", "birthday must be YYYY-MM-DD");
  }
  if (typeof out.height !== "number" || out.height < 100 || out.height > 250) {
    throw new ApiError(400, "invalid_input", "height must be 100..250");
  }
  if (typeof out.weight !== "number" || out.weight < 30 || out.weight > 300) {
    throw new ApiError(400, "invalid_input", "weight must be 30..300");
  }
  if (!ACTIVITIES.includes(out.activity as string)) {
    throw new ApiError(400, "invalid_input", `activity must be one of ${ACTIVITIES.join(", ")}`);
  }
  if (!LANGUAGES.includes(out.language as string)) {
    throw new ApiError(400, "invalid_input", `language must be one of ${LANGUAGES.join(", ")}`);
  }
  if (!THEMES.includes(out.theme as string)) {
    throw new ApiError(400, "invalid_input", `theme must be one of ${THEMES.join(", ")}`);
  }
  if (!UNITS.includes(out.units as string)) {
    throw new ApiError(400, "invalid_input", `units must be one of ${UNITS.join(", ")}`);
  }
  if (typeof out.reminders !== "boolean") {
    throw new ApiError(400, "invalid_input", "reminders must be boolean");
  }
  return out;
}

export async function GET(): Promise<NextResponse> {
  const db = initDb();
  const row = db.prepare("SELECT * FROM profile WHERE id = 'singleton'").get() as Record<string, unknown> | undefined;
  if (!row) {
    // Devolver defaults sin persistir
    return NextResponse.json(DEFAULT_PROFILE);
  }
  return NextResponse.json({
    name: row.name,
    goal: row.goal,
    sex: row.sex,
    birthday: row.birthday,
    height: row.height,
    weight: row.weight,
    activity: row.activity,
    language: row.language,
    theme: row.theme,
    units: row.units,
    reminders: Boolean(row.reminders),
  });
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const p = validateProfile(body);
    const db = initDb();
    const now = Date.now();
    db.prepare(
      `INSERT INTO profile (id, name, goal, sex, birthday, height, weight, activity, language, theme, units, reminders, updated_at)
       VALUES ('singleton', @name, @goal, @sex, @birthday, @height, @weight, @activity, @language, @theme, @units, @reminders, @updated_at)
       ON CONFLICT(id) DO UPDATE SET
         name=excluded.name, goal=excluded.goal, sex=excluded.sex, birthday=excluded.birthday,
         height=excluded.height, weight=excluded.weight, activity=excluded.activity,
         language=excluded.language, theme=excluded.theme, units=excluded.units,
         reminders=excluded.reminders, updated_at=excluded.updated_at`
    ).run({
      name: p.name,
      goal: p.goal,
      sex: p.sex,
      birthday: p.birthday,
      height: p.height,
      weight: p.weight,
      activity: p.activity,
      language: p.language,
      theme: p.theme,
      units: p.units,
      reminders: p.reminders ? 1 : 0,
      updated_at: now,
    });
    return NextResponse.json(p);
  } catch (e) {
    const { status, body } = errorResponse(e);
    return NextResponse.json(body, { status });
  }
}
