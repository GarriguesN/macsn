// lib/seed.ts — primera instalación: pre-carga perfil + targets + comidas demo
//
// Estrategia: solo sembramos si IndexedDB está vacío. El objetivo es que la
// primera visita muestre algo útil (no pantallas vacías) sin depender de
// backend. Cuando el usuario pase por el onboarding / escanee, los datos se
// sobreescriben naturalmente.

import {
  DEFAULT_PROFILE,
  DEFAULT_TARGETS,
} from "@/data/user";
import {
  type StoredMeal,
  getMetadata,
  setMetadata,
  insertMeal,
  setStoredProfile,
  setStoredTargets,
} from "@/lib/db";
import { addDaysISO, todayISO } from "@/lib/date";
import { MOCK_SCAN_RESULT } from "@/lib/scan-mock";

const SCHEMA_VERSION = 2;

/**
 * Idempotente: si ya hay datos, sale en seco. Si no, siembra.
 * Devuelve true si sembró, false si ya había datos.
 */
export async function seedIfEmpty(): Promise<boolean> {
  const meta = await getMetadata();
  if (meta?.seeded) return false;

  // 1) Perfil y targets por defecto
  await setStoredProfile(DEFAULT_PROFILE);
  await setStoredTargets(DEFAULT_TARGETS);

  // 2) Comidas demo para HOY (3) + AYER (3) + 3 días atrás (2)
  const today = todayISO();
  const yesterday = addDaysISO(today, -1);
  const threeDaysAgo = addDaysISO(today, -3);
  const fourDaysAgo = addDaysISO(today, -4);
  const fiveDaysAgo = addDaysISO(today, -5);

  const seeds: { date: string; meal: StoredMeal }[] = [
    // HOY: 3 comidas
    ...[
      buildMeal(today, "breakfast", 8 * 60 + 15, [
        { name: "Tostada de aguacate con huevo", kcal: 420, p: 22, f: 24, h: 32, img: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=400&fit=crop" },
      ]),
      buildMeal(today, "lunch", 13 * 60 + 40, [
        { name: "Pollo a la plancha con arroz y verduras", kcal: 620, p: 45, f: 18, h: 68, img: "https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=400&h=400&fit=crop" },
      ]),
      buildMeal(today, "snack", 17 * 60 + 10, [
        { name: "Yogur griego con nueces", kcal: 240, p: 18, f: 12, h: 14, img: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop" },
      ]),
    ],
    // AYER: 3 comidas
    ...[
      buildMeal(yesterday, "breakfast", 8 * 60 + 30, [
        { name: "Avena con plátano", kcal: 380, p: 14, f: 8, h: 62, img: "https://images.unsplash.com/photo-1614961233913-a5113a4a34ed?w=400&h=400&fit=crop" },
      ]),
      buildMeal(yesterday, "lunch", 14 * 60 + 5, [
        { name: "Bowl de quinoa con salmón", kcal: 680, p: 42, f: 28, h: 58, img: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop" },
      ]),
      buildMeal(yesterday, "dinner", 20 * 60 + 15, [
        { name: "Ensalada de atún", kcal: 320, p: 30, f: 14, h: 18, img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop" },
      ]),
    ],
    // 3 días atrás: 2 comidas (gap realista)
    ...[
      buildMeal(threeDaysAgo, "lunch", 13 * 60 + 20, [
        { name: "Hamburguesa completa", kcal: 720, p: 38, f: 38, h: 52, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop" },
      ]),
      buildMeal(threeDaysAgo, "dinner", 21 * 60, [
        { name: "Crema de calabaza", kcal: 180, p: 4, f: 8, h: 22, img: "https://images.unsplash.com/photo-1547308283-b94b3c5b25d6?w=400&h=400&fit=crop" },
      ]),
    ],
    // 4 y 5 días atrás: 1 comida cada uno (más realista)
    buildMeal(fourDaysAgo, "lunch", 14 * 60, [
      { name: "Pasta carbonara", kcal: 780, p: 32, f: 36, h: 78, img: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=400&fit=crop" },
    ]),
    buildMeal(fiveDaysAgo, "dinner", 20 * 60 + 30, [
      { name: "Pizza margherita", kcal: 850, p: 36, f: 32, h: 92, img: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400&h=400&fit=crop" },
    ]),
  ];

  // Insertar en serie para preservar createdAt monotónico
  for (const s of seeds) {
    await insertMeal(s.meal);
  }

  await setMetadata({ id: "meta", seeded: true, schemaVersion: SCHEMA_VERSION });
  return true;
}

// ============================================================================
// Helpers
// ============================================================================

interface MockItem {
  name: string;
  kcal: number;
  p: number;
  f: number;
  h: number;
  img?: string;
}

function buildMeal(
  date: string,
  meal: StoredMeal["meal"],
  minutesFromMidnight: number,
  items: MockItem[]
): { date: string; meal: StoredMeal } {
  // createdAt: usamos "ahora" - days_offset_ms para que se ordenen bien
  const todayMs = Date.now();
  const todayDate = new Date();
  const [yy, mm, dd] = date.split("-").map(Number);
  const offsetDays = Math.round(
    (Date.UTC(yy!, mm! - 1, dd!) -
      Date.UTC(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate())) /
      (1000 * 60 * 60 * 24)
  );
  const createdAt =
    todayMs + offsetDays * 24 * 60 * 60 * 1000 + minutesFromMidnight * 60 * 1000;

  const fullItems = items.map((it, i) => ({
    id: i + 1,
    meal_id: 0,
    name: it.name,
    grams: Math.round((it.kcal / 1.5) | 0), // aprox
    kcal: it.kcal,
    p: it.p,
    f: it.f,
    h: it.h,
    ord: i,
  }));

  const sumKcal = items.reduce((s, i) => s + i.kcal, 0);
  const sumP = items.reduce((s, i) => s + i.p, 0);
  const sumF = items.reduce((s, i) => s + i.f, 0);
  const sumH = items.reduce((s, i) => s + i.h, 0);

  const stored: StoredMeal = {
    id: undefined,
    date,
    meal,
    items: fullItems,
    kcal: sumKcal,
    p: sumP,
    f: sumF,
    h: sumH,
    photo_base64: items[0]?.img ?? null,
    confidence: "alta",
    notes: null,
    created_at: createdAt,
  };

  return { date, meal: stored };
}

/** Helper para convertir un ScanResult mockeado en un StoredMeal listo para insertar */
export function buildMealFromScan(
  date: string,
  mealType: StoredMeal["meal"],
  scan: typeof MOCK_SCAN_RESULT
): StoredMeal {
  const items = scan.items.map((it, i) => ({
    id: i + 1,
    meal_id: 0,
    name: it.name,
    grams: it.grams,
    kcal: it.kcal,
    p: it.p,
    f: it.f,
    h: it.h,
    ord: i,
  }));
  return {
    id: undefined,
    date,
    meal: mealType,
    items,
    kcal: scan.kcal_total,
    p: scan.proteinas_total_g,
    f: scan.grasas_total_g,
    h: scan.hidratos_total_g,
    photo_base64: null,
    confidence: scan.confidence,
    notes: null,
    created_at: Date.now(),
  };
}