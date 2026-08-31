# macsn — Macro Scanner backend

API REST que recibe una foto de comida, la envía a MiniMax M3 (vía wrapper
manual del endpoint `/v1/text/chatcompletion_v2`) y devuelve macros tipados.
Persistencia en SQLite (better-sqlite3) y contrato BAML como single source of
truth para validación con Zod.

- **Stack**: Next.js 15 (route handlers) · TypeScript estricto · better-sqlite3 · Zod · BAML (schema)
- **Visión**: MiniMax M3 (`https://api.minimax.io/v1/text/chatcompletion_v2`)
- **Puerto por defecto**: `3008`

## Quick start

```bash
cp .env.example .env
# Edit .env and set MINIMAX_API_KEY=sk-cp-...

npm install
npm run dev          # http://localhost:3008
npm run build && npm start
```

## Endpoints

### `GET /api/health`
```bash
curl http://localhost:3008/api/health
```
Response:
```json
{ "ok": true, "ts": 1756560000000, "version": "0.1.0" }
```

### `POST /api/scan`
Request:
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "meal": "lunch",
  "meal_context": "almuerzo ligero"
}
```
Response 200:
```json
{
  "plato": "Tortilla de jamón",
  "confidence": "alta",
  "kcal_total": 220,
  "proteinas_total_g": 18,
  "grasas_total_g": 14,
  "hidratos_total_g": 4,
  "items": [
    { "name": "Tortilla de jamón", "grams": 80, "kcal": 220, "p": 18, "f": 14, "h": 4 }
  ],
  "_calibration": {
    "flags": [],
    "calibrated": false,
    "original_confidence": "alta",
    "final_confidence": "alta"
  }
}
```
Errors: `400 invalid_input`, `422 minimax_*`, `503 minimax_quota`, `500 internal_error`.

#### Calibración de scans (`_calibration`)

Tras el round de testing con 6 fotos reales detectamos dos patrones de imprecisión
recurrentes: (1) hidratos del arroz y huevos fritos tienden a sobreestimarse, y
(2) la confianza siempre volvía "media" incluso en fotos obvias. La capa de
calibración post-procesa el JSON de MiniMax M3 antes de devolverlo al cliente:

- **Tabla de densidades** (`src/lib/calibration.ts`): rangos kcal/g por categoría
  de alimento basados en BEDCA + USDA + ajustes del usuario tras testing. Cubre
  ~40 categorías (cocina española + latinoamericana: arepa, empanada_frita,
  chicharrones, tostones, chorizo, etc.).
- **Detector de outliers** (`src/lib/postprocess.ts`): cada item cuya `kcal/g`
  caiga fuera del rango plausible (con tolerancia ±30% inf / +40% sup) genera
  un flag `density_outlier: <nombre> = <X.XX> kcal/g (esperado <min>-<max>)`.
- **Detector de inconsistencia**: si la suma de `items[].kcal` diverge de
  `kcal_total` en más de un 10% genera flag `sum_mismatch`.
- **Auto-degradación de confianza**:
  - ≥2 density_outlier -> baja a `"baja"`
  - 1 outlier + confianza original `"alta"` -> baja a `"media"`
  - 1 outlier + `"media"` -> se mantiene (sin cascada)
  - sum_mismatch adicional con confianza `"media"` -> baja a `"baja"`

El cliente recibe el bloque `_calibration` con `flags`, `calibrated`,
`original_confidence`, `final_confidence` para mostrarlo al usuario (p.ej.
"Detectamos 1 estimación dudosa, revisa los huevos fritos").

**Matcher**: `classifyFood(name)` normaliza a lowercase + sin acentos y parte
por cualquier no-alfanumérico (`/`, `-`, espacios). Reconoce singular y plural
(`huevo` ↔ `huevos`, `chicharron` ↔ `chicharrones`). Token match, no substring
libre (así "Empanada" no matchea accidentalmente con la key `pan_blanco`).

Ejemplo de flag real (foto de empanadas+huevos+chicharrones):
```
density_outlier: Tortas/tortillas fritas de maiz = 3.00 kcal/g (esperado 1.3-1.8)
density_outlier: Tortita de arroz = 3.75 kcal/g (esperado 1-1.5)
```

### `GET /api/meals`
Filtros (todos opcionales, combinables): `date=YYYY-MM-DD`, `from=YYYY-MM-DD`, `to=YYYY-MM-DD`, `meal=breakfast|lunch|dinner|snack`.
```bash
curl 'http://localhost:3008/api/meals?date=2026-08-30'
curl 'http://localhost:3008/api/meals?meal=lunch&from=2026-08-01&to=2026-08-31'
```
Response 200:
```json
[
  {
    "id": 1,
    "date": "2026-08-30",
    "meal": "lunch",
    "kcal": 525, "p": 66, "f": 7, "h": 43,
    "photo_base64": null,
    "confidence": null,
    "notes": null,
    "created_at": 1756560000000,
    "items": [
      { "id": 1, "meal_id": 1, "name": "Pollo", "grams": 200, "kcal": 330, "p": 62, "f": 7, "h": 0, "ord": 0 },
      { "id": 2, "meal_id": 1, "name": "Arroz", "grams": 150, "kcal": 195, "p": 4, "f": 0.5, "h": 43, "ord": 1 }
    ]
  }
]
```

### `POST /api/meals`
Request:
```json
{
  "date": "2026-08-30",
  "meal": "lunch",
  "items": [
    { "name": "Pollo a la plancha", "grams": 200, "kcal": 330, "p": 62, "f": 7, "h": 0 },
    { "name": "Arroz blanco", "grams": 150, "kcal": 195, "p": 4, "f": 0.5, "h": 43 }
  ],
  "photo_base64": "data:image/jpeg;base64,...",
  "confidence": "alta",
  "notes": "almuerzo ligero"
}
```
Response 201: el meal creado con `items[]`. Errores: `400 invalid_input`.

### `GET /api/meals/[id]`
```bash
curl http://localhost:3008/api/meals/1
```
Response 200: el meal con `items[]`. Errores: `404 not_found`, `400 invalid_id`.

### `PATCH /api/meals/[id]`
Request (cualquier subconjunto, recalcula totales si viene `items`):
```json
{ "notes": "actualizado", "items": [ { "name": "Ensalada", "grams": 250, "kcal": 150, "p": 5, "f": 8, "h": 12 } ] }
```
Response 200: meal actualizado. Errores: `400`, `404`.

### `DELETE /api/meals/[id]`
```bash
curl -X DELETE http://localhost:3008/api/meals/1 -w "\nstatus=%{http_code}\n"
```
Response: `204` (sin body). Errores: `404`.

### `GET /api/meals/totals?date=YYYY-MM-DD`
```bash
curl 'http://localhost:3008/api/meals/totals?date=2026-08-30'
```
Response 200:
```json
{
  "date": "2026-08-30",
  "kcal": 900, "p": 70, "f": 20, "h": 80,
  "kcal_goal": 2000, "p_ratio_goal": 30, "f_ratio_goal": 30, "h_ratio_goal": 40
}
```
Los `*_goal` son `null` si no hay fila en `daily_settings`. Errores: `400 invalid_date`.

## Modelo de datos

```sql
meals(id, date, meal, kcal, p, f, h, photo_base64, confidence, notes, created_at)
food_items(id, meal_id -> meals, name, grams, kcal, p, f, h, ord)
daily_settings(date PK, kcal_goal, p_ratio, f_ratio, h_ratio)
```

Tipos `meal`: `breakfast | lunch | dinner | snack` (CHECK constraint).
Confianza: `alta | media | baja`.
Totales (`kcal, p, f, h`) son columnas **derivadas** — se recomputan en POST/PATCH.

## Frontend PWA (Ticket #1)

El Home real (`/`) convive con el backend en el mismo proceso Next.js: el
cliente hace `fetch('/api/...')` a rutas relativas (mismo host en dev y prod).

- **`/`** — Home: Large Title "Resumen" + fecha es-ES, **RingChart de 4 anillos**
  concéntricos (kcal 18pt → P 16pt → H 14pt → G 12pt, colores Apple) con leyenda
  lateral, sparklines de la última semana, lista de comidas del día (max 4 + "Ver
  todas"), FAB cámara (abre modal placeholder del scan, ticket #2), borrar por
  long-press (menú contextual), banner de scans pendientes y bottom nav 3 tabs.
- **`/historial` y `/ajustes`** — placeholders "Próximamente" (tickets #4/#5).
- **Design tokens**: Tailwind v3 (`tailwind.config.ts`) con la paleta iOS del
  plan v2 §13, tipografía SF (`-apple-system`), `font-feature-settings: "tnum" 1`
  para cifras tabulares, fondo `#FAFAF7`, shadow-fab y radios iOS (cards 20pt).
