// data/frequentFoods.ts — Lista de alimentos frecuentes derivada de los
// items reales (no seed). Se calcula en el cliente, no se hardcodea.

export interface FrequentFood {
  name: string;
  kcal: number;
  times: number;
  img: string;
}

// Stub vacío: la lista se calcula a partir de las comidas reales del usuario
// (ver StatsScreen.frequentFoods). Este array solo existe para que
// FrequentFood esté exportado y la UI compile en cold-start sin datos.
export const FREQUENT_FOODS: ReadonlyArray<FrequentFood> = [];
