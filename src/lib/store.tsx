// lib/store.tsx — fuente única de verdad de la app (Context + Dexie).
//
// "use client" — solo se monta en el cliente.
//
// Qué expone:
// - profile, targets, meals
// - acciones: updateProfile, updateTargets, addMeal, updateMeal, deleteMeal, reset
// - selectores: mealsByDate(date), totalsByDate(date), dailySeries(days)
//
// Patrón: cualquier mutación escribe en Dexie (autoridad) y refresca el
// estado local (reactivo). No usamos useReducer para mantener el código
// legible; useState con setters nombrados es suficiente.

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

/** Input de addMeal: lo que el caller tiene (FoodItem) sin los campos de la row persistida */
type AddMealInput = Omit<
  StoredMeal,
  "id" | "created_at" | "items"
> & {
  items: FoodItem[];
};
import { type DailyTargets, DEFAULT_PROFILE, DEFAULT_TARGETS } from "@/data/user";
import {
  type StoredMeal,
  deleteStoredMeal,
  getAllMeals,
  getStoredProfile,
  getStoredTargets,
  insertMeal,
  setStoredProfile,
  setStoredTargets,
  updateStoredMeal,
  wipeAll,
} from "@/lib/db";
import { seedIfEmpty } from "@/lib/seed";

export type { StoredMeal } from "@/lib/db";

interface AppState {
  /** ¿hemos terminado la hidratación inicial? */
  hydrated: boolean;
  profile: typeof DEFAULT_PROFILE;
  targets: DailyTargets;
  meals: StoredMeal[];
}

interface AppActions {
  refresh: () => Promise<void>;
  reset: () => Promise<void>;

  updateProfile: (patch: Partial<typeof DEFAULT_PROFILE>) => Promise<void>;
  updateTargets: (patch: Partial<DailyTargets>) => Promise<void>;

  addMeal: (input: AddMealInput) => Promise<number>;
  updateMeal: (id: number, patch: MealPatch) => Promise<void>;
  deleteMeal: (id: number) => Promise<void>;
}

