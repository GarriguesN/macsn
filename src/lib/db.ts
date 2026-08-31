// lib/db.ts — IndexedDB cache (Dexie). CLIENTE-ONLY.
// El SQLite del backend vive en src/lib/server/db.ts — nunca importar aquí.

import Dexie, { type Table } from "dexie";
import type { Meal, MealType } from "@/types";

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

class MacsnDB extends Dexie {
  meals_cache!: Table<CachedDay, string>;
  pending_scans!: Table<PendingScan, number>;

  constructor() {
    super("macsn");
    this.version(1).stores({
      meals_cache: "date",
      pending_scans: "++id, createdAt, status",
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

/** Meals cacheados de una fecha, o null si no hay entrada. */
export async function getCachedMeals(date: string): Promise<Meal[] | null> {
  const db = getDb();
  if (!db) return null;
  const row = await db.meals_cache.get(date);
  return row ? row.meals : null;
}

/** Escribe/sobrescribe el cache de una fecha. */
export async function setCachedMeals(date: string, meals: Meal[]): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.meals_cache.put({ date, meals, updatedAt: Date.now() });
}

/** Encola un scan pendiente de sincronizar (offline-first, ticket #3). */
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

/** Scans pendientes (pending + failed) para el banner del Home. */
export async function pendingScanCount(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  return db.pending_scans.where("status").anyOf("pending", "failed").count();
}