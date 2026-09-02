// lib/store.tsx — fuente única de verdad de la app.
//
// ARQUITECTURA (a partir de Ticket #2 / fix 3ceb7c9):
// - El backend SQLite (/api/*) es la fuente de verdad para meals, profile, targets.
// - Dexie es un cache offline para que la app abra instantáneamente sin red.
// - Patrón read-through: la UI lee del cache, en paralelo el store hace fetch del
//   backend; cuando llega, refresca cache y estado.
// - Patrón write-through: una mutación (add/update/delete) va al backend;
//   si OK, refresca cache + estado. Si falla (sin red), encola en Dexie y
//   reintenta al volver online. El seed.ts desaparece: la primera vez que
//   abras la app estará vacía hasta que tú hagas algo.

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Meal, MealPatch, MealType, FoodItem } from "@/types";
import { type DailyTargets, DEFAULT_PROFILE, DEFAULT_TARGETS, type UserProfile } from "@/data/user";
import { api, ApiClientError } from "@/lib/api-client";
import {
  type StoredMeal,
  deleteCachedMeal,
  getAllCachedMeals,
  getCachedProfile,
  getCachedTargets,
  setCachedProfile,
  setCachedTargets,
  setCachedMeals,
  upsertCachedMeal,
  queueOp,
  drainQueue,
  getPendingOpCount,
} from "@/lib/db";

export type { StoredMeal } from "@/lib/db";

type AddMealInput = {
  date: string;
  meal: MealType;
  items: FoodItem[];
  photo_base64?: string | null;
  confidence?: "alta" | "media" | "baja" | null;
  notes?: string | null;
};

interface AppState {
  /** ¿hemos hecho al menos una hidratación? */
  hydrated: boolean;
  /** online = el último fetch al backend funcionó */
  online: boolean;
  /** número de operaciones en cola (sin sincronizar) */
  pendingOps: number;
  profile: UserProfile;
  targets: DailyTargets;
  meals: StoredMeal[];
}

interface AppActions {
  refresh: () => Promise<void>;
  reset: () => Promise<void>;

  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  updateTargets: (patch: Partial<DailyTargets>) => Promise<void>;

  addMeal: (input: AddMealInput) => Promise<number | null>;
  updateMeal: (id: number, patch: MealPatch) => Promise<void>;
  deleteMeal: (id: number) => Promise<void>;
}

type AppContextValue = AppState & AppActions;

const AppContext = createContext<AppContextValue | null>(null);