type AppContextValue = AppState & AppActions;

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<typeof DEFAULT_PROFILE>(DEFAULT_PROFILE);
  const [targets, setTargets] = useState<DailyTargets>(DEFAULT_TARGETS);
  const [meals, setMeals] = useState<StoredMeal[]>([]);

  // ------------------------------------------------------------------------
  // Hidratación: cargar desde IndexedDB (con seed automático)
  // ------------------------------------------------------------------------
  const refresh = useCallback(async () => {
    await seedIfEmpty();
    const [p, t, all] = await Promise.all([
      getStoredProfile(),
      getStoredTargets(),
      getAllMeals(),
    ]);
    if (p) setProfile(p);
    if (t) setTargets(t);
    setMeals(all);
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
    return () => {
      mounted = false;
    };
  }, [refresh]);

  // ------------------------------------------------------------------------
  // Acciones: cada una escribe en Dexie y refresca el slice afectado
  // ------------------------------------------------------------------------
  const updateProfile = useCallback(
    async (patch: Partial<typeof DEFAULT_PROFILE>) => {
      const next = { ...profile, ...patch };
      setProfile(next);
      await setStoredProfile(next);
    },
    [profile]
  );

  const updateTargets = useCallback(
    async (patch: Partial<DailyTargets>) => {
      const next = { ...targets, ...patch };
      setTargets(next);
      await setStoredTargets(next);
    },
    [targets]
  );

  const addMeal = useCallback(
    async (input: AddMealInput): Promise<number> => {
      // Convertir items (FoodItem) a FoodItemRow (con id, meal_id, ord)
      const itemsAsRows = input.items.map((it, i) => ({
        id: 0,
        meal_id: 0,
        name: it.name,
        grams: it.grams,
        kcal: it.kcal,
        p: it.p,
        f: it.f,
        h: it.h,
        ord: i,
      }));
      const stored: Omit<StoredMeal, "id"> = {
        ...input,
        items: itemsAsRows,
        created_at: Date.now(),
      };
      const id = await insertMeal(stored as StoredMeal);
      if (id > 0) {
        // meal_id se reasigna tras insertar
        const finalRows = itemsAsRows.map((r) => ({ ...r, meal_id: id }));
        setMeals((prev) => [
          ...prev,
          { ...(stored as StoredMeal), id, items: finalRows },
        ]);
      }
      return id;
    },
    []
  );

  const updateMeal = useCallback(
    async (id: number, patch: MealPatch) => {
      const updateData: Partial<StoredMeal> = {};
      if (patch.meal) updateData.meal = patch.meal;
      if (patch.date) updateData.date = patch.date;
      if (patch.photo_base64 !== undefined)
        updateData.photo_base64 = patch.photo_base64;
      if (patch.confidence !== undefined)
        updateData.confidence = patch.confidence;
      if (patch.notes !== undefined) updateData.notes = patch.notes;
      if (patch.items) {
        // Reconstruir FoodItemRow con id/meal_id/ord preservados si vienen
        updateData.items = patch.items.map((it, i) => ({
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
        updateData.kcal = patch.items.reduce((s, i) => s + i.kcal, 0);
        updateData.p = patch.items.reduce((s, i) => s + i.p, 0);
        updateData.f = patch.items.reduce((s, i) => s + i.f, 0);
        updateData.h = patch.items.reduce((s, i) => s + i.h, 0);
      }
      await updateStoredMeal(id, updateData);
      setMeals((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updateData } : m))
      );
    },
    []
  );

  const deleteMeal = useCallback(async (id: number) => {
    await deleteStoredMeal(id);
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const reset = useCallback(async () => {
    await wipeAll();
    setProfile(DEFAULT_PROFILE);
    setTargets(DEFAULT_TARGETS);
    setMeals([]);
    // re-seed para que la siguiente visita tenga datos
    await seedIfEmpty();
    await refresh();
  }, [refresh]);

  // ------------------------------------------------------------------------
  // Memo del value del contexto
  // ------------------------------------------------------------------------
  const value = useMemo<AppContextValue>(
    () => ({
      hydrated,
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
  if (!ctx) {
    throw new Error("useApp debe usarse dentro de <AppProvider>");
  }
  return ctx;
}

// ============================================================================
// Selectores: funciones puras para derivar datos del store
// ============================================================================

/** Comidas de una fecha concreta (ordenadas por createdAt asc) */
export function selectMealsByDate(
  meals: StoredMeal[],
  date: string
): StoredMeal[] {
  return meals
    .filter((m) => m.date === date)
    .sort((a, b) => a.created_at - b.created_at);
}

/** Suma kcal + macros de una fecha */
export function selectTotalsByDate(
  meals: StoredMeal[],
  date: string
): { kcal: number; p: number; f: number; h: number; count: number } {
  const dayMeals = selectMealsByDate(meals, date);
  return dayMeals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      p: acc.p + m.p,
      f: acc.f + m.f,
      h: acc.h + m.h,
      count: acc.count + 1,
    }),
    { kcal: 0, p: 0, f: 0, h: 0, count: 0 }
  );
}

/** Serie de últimos N días (incluye hoy). days=7 -> hoy y 6 anteriores */
export function selectDailySeries(
  meals: StoredMeal[],
  days: number,
  fromISO: string
): { date: string; kcal: number; p: number; f: number; h: number; count: number }[] {
  const series: {
    date: string;
    kcal: number;
    p: number;
    f: number;
    h: number;
    count: number;
  }[] = [];
  const [y, m, d] = fromISO.split("-").map(Number);
  const start = new Date(Date.UTC(y!, m! - 1, d!));
  for (let i = 0; i < days; i++) {
    const dt = new Date(start);
    dt.setUTCDate(start.getUTCDate() + i);
    const iso = dt.toISOString().slice(0, 10);
    series.push({ date: iso, ...selectTotalsByDate(meals, iso) });
  }
  return series;
}

/** Detecta si el onboarding se ha completado (perfil con valores reales) */
export function isOnboardingComplete(profile: typeof DEFAULT_PROFILE): boolean {
  // Heurística simple: si el usuario sigue con el perfil seed por defecto
  // (Alex) y peso/altura coinciden con DEFAULT_PROFILE, aún no pasó por onboarding.
  // En producción, esto debería leerse de un flag explícito.
  return profile.name !== DEFAULT_PROFILE.name || profile.weight !== DEFAULT_PROFILE.weight;
}

/** Helper de tipos para exponer `Meal` como alias del wire-format */
export type StoredMealView = StoredMeal;
export type MealTypeSafe = MealType;