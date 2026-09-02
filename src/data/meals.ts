// data/meals.ts — Catálogo stub de tipos de comida.
// "use client" safe. El grueso del UI extrae de `useApp().meals`, este
// archivo solo da valores para constantes como colores/etiquetas.

import type { MealType } from "@/types";

export const MEAL_LABELS: Record<MealType, { singular: string; plural: string }> = {
  breakfast: { singular: "Desayuno", plural: "Desayunos" },
  lunch:     { singular: "Comida",   plural: "Comidas" },
  dinner:    { singular: "Cena",     plural: "Cenas" },
  snack:     { singular: "Snack",    plural: "Snacks" },
};

export const MEAL_ORDER: ReadonlyArray<MealType> = ["breakfast", "lunch", "dinner", "snack"];

/** Imagen por defecto para MealDetail cuando no hay foto del plato */
export const MEAL_DETAIL_IMAGE = "https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=700&h=400&fit=crop";