/** Convierte la fila del backend (Meal con items) al shape StoredMeal local. */
function mealToStored(m: Meal): StoredMeal {
  return {
    id: m.id,
    date: m.date,
    meal: m.meal,
    kcal: m.kcal,
    p: m.p,
    f: m.f,
    h: m.h,
    photo_base64: m.photo_base64 ?? null,
    confidence: m.confidence ?? null,
    notes: m.notes ?? null,
    created_at: m.created_at,
    items: m.items.map((it, i) => ({
      id: it.id,
      meal_id: it.meal_id,
      name: it.name,
      grams: it.grams,
      kcal: it.kcal,
      p: it.p,
      f: it.f,
      h: it.h,
      ord: it.ord ?? i,
    })),
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [online, setOnline] = useState(true);
  const [pendingOps, setPendingOps] = useState(0);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [targets, setTargets] = useState<DailyTargets>(DEFAULT_TARGETS);
  const [meals, setMeals] = useState<StoredMeal[]>([]);

  // ------------------------------------------------------------------------
  // Hidratación: cache primero (instantáneo offline) + refresh del backend.
  // ------------------------------------------------------------------------
  const refresh = useCallback(async () => {
    // 1) Pintar desde cache local inmediatamente
    const [cachedP, cachedT, cachedMeals, pending] = await Promise.all([
      getCachedProfile(),
      getCachedTargets(),
      getAllCachedMeals(),
      getPendingOpCount(),
    ]);
    if (cachedP) setProfile(cachedP);
    if (cachedT) setTargets(cachedT);
    if (cachedMeals.length > 0) setMeals(cachedMeals);
    setPendingOps(pending);

    // 2) Traer del backend
    try {
      const [serverP, serverT] = await Promise.all([api.getProfile(), api.getTargets()]);
      setProfile(serverP);
      setTargets(serverT);
      await setCachedProfile(serverP);
      await setCachedTargets(serverT);

      // Hidratamos solo el día actual + últimos 30 días para arrancar rápido
      const today = new Date();
      const from = new Date(today);
      from.setDate(today.getDate() - 30);
      const fromISO = from.toISOString().slice(0, 10);
      const toISO = today.toISOString().slice(0, 10);
      const range = await api.getMealRange(fromISO, toISO);
      const stored = range.map(mealToStored);
      setMeals(stored);
      await setCachedMeals(stored);
      setOnline(true);

      // 3) Drenar cola de operaciones pendientes (escrituras offline)
      await drainQueue({
        create: async (input) => api.createMeal(input),
        update: async (id, patch) => api.updateMeal(id, patch),
        delete: async (id) => api.deleteMeal(id),
        updateProfile: async (p) => api.updateProfile(p),
        updateTargets: async (t) => api.updateTargets(t),
      });
      const remaining = await getPendingOpCount();
      setPendingOps(remaining);
    } catch (e) {
      // Sin red o backend caído: nos quedamos con cache
      setOnline(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await refresh();
      } finally {
        if (mounted) setHydrated(true);
      }
    })();
    const onOnline = () => {
      refresh();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("online", onOnline);
    }
    return () => {
      mounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("online", onOnline);
      }
    };
  }, [refresh]);

  // ------------------------------------------------------------------------
  // Acciones: write-through al backend, fallback a cola offline
  // ------------------------------------------------------------------------
  const updateProfile = useCallback(
    async (patch: Partial<UserProfile>) => {
      const next = { ...profile, ...patch };
      setProfile(next); // optimistic
      try {
        const saved = await api.updateProfile(next);
        setProfile(saved);
        await setCachedProfile(saved);
      } catch {
        await setCachedProfile(next);
        await queueOp({ kind: "update_profile", payload: next });
        setPendingOps(await getPendingOpCount());
      }
    },
    [profile]
  );

  const updateTargets = useCallback(
    async (patch: Partial<DailyTargets>) => {
      const next = { ...targets, ...patch };
      setTargets(next); // optimistic
      try {
        const saved = await api.updateTargets(next);
        setTargets(saved);
        await setCachedTargets(saved);
      } catch {
        await setCachedTargets(next);
        await queueOp({ kind: "update_targets", payload: next });
        setPendingOps(await getPendingOpCount());
      }
    },
    [targets]
  );

  const addMeal = useCallback(
    async (input: AddMealInput): Promise<number | null> => {
      // Optimistic: crear un id temporal negativo para reflejarlo en la UI
      const tempId = -Date.now();
      const storedTemp: StoredMeal = {
        id: tempId,
        date: input.date,
        meal: input.meal,
        kcal: input.items.reduce((s, i) => s + i.kcal, 0),
        p: input.items.reduce((s, i) => s + i.p, 0),
        f: input.items.reduce((s, i) => s + i.f, 0),
        h: input.items.reduce((s, i) => s + i.h, 0),
        photo_base64: input.photo_base64 ?? null,
        confidence: input.confidence ?? null,
        notes: input.notes ?? null,
        created_at: Date.now(),
        items: input.items.map((it, i) => ({
          id: 0,
          meal_id: tempId,
          name: it.name,
          grams: it.grams,
          kcal: it.kcal,
          p: it.p,
          f: it.f,
          h: it.h,
          ord: i,
        })),
      };
      setMeals((prev) => [...prev, storedTemp]);
      await upsertCachedMeal(storedTemp);

      try {
        const serverMeal = await api.createMeal({
          date: input.date,
          meal: input.meal,
          items: input.items,
          photo_base64: input.photo_base64 ?? null,
          confidence: input.confidence ?? null,
          notes: input.notes ?? null,
        });
        const realStored = mealToStored(serverMeal);
        // Reemplazar tempId por el real
        setMeals((prev) => prev.map((m) => (m.id === tempId ? realStored : m)));
        await upsertCachedMeal(realStored);
        return realStored.id ?? null;
      } catch {
        await queueOp({ kind: "create_meal", payload: input });
        setPendingOps(await getPendingOpCount());
        return null;
      }
    },
    []
  );

  const updateMeal = useCallback(
    async (id: number, patch: MealPatch) => {
      // Optimistic
      setMeals((prev) =>
        prev.map((m) => {
          if (m.id !== id) return m;
          const next = { ...m };
          if (patch.date) next.date = patch.date;
          if (patch.meal) next.meal = patch.meal;
          if (patch.photo_base64 !== undefined) next.photo_base64 = patch.photo_base64;
          if (patch.confidence !== undefined) next.confidence = patch.confidence;
          if (patch.notes !== undefined) next.notes = patch.notes;
          if (patch.items) {
            next.items = patch.items.map((it, i) => ({
              id: 0,
              meal_id: id,
              name: it.name,
              grams: it.grams,
              kcal: it.kcal,
              p: it.p,
              f: it.f,
              h: it.h,
              ord: i,
            }));
            next.kcal = patch.items.reduce((s, i) => s + i.kcal, 0);
            next.p = patch.items.reduce((s, i) => s + i.p, 0);
            next.f = patch.items.reduce((s, i) => s + i.f, 0);
            next.h = patch.items.reduce((s, i) => s + i.h, 0);
          }
          return next;
        })
      );
      try {
        const serverMeal = await api.updateMeal(id, patch);
        const stored = mealToStored(serverMeal);
        await upsertCachedMeal(stored);
        setMeals((prev) => prev.map((m) => (m.id === id ? stored : m)));
      } catch {
        await queueOp({ kind: "update_meal", targetId: id, payload: patch });
        setPendingOps(await getPendingOpCount());
      }
    },
    []
  );

  const deleteMeal = useCallback(async (id: number) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
    await deleteCachedMeal(id);
    try {
      await api.deleteMeal(id);
    } catch {
      await queueOp({ kind: "delete_meal", targetId: id });
      setPendingOps(await getPendingOpCount());
    }
  }, []);

  const reset = useCallback(async () => {
    // Reset local: vacía cache y cola. El backend se queda como está.
    const { wipeAll } = await import("@/lib/db");
    await wipeAll();
    setProfile(DEFAULT_PROFILE);
    setTargets(DEFAULT_TARGETS);
    setMeals([]);
    setPendingOps(0);
  }, []);

  // ------------------------------------------------------------------------
  // Memo del value del contexto
  // ------------------------------------------------------------------------
  const value = useMemo<AppContextValue>(
    () => ({
      hydrated,
      online,
      pendingOps,
      profile,
      targets,
      meals,
      refresh,
      reset,
      updateProfile,
      updateTargets,
      addMeal,
      updateMeal,
      deleteMeal,
    }),
    [
      hydrated,
      online,
      pendingOps,
      profile,
      targets,
      meals,
      refresh,
      reset,
      updateProfile,
      updateTargets,
      addMeal,
      updateMeal,
      deleteMeal,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/** Hook principal: usar en cualquier client component. */
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de <AppProvider>");
  return ctx;
}

// ------------------------------------------------------------------------
// Selectores derivados
// ------------------------------------------------------------------------

/** Comidas de una fecha concreta */
export function selectMealsByDate(meals: StoredMeal[], date: string): StoredMeal[] {
  return meals.filter((m) => m.date === date);
}

/** Totales del día (suma kcal/P/F/H) */
export function selectTotalsByDate(meals: StoredMeal[], date: string): {
  kcal: number;
  p: number;
  f: number;
  h: number;
} {
  const list = selectMealsByDate(meals, date);
  return list.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      p: acc.p + m.p,
      f: acc.f + m.f,
      h: acc.h + m.h,
    }),
    { kcal: 0, p: 0, f: 0, h: 0 }
  );
}

/** Serie diaria para sparklines/gráficos: últimas N días hasta hoy */
export function selectDailySeries(
  meals: StoredMeal[],
  days: number,
  fromISO?: string
): Array<{ date: string; kcal: number; p: number; f: number; h: number; count: number }> {
  const out: Array<{ date: string; kcal: number; p: number; f: number; h: number; count: number }> = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateISO = d.toISOString().slice(0, 10);
    const list = selectMealsByDate(meals, dateISO);
    out.push({
      date: dateISO,
      kcal: list.reduce((s, m) => s + m.kcal, 0),
      p: list.reduce((s, m) => s + m.p, 0),
      f: list.reduce((s, m) => s + m.f, 0),
      h: list.reduce((s, m) => s + m.h, 0),
      count: list.length,
    });
  }
  return out;
}

/** ¿El usuario ya pasó por el onboarding? (heurística: nombre !== default y peso !== default) */
export function isOnboardingComplete(profile: UserProfile): boolean {
  return profile.name !== DEFAULT_PROFILE.name || profile.weight !== DEFAULT_PROFILE.weight;
}

// Re-export del error para componentes que quieran distinguir offline vs server error
export { ApiClientError };