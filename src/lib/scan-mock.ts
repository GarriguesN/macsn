// lib/scan-mock.ts — simulador de la API de visión (MiniMax M3 vía BAML)
//
// Devuelve un ScanResult plausible tras un delay configurable. Permite
// demostrar el flujo cámara → preview editable → guardar sin depender del
// backend real (que vive en /api/scan).

import type { MealType, ScanResult } from "@/types";

/** Lista de platos plausibles para rotar en el mock */
const MOCK_DISHES: Array<{
  name: string;
  confidence: "alta" | "media" | "baja";
  items: ScanResult["items"];
  kcal_total: number;
  proteinas_total_g: number;
  grasas_total_g: number;
  hidratos_total_g: number;
}> = [
  {
    name: "Pollo a la plancha con arroz y verduras",
    confidence: "alta",
    kcal_total: 620,
    proteinas_total_g: 45,
    grasas_total_g: 18,
    hidratos_total_g: 68,
    items: [
      { name: "Pechuga de pollo a la plancha", grams: 150, kcal: 165, p: 31, f: 4, h: 0 },
      { name: "Arroz blanco cocido", grams: 120, kcal: 156, p: 3, f: 0, h: 34 },
      { name: "Brócoli al vapor", grams: 100, kcal: 34, p: 3, f: 0, h: 7 },
      { name: "Aceite de oliva virgen extra", grams: 10, kcal: 90, p: 0, f: 10, h: 0 },
    ],
  },
  {
    name: "Ensalada César con pollo",
    confidence: "alta",
    kcal_total: 540,
    proteinas_total_g: 38,
    grasas_total_g: 32,
    hidratos_total_g: 24,
    items: [
      { name: "Lechuga romana", grams: 120, kcal: 24, p: 2, f: 0, h: 5 },
      { name: "Pechuga de pollo a la plancha", grams: 130, kcal: 143, p: 27, f: 3, h: 0 },
      { name: "Picatostes", grams: 30, kcal: 130, p: 3, f: 5, h: 19 },
      { name: "Queso parmesano rallado", grams: 15, kcal: 70, p: 6, f: 5, h: 0 },
      { name: "Salsa César", grams: 30, kcal: 130, p: 1, f: 13, h: 2 },
    ],
  },
  {
    name: "Bowl de quinoa con aguacate",
    confidence: "media",
    kcal_total: 480,
    proteinas_total_g: 16,
    grasas_total_g: 22,
    hidratos_total_g: 58,
    items: [
      { name: "Quinoa cocida", grams: 150, kcal: 180, p: 7, f: 3, h: 32 },
      { name: "Aguacate", grams: 80, kcal: 128, p: 2, f: 12, h: 7 },
      { name: "Garbanzos cocidos", grams: 80, kcal: 100, p: 6, f: 2, h: 16 },
      { name: "Tomate cherry", grams: 50, kcal: 18, p: 1, f: 0, h: 4 },
      { name: "Zumo de limón", grams: 10, kcal: 4, p: 0, f: 0, h: 1 },
    ],
  },
  {
    name: "Tortilla española con pan",
    confidence: "alta",
    kcal_total: 460,
    proteinas_total_g: 22,
    grasas_total_g: 28,
    hidratos_total_g: 30,
    items: [
      { name: "Tortilla de patata (2 huevos)", grams: 180, kcal: 320, p: 14, f: 22, h: 18 },
      { name: "Pan de barra", grams: 50, kcal: 130, p: 4, f: 1, h: 26 },
      { name: "Aceite de oliva", grams: 5, kcal: 45, p: 0, f: 5, h: 0 },
    ],
  },
  {
    name: "Salmón al horno con boniato",
    confidence: "alta",
    kcal_total: 580,
    proteinas_total_g: 38,
    grasas_total_g: 24,
    hidratos_total_g: 48,
    items: [
      { name: "Salmón al horno", grams: 160, kcal: 312, p: 34, f: 20, h: 0 },
      { name: "Boniato asado", grams: 200, kcal: 180, p: 4, f: 0, h: 41 },
      { name: "Espárragos verdes", grams: 80, kcal: 16, p: 1, f: 0, h: 3 },
      { name: "Aceite de oliva", grams: 5, kcal: 45, p: 0, f: 5, h: 0 },
    ],
  },
  {
    name: "Pasta boloñesa",
    confidence: "alta",
    kcal_total: 680,
    proteinas_total_g: 32,
    grasas_total_g: 22,
    hidratos_total_g: 84,
    items: [
      { name: "Pasta espagueti cocida", grams: 200, kcal: 260, p: 10, f: 2, h: 52 },
      { name: "Carne picada de ternera", grams: 100, kcal: 250, p: 26, f: 15, h: 0 },
      { name: "Salsa de tomate", grams: 100, kcal: 80, p: 2, f: 2, h: 12 },
      { name: "Queso parmesano rallado", grams: 10, kcal: 45, p: 4, f: 3, h: 0 },
    ],
  },
  {
    name: "Tostada de aguacate con huevo",
    confidence: "alta",
    kcal_total: 420,
    proteinas_total_g: 22,
    grasas_total_g: 24,
    hidratos_total_g: 32,
    items: [
      { name: "Pan integral tostado", grams: 60, kcal: 156, p: 6, f: 2, h: 28 },
      { name: "Aguacate", grams: 60, kcal: 96, p: 2, f: 9, h: 5 },
      { name: "Huevo frito", grams: 50, kcal: 110, p: 7, f: 9, h: 1 },
    ],
  },
  {
    name: "Yogur griego con frutos rojos",
    confidence: "alta",
    kcal_total: 240,
    proteinas_total_g: 18,
    grasas_total_g: 8,
    hidratos_total_g: 22,
    items: [
      { name: "Yogur griego natural", grams: 200, kcal: 120, p: 18, f: 4, h: 8 },
      { name: "Frutos rojos (arándanos, frambuesas)", grams: 80, kcal: 44, p: 0, f: 0, h: 11 },
      { name: "Miel", grams: 10, kcal: 30, p: 0, f: 0, h: 8 },
      { name: "Nueces", grams: 15, kcal: 98, p: 2, f: 10, h: 2 },
    ],
  },
];

