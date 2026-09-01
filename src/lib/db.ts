// lib/db.ts — IndexedDB (Dexie) para Macsn. CLIENTE-ONLY.
// El SQLite del backend vive en src/lib/server/db.ts — nunca importar aquí.
//
// Tablas:
// - meals_cache     : snapshot por día del servidor (offline fallback)
// - pending_scans   : scans en cola sin sincronizar
// - user_profile    : singleton ("singleton") — datos del onboarding
// - daily_targets   : singleton ("singleton") — kcal + macros
// - meals_persisted : comidas reales (++id, date, meal, createdAt) — fuente de verdad local
// - app_metadata    : singleton ("meta") — flag de seed, versión, etc.

import Dexie, { type Table } from "dexie";
import type { Meal, MealType } from "@/types";
import type { DailyTargets, UserProfile } from "@/data/user";

export interface CachedDay {
  date: string;
  meals: Meal[];
  updatedAt: number;
}

export interface PendingScan {
  id?: number;
  image: string;
  meal: MealType;
  createdAt: number;
  status: "pending" | "syncing" | "failed";
}

export interface StoredProfile {
  id: "singleton";
  profile: UserProfile;
  updatedAt: number;
}

export interface StoredTargets {
  id: "singleton";
  targets: DailyTargets;
  updatedAt: number;
}

export interface StoredMeal extends Omit<Meal, "id"> {
  /** id puede ser undefined en memoria antes de persistir */
  id?: number;
  /** fecha local YYYY-MM-DD (denormalizado para queries/range) */
  date: string;
  /** meal type duplicado a primer nivel para indexar */
  meal: MealType;
  /** epoch ms (alias de Meal.created_at) */
  created_at: number;
}

export interface AppMetadata {
  id: "meta";
  seeded: boolean;
  schemaVersion: number;
}

class MacsnDB extends Dexie {
  meals_cache!: Table<CachedDay, string>;
  pending_scans!: Table<PendingScan, number>;
  user_profile!: Table<StoredProfile, "singleton">;
  daily_targets!: Table<StoredTargets, "singleton">;
  meals_persisted!: Table<StoredMeal, number>;
  app_metadata!: Table<AppMetadata, "meta">;

  constructor() {
    super("macsn");
    // v1: solo cache y pending scans (estado original del MVP)
    this.version(1).stores({
      meals_cache: "date",
      pending_scans: "++id, createdAt, status",
    });
    // v2: añadimos persistencia local real (perfil, targets, meals, meta)
    this.version(2).stores({
      meals_cache: "date",
      pending_scans: "++id, createdAt, status",
      user_profile: "id",
      daily_targets: "id",
      meals_persisted: "++id, date, meal, createdAt",
      app_metadata: "id",
    });
  }
}

let _db: MacsnDB | null = null;

/** Singleton a prueba de SSR: sin indexedDB (servidor) -> null, todo no-op. */
function getDb(): MacsnDB | null {
  if (typeof indexedDB === "undefined") return null;
  if (!_db) _db = new MacsnDB();
  return _db;
}

/** Reset para tests: cierra y descarta la instancia. */
export function resetDbForTest(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

// ============================================================================
// Cache de servidor (existente — sin cambios)
// ============================================================================

export async function getCachedMeals(date: string): Promise<Meal[] | null> {
  const db = getDb();
  if (!db) return null;
  const row = await db.meals_cache.get(date);
  return row ? row.meals : null;
}

export async function setCachedMeals(date: string, meals: Meal[]): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.meals_cache.put({ date, meals, updatedAt: Date.now() });
}

export async function enqueueScan(
  image: string,
  meal: MealType
): Promise<number> {
  const db = getDb();
  if (!db) return -1;
  return db.pending_scans.add({
    image,
    meal,
    createdAt: Date.now(),
    status: "pending",
  });
}

export async function pendingScanCount(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  return db.pending_scans.where("status").anyOf("pending", "failed").count();
}

// ============================================================================
// Perfil de usuario (singleton)
// ============================================================================

export async function getStoredProfile(): Promise<UserProfile | null> {
  const db = getDb();
  if (!db) return null;
  const row = await db.user_profile.get("singleton");
  return row ? row.profile : null;
}

export async function setStoredProfile(profile: UserProfile): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.user_profile.put({
    id: "singleton",
    profile,
    updatedAt: Date.now(),
  });
}

// ============================================================================
// Objetivos diarios (singleton)
// ============================================================================

export async function getStoredTargets(): Promise<DailyTargets | null> {
  const db = getDb();
  if (!db) return null;
  const row = await db.daily_targets.get("singleton");
  return row ? row.targets : null;
}

export async function setStoredTargets(targets: DailyTargets): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.daily_targets.put({
    id: "singleton",
    targets,
    updatedAt: Date.now(),
  });
}

// ============================================================================
// Comidas persistidas (fuente de verdad local)
// ============================================================================

/** Insertar una comida nueva. Devuelve el id asignado. */
export async function insertMeal(meal: StoredMeal): Promise<number> {
  const db = getDb();
  if (!db) return -1;
  return db.meals_persisted.add(meal);
}

export async function getMeal(id: number): Promise<StoredMeal | null> {
  const db = getDb();
  if (!db) return null;
  const row = await db.meals_persisted.get(id);
  return row ?? null;
}

/** Todas las comidas de un día (ordenadas por createdAt asc). */
export async function getMealsByDate(date: string): Promise<StoredMeal[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db.meals_persisted
    .where("date")
    .equals(date)
    .toArray();
  return rows.sort((a, b) => a.created_at - b.created_at);
}

/** Todas las comidas en un rango [from, to] inclusivo. */
export async function getMealsByRange(
  from: string,
  to: string
): Promise<StoredMeal[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db.meals_persisted
    .where("date")
    .between(from, to, true, true)
    .toArray();
  return rows.sort((a, b) => a.created_at - b.created_at);
}

/** Todas las comidas (para cálculo de stats). ¡Cuidado: carga todo! */
export async function getAllMeals(): Promise<StoredMeal[]> {
  const db = getDb();
  if (!db) return [];
  return db.meals_persisted.orderBy("created_at").toArray();
}

export async function updateStoredMeal(
  id: number,
  patch: Partial<StoredMeal>
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.meals_persisted.update(id, patch);
}

export async function deleteStoredMeal(id: number): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.meals_persisted.delete(id);
}

// ============================================================================
// Metadata (seed flag, etc.)
// ============================================================================

export async function getMetadata(): Promise<AppMetadata | null> {
  const db = getDb();
  if (!db) return null;
  return (await db.app_metadata.get("meta")) ?? null;
}

export async function setMetadata(meta: AppMetadata): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.app_metadata.put(meta);
}

// ============================================================================
// Reset total (para "Restablecer onboarding")
// ============================================================================

export async function wipeAll(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await Promise.all([
    db.user_profile.clear(),
    db.daily_targets.clear(),
    db.meals_persisted.clear(),
    db.app_metadata.clear(),
    db.meals_cache.clear(),
    db.pending_scans.clear(),
  ]);
}