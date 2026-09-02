// lib/db.ts — IndexedDB (Dexie) para Macsn. CLIENTE-ONLY.
// El SQLite del backend vive en src/lib/server/db.ts — nunca importar aquí.
//
// Modelo (a partir del fix 3ceb7c9):
// - El backend es la fuente de verdad. Dexie es cache offline + cola de ops pendientes.
// - meals_cache     : array de comidas cacheadas (todas, sin agrupar por día)
// - user_profile    : singleton ("singleton") — perfil cacheado del backend
// - daily_targets   : singleton ("singleton") — objetivos cacheados
// - pending_ops     : cola de mutaciones sin sincronizar (offline → online)
// - app_metadata    : singleton ("meta") — versión, flags

import Dexie, { type Table } from "dexie";
import type { Meal, MealPatch, MealType, FoodItem } from "@/types";
import type { DailyTargets, UserProfile } from "@/data/user";

export interface StoredMeal extends Omit<Meal, "id"> {
  id?: number;
  date: string;
  meal: MealType;
  created_at: number;
}

interface StoredProfile {
  id: "singleton";
  profile: UserProfile;
  updatedAt: number;
}

interface StoredTargets {
  id: "singleton";
  targets: DailyTargets;
  updatedAt: number;
}

/** Operaciones en cola para sincronizar cuando vuelva la red */
type PendingOpBase = { id?: number; createdAt: number };

export type PendingOp =
  | (PendingOpBase & { kind: "create_meal"; payload: { date: string; meal: MealType; items: FoodItem[]; photo_base64?: string | null; confidence?: "alta" | "media" | "baja" | null; notes?: string | null } })
  | (PendingOpBase & { kind: "update_meal"; targetId: number; payload: MealPatch })
  | (PendingOpBase & { kind: "delete_meal"; targetId: number })
  | (PendingOpBase & { kind: "update_profile"; payload: UserProfile })
  | (PendingOpBase & { kind: "update_targets"; payload: DailyTargets });

export interface AppMetadata {
  id: "meta";
  schemaVersion: number;
}

class MacsnDB extends Dexie {
  meals_cache!: Table<StoredMeal, number>;
  user_profile!: Table<StoredProfile, "singleton">;
  daily_targets!: Table<StoredTargets, "singleton">;
  pending_ops!: Table<PendingOp, number>;
  app_metadata!: Table<AppMetadata, "meta">;

  constructor() {
    super("macsn");
    // v4: meals_cache es array (no agrupado por fecha), cola de ops sin createdAt indexado.
    this.version(4).stores({
      meals_cache: "++id, date, meal",
      user_profile: "id",
      daily_targets: "id",
      pending_ops: "++id, kind",
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
// Meals — cache local del backend
// ============================================================================

/** Cachear todas las comidas (sobrescribe el cache anterior) */
export async function setCachedMeals(meals: StoredMeal[]): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.meals_cache.clear();
  if (meals.length > 0) {
    await db.meals_cache.bulkPut(meals);
  }
}

/** Añadir/actualizar una comida en el cache */
export async function upsertCachedMeal(meal: StoredMeal): Promise<void> {
  const db = getDb();
  if (!db) return;
  if (meal.id && meal.id > 0) {
    await db.meals_cache.put(meal);
  } else {
    await db.meals_cache.add(meal);
  }
}

/** Borrar una comida del cache por id */
export async function deleteCachedMeal(id: number): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.meals_cache.delete(id);
}

/** Obtener todas las comidas cacheadas (sin filtrar) */
export async function getAllCachedMeals(): Promise<StoredMeal[]> {
  const db = getDb();
  if (!db) return [];
  return db.meals_cache.toArray();
}

/** Comidas de una fecha concreta (útil para selectores) */
export async function getCachedMealsByDate(date: string): Promise<StoredMeal[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db.meals_cache.where("date").equals(date).toArray();
  return rows.sort((a, b) => a.created_at - b.created_at);
}

// ============================================================================
// Profile + Targets (cache local)
// ============================================================================

export async function getCachedProfile(): Promise<UserProfile | null> {
  const db = getDb();
  if (!db) return null;
  const row = await db.user_profile.get("singleton");
  return row ? row.profile : null;
}

export async function setCachedProfile(profile: UserProfile): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.user_profile.put({ id: "singleton", profile, updatedAt: Date.now() });
}

export async function getCachedTargets(): Promise<DailyTargets | null> {
  const db = getDb();
  if (!db) return null;
  const row = await db.daily_targets.get("singleton");
  return row ? row.targets : null;
}

export async function setCachedTargets(targets: DailyTargets): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.daily_targets.put({ id: "singleton", targets, updatedAt: Date.now() });
}

// ============================================================================
// Cola de operaciones pendientes (escrituras offline)
// ============================================================================

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** Encolar una operación para sincronizar al volver online */
export async function queueOp(op: DistributiveOmit<PendingOp, "createdAt" | "id">): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.pending_ops.add({ ...op, createdAt: Date.now() } as PendingOp);
}

/** Número de operaciones pendientes de sincronizar */
export async function getPendingOpCount(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  return db.pending_ops.count();
}

/**
 * Drenar la cola: ejecuta cada op contra los handlers del backend en orden.
 * Si una op falla, se aborta el drain (la op problemática queda al final).
 */
export async function drainQueue(handlers: {
  create: (input: Extract<PendingOp, { kind: "create_meal" }>["payload"]) => Promise<unknown>;
  update: (id: number, patch: MealPatch) => Promise<unknown>;
  delete: (id: number) => Promise<unknown>;
  updateProfile: (profile: UserProfile) => Promise<unknown>;
  updateTargets: (targets: DailyTargets) => Promise<unknown>;
}): Promise<void> {
  const db = getDb();
  if (!db) return;
  while (true) {
    const next = await db.pending_ops.toCollection().first();
    if (!next || next.id === undefined) return;
    try {
      if (next.kind === "create_meal") {
        await handlers.create(next.payload);
      } else if (next.kind === "update_meal") {
        await handlers.update(next.targetId, next.payload);
      } else if (next.kind === "delete_meal") {
        await handlers.delete(next.targetId);
      } else if (next.kind === "update_profile") {
        await handlers.updateProfile(next.payload);
      } else if (next.kind === "update_targets") {
        await handlers.updateTargets(next.payload);
      }
      await db.pending_ops.delete(next.id);
    } catch {
      // El backend sigue caído o falló esta op. Paramos aquí;
      // al volver online se reintentará.
      return;
    }
  }
}

// ============================================================================
// Reset total
// ============================================================================

export async function wipeAll(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await Promise.all([
    db.meals_cache.clear(),
    db.user_profile.clear(),
    db.daily_targets.clear(),
    db.pending_ops.clear(),
    db.app_metadata.clear(),
  ]);
}