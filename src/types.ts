// types.ts — shared TS types across the app

export interface MealRow {
  id: number;
  date: string;
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  kcal: number;
  p: number;
  f: number;
  h: number;
  photo_base64: string | null;
  confidence: "alta" | "media" | "baja" | null;
  notes: string | null;
  created_at: number;
}

export interface FoodItemRow {
  id: number;
  meal_id: number;
  name: string;
  grams: number;
  kcal: number;
  p: number;
  f: number;
  h: number;
  ord: number;
}

export interface DailyTotalsRow {
  date: string;
  kcal: number;
  p: number;
  f: number;
  h: number;
  kcal_goal: number | null;
  p_ratio_goal: number | null;
  f_ratio_goal: number | null;
  h_ratio_goal: number | null;
}
