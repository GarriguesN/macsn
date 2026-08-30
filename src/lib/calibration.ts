// lib/calibration.ts — Tabla de densidades kcal/g por categoría de alimento.
//
// Sirve para dos cosas:
//   1. Post-procesado: detectar outliers de densidad kcal/g en items que el modelo
//      declara. Si un item dice 4 kcal/g para una lechuga, hay un problema.
//   2. (futuro) Auto-reescalado de totales cuando items y kcal_total no cuadran.
//
// Los rangos están basados en BEDCA + USDA + las observaciones reales del usuario
// tras el round de testing con 6 fotos (empanadas+huevos+chicharrones, paella, etc).
// Mantener tolerancias amplias (±30% inferior, +40% superior) porque los valores
// del modelo son estimaciones, no verdades absolutas.

export const FOOD_DENSITY: Record<string, readonly [number, number]> = {
  // [min kcal/g, max kcal/g]
  arroz_cocido: [1.0, 1.5],
  pan_blanco: [2.4, 3.2],
  baguette: [2.6, 3.0],
  tortilla_espanola: [1.3, 1.8],
  jamon_serrano: [2.0, 2.8],
  jamon_dulce: [1.5, 2.2],
  prosciutto: [2.5, 3.2],
  carne_res: [1.8, 2.8],
  pollo: [1.4, 2.4],
  pescado_blanco: [0.8, 1.6],
  salmon: [1.8, 2.4],
  atun: [1.2, 1.8],
  gambas: [0.7, 1.0],
  sepia_calamar: [0.6, 0.9],
  pulpo: [0.7, 1.0],
  mejillones: [0.6, 0.9],
  huevo_frito: [1.7, 2.1],
  bacon: [4.0, 5.5],
  queso_manchego: [3.5, 4.5],
  queso_crema: [2.8, 3.5],
  mantequilla: [7.0, 7.5],
  aceite_oliva: [8.5, 9.0],
  lechuga: [0.1, 0.3],
  tomate: [0.15, 0.25],
  aguacate: [1.6, 2.2],
  platano: [0.85, 1.0],
  manzana: [0.5, 0.65],
  pasta_cocida: [1.3, 1.7],
  lentejas_cocidas: [1.1, 1.4],
  arroz_paella_cocido: [1.2, 1.5],
  pan_tortita_arroz: [3.5, 4.2], // rice cake
  empanada_frita: [2.0, 3.5], // ~250 kcal / ~80g
  bunuelo: [3.0, 4.5],
  chicharrones: [4.5, 5.5],
  // Variantes latinoamericanas (testing 2026-08-30):
  arepa: [1.5, 2.4],          // arepa de maiz asada ~1.7-2.0 kcal/g
  arepas: [1.5, 2.4],
  patacon: [2.0, 3.0],        // patacon frito
  yuca: [1.1, 1.4],           // yuca cocida
  papa: [0.7, 1.0],           // papa cocida
  arroz_blanco: [1.2, 1.5],   // alias comun de arroz_cocido
  tostones: [2.0, 3.0],       // = patacon
  // Alternativas de mariscos que el modelo usa en espanol:
  camaron: [0.7, 1.0],        // == gambas
  langosta: [0.8, 1.1],
  // Cortes de carne especificos:
  chorizo: [3.5, 4.8],
  salchicha: [2.5, 3.5],
  // Huevos (plurales): una sola key pero dos raices reconocibles
  huevo: [1.4, 2.2],          // alias singular de huevo_frito
};

/**
 * Clasifica un nombre de alimento a una key de FOOD_DENSITY.
 * Match por **palabra completa** (no substring libre) de la primera raíz de la key.
 * Normaliza a lowercase + sin acentos.
 *   "arroz blanco cocido"  -> "arroz_cocido"
 *   "Empanada Frita"       -> "empanada_frita"   (no matchea "pan" como substring)
 *   "filete de pollo"      -> "pollo"
 *   "jamón serrano"        -> "jamon_serrano"
 * Devuelve null si no matchea ninguna categoría conocida.
 */
export function classifyFood(name: string): string | null {
  // Normaliza: lowercase + sin acentos + split por cualquier no-alphanum (incluye '/' y '-')
  const n = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const tokens = n.split(/[^a-z0-9]+/).filter(Boolean);
  const tokenSet = new Set(tokens);
  for (const key of Object.keys(FOOD_DENSITY)) {
    const root = key.split("_")[0]!;
    // Variantes singular/plural: comparar root y todas sus formas posibles.
    // Casos: pan<->panes, arepa<->arepas, empanada<->empanadas, chicharrones<->chicharron,
    //        arroz<->arroces, salmon<->salmon, bacon<->bacons.
    const candidates = new Set<string>([root]);
    candidates.add(root + "s");
    if (root.endsWith("s")) candidates.add(root.slice(0, -1));
    candidates.add(root + "es");
    if (root.endsWith("es")) candidates.add(root.slice(0, -2));
    for (const c of candidates) {
      if (tokenSet.has(c)) return key;
    }
  }
  return null;
}

/**
 * Densidad kcal/g para una key de FOOD_DENSITY, o null si desconocida.
 */
export function densityRange(category: string): readonly [number, number] | null {
  const r = FOOD_DENSITY[category];
  return r ?? null;
}