let mockIndex = 0;

/**
 * Simula POST /api/scan. Devuelve un ScanResult tras 1.4s.
 * El plato se rota determinísticamente por sesión para que demos repetidas
 * muestren variedad sin sorpresas aleatorias.
 */
export async function mockScan(
  _image: string,
  _meal: MealType,
  signal?: AbortSignal
): Promise<ScanResult> {
  // Latencia simulada (rango iOS-Health-like: 1.2s - 1.8s)
  const delay = 1200 + Math.floor(Math.random() * 600);
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, delay);
    if (signal) {
      signal.addEventListener("abort", () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      });
    }
  });

  const dish = MOCK_DISHES[mockIndex % MOCK_DISHES.length];
  mockIndex++;

  return {
    plato: dish.name,
    confidence: dish.confidence,
    kcal_total: dish.kcal_total,
    proteinas_total_g: dish.proteinas_total_g,
    grasas_total_g: dish.grasas_total_g,
    hidratos_total_g: dish.hidratos_total_g,
    items: dish.items,
  };
}

/** Resultado de ejemplo para tests / stories. */
export const MOCK_SCAN_RESULT: ScanResult = {
  plato: MOCK_DISHES[0].name,
  confidence: MOCK_DISHES[0].confidence,
  kcal_total: MOCK_DISHES[0].kcal_total,
  proteinas_total_g: MOCK_DISHES[0].proteinas_total_g,
  grasas_total_g: MOCK_DISHES[0].grasas_total_g,
  hidratos_total_g: MOCK_DISHES[0].hidratos_total_g,
  items: MOCK_DISHES[0].items,
};

/** Lista los nombres disponibles (para debug / futuro "elegir plato de demo") */
export const MOCK_DISH_NAMES = MOCK_DISHES.map((d) => d.name);