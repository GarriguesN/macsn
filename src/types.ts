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

// ---- Tipos compuestos / cliente (compartidos con el API) ----

export type MealType = MealRow["meal"];
export type Confidence = NonNullable<MealRow["confidence"]>;

/** Meal tal como la devuelve el API (fila + items). */
export interface Meal extends MealRow {
  items: FoodItemRow[];
}

/** Item de comida tal como se envía al API al crear/editar. */
export interface FoodItem {
  name: string;
  grams: number;
  kcal: number;
  p: number;
  f: number;
  h: number;
}

/** Payload de POST /api/meals */
export interface MealInput {
  date: string;
  meal: MealType;
  items: FoodItem[];
  photo_base64?: string | null;
  confidence?: Confidence | null;
  notes?: string | null;
}

/** Payload de PATCH /api/meals/:id */
export interface MealPatch {
  date?: string;
  meal?: MealType;
  items?: FoodItem[];
  photo_base64?: string | null;
  confidence?: Confidence | null;
  notes?: string | null;
}

/** Resultado de POST /api/scan (análisis de la foto) */
export interface ScanResult {
  plato: string;
  confidence: Confidence;
  kcal_total: number;
  proteinas_total_g: number;
  grasas_total_g: number;
  hidratos_total_g: number;
  items: FoodItem[];
}
