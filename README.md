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
  ]
}
```
Errors: `400 invalid_input`, `422 minimax_*`, `503 minimax_quota`, `500 internal_error`.

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