- **`src/lib/db.ts`** — IndexedDB cache con **Dexie** (cliente): tablas
  `meals_cache` (fecha → meals) y `pending_scans` (cola offline para el SW del
  ticket #3). Helpers: `getCachedMeals`, `setCachedMeals`, `enqueueScan`,
  `pendingScanCount`. El SQLite del backend está en `src/lib/server/db.ts`
  (nunca importar desde componentes cliente).
- **`src/lib/api-client.ts`** — cliente tipado: `getMeals`, `getMealRange`,
  `getTotals`, `createMeal`, `updateMeal`, `deleteMeal`, `scanImage`
  (lanzan `ApiClientError` con status).
- **Manifest PWA** mínimo en `public/manifest.webmanifest` + `public/icon.svg`.
  Service worker real: ticket #3.
- **Regla de datos**: sin seeders ni datos de ejemplo — si la DB está vacía se
  muestra el empty state real. Para probar, insertar vía `curl POST /api/meals`.

## Tests

```bash
npm test                 # vitest: integration (SQLite :memory:) + unit (real photo, SKIP si no hay key)
npm run smoke            # bash + curl contra servidor en PORT 3008
```

## Docker

```bash
docker compose up -d --build
# Healthcheck: curl http://localhost:3008/api/health
# DB persistente en /opt/macsn/data/macsn.db (volumen montado)
```

## Variables de entorno

| Var | Requerida | Default | Descripción |
| --- | --- | --- | --- |
| `MINIMAX_API_KEY` | sí | — | API key MiniMax (`sk-cp-...`) |
| `MINIMAX_BASE_URL` | no | `https://api.minimax.io/v1/text` | Base URL visión |
| `MACSN_DB_PATH` | no | `./data/macsn.db` | Ruta SQLite |
| `PORT` | no | `3008` | Puerto HTTP |
