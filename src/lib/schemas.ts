// lib/schemas.ts — Zod schemas for API input/output

import { z } from "zod";

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export const CONFIDENCE = ["alta", "media", "baja"] as const;

export const FoodItemSchema = z.object({
  name: z.string().min(1).max(120),
  grams: z.number().nonnegative(),
  kcal: z.number().int().nonnegative(),
  p: z.number().nonnegative(),
  f: z.number().nonnegative(),
  h: z.number().nonnegative(),
});

export const MealAnalysisSchema = z.object({
  plato: z.string().min(1).max(120),
  confidence: z.enum(CONFIDENCE),
  kcal_total: z.number().int().nonnegative(),
  proteinas_total_g: z.number().nonnegative(),
  grasas_total_g: z.number().nonnegative(),
  hidratos_total_g: z.number().nonnegative(),
  items: z.array(FoodItemSchema).min(1),
});

export const ScanInputSchema = z.object({
  image: z.string().regex(/^data:image\/(jpeg|jpg|png|webp);base64,/, {
    message: "image must be a data URL with base64 encoding (jpeg/jpg/png/webp)",
  }),
  meal: z.enum(MEAL_TYPES),
  meal_context: z.string().max(200).optional(),
});

export const MealInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  meal: z.enum(MEAL_TYPES),
  items: z.array(FoodItemSchema).min(1),
  photo_base64: z.string().optional(),
  confidence: z.enum(CONFIDENCE).optional(),
  notes: z.string().max(500).optional(),
});

export const MealPatchSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    meal: z.enum(MEAL_TYPES).optional(),
    items: z.array(FoodItemSchema).min(1).optional(),
    photo_base64: z.string().nullable().optional(),
    confidence: z.enum(CONFIDENCE).nullable().optional(),
    notes: z.string().max(500).nullable().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "empty patch body" });

export const DailyTotalsSchema = z.object({
  date: z.string(),
  kcal: z.number(),
  p: z.number(),
  f: z.number(),
  h: z.number(),
  kcal_goal: z.number().nullable().optional(),
  p_ratio_goal: z.number().nullable().optional(),
  f_ratio_goal: z.number().nullable().optional(),
  h_ratio_goal: z.number().nullable().optional(),
});

export type FoodItem = z.infer<typeof FoodItemSchema>;
export type MealAnalysis = z.infer<typeof MealAnalysisSchema>;
export type ScanInput = z.infer<typeof ScanInputSchema>;
export type MealInput = z.infer<typeof MealInputSchema>;
export type MealPatch = z.infer<typeof MealPatchSchema>;
