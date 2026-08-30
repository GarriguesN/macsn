# DESIGN — Macsn backend

## 1. Objetivo

API backend para una PWA que escanea fotos de comida y devuelve macros
(kcal / proteínas / grasas / hidratos). La PWA se conectará vía fetch; este
repo solo expone la API.

## 2. Decisiones de stack

### Next.js 15 (route handlers), NO export estático
La app **no** es una PWA en este repo (eso va en otro). Aquí necesitamos
procesamiento en servidor (vision calls, SQLite), así que `next start`
sirve los route handlers. `next.config.ts` deja `output` sin definir y
desactiva PWA.

### better-sqlite3 (file-based)
- Persistencia local, sin Postgres. Un solo archivo en `data/macsn.db`.
- WAL mode + `foreign_keys = ON` para soportar `ON DELETE CASCADE`.
- Sin ORM: las queries son lo bastante simples y `better-sqlite3` es
  synchronous (zero overhead en route handlers).
- Singleton: `initDb()` retorna la misma instancia por proceso.

### BAML como contrato, wrapper manual como ejecutor
El archivo `src/baml_src/scan.baml` define `class FoodItem`, `class MealAnalysis`
y `function AnalyzeMeal`. **Es la fuente de verdad de la forma del JSON esperado.**

`@boundaryml/baml` genera un cliente tipado a `src/baml_client/` cuando se
ejecuta `baml-cli generate`. Sin embargo, el cliente `openai-generic` de BAML
no permite cambiar el path base del endpoint por cliente (asume
`/chat/completions`). Como MiniMax expone `/v1/text/chatcompletion_v2`,
**implementamos un wrapper manual en `src/lib/baml.ts`** que:

1. Lee `MINIMAX_API_KEY` de env.
2. Construye el body M2 (`messages[]` con `content: [{type:'text'}, {type:'image_url', image_url:{url:'data:...'}}]`).
3. POST a `${MINIMAX_BASE_URL}/chatcompletion_v2` con `Authorization: Bearer`.
4. Parsea la respuesta (puede venir envuelta en fences Markdown).
5. **Valida contra el mismo Zod schema** que el contrato BAML.

Si en el futuro BAML soporta el path custom, podemos reemplazar el wrapper
por `b.AnalyzeMeal(image, ctx)` sin tocar la API pública del backend.

### Zod para inputs en route handlers
Validación declarativa y mensajes estructurados. `errorResponse()` mapea
`ZodError` y `ApiError` a JSON `{error, code, details?}` con status code
apropiado.

### Docker multi-stage
- **builder**: `node:22-slim` + build-essential para compilar `better-sqlite3`.
  Hace `npm ci` + copia fuentes + `baml generate` (best-effort) + `next build`.
- **runner**: `node:22-slim` + `libstdc++6` (runtime de better-sqlite3).
  Usuario no-root (`nodeuser`), `EXPOSE 3008`, `CMD ["npm","start"]`.
- Volumen `/opt/macsn/data` → `/app/data` para que la DB persista entre
  reinicios y actualizaciones.
- Healthcheck contra `/api/health`.

### Tipos `meal` y validación `CHECK`
`breakfast | lunch | dinner | snack` enforced en SQL (`CHECK (meal IN (...))`)
y en Zod (`z.enum`). Double safety: DB rechaza aunque la app se equivoque.

### Totales derivados vs columnas en `meals`
Hay trade-off. Aquí decidimos almacenar `kcal, p, f, h` en `meals` para que
`GET /api/meals` y `GET /api/meals/totals` sean queries simples (un SUM
sin JOIN). El precio es que cualquier POST/PATCH debe **recomputar** los
totales (lo hacemos dentro de la transacción).

### Errores
`ApiError(status, code, message, details?)`. Codes estables para que el
frontend pueda mapear UX:
- `400 invalid_input` (Zod)
- `400 invalid_date`, `invalid_meal`, `invalid_id`, `bad_json`
- `404 not_found`
- `422 minimax_no_content`, `minimax_bad_json`, `minimax_schema_mismatch`
- `500 internal_error`
- `503 minimax_no_key`, `minimax_quota`, `minimax_upstream`, `minimax_network`

## 3. Modelo de datos

```sql
meals
  id PK
  date          TEXT  YYYY-MM-DD
  meal          TEXT  breakfast|lunch|dinner|snack  CHECK
  kcal, p, f, h INTEGER  -- derived totals, recomputed on POST/PATCH
  photo_base64  TEXT NULL
  confidence    TEXT NULL alta|media|baja
  notes         TEXT NULL
  created_at    INTEGER  ms epoch

food_items
  id PK
  meal_id FK -> meals(id) ON DELETE CASCADE
  name, grams, kcal, p, f, h
  ord INTEGER  -- order within the meal

daily_settings
  date PK
  kcal_goal, p_ratio, f_ratio, h_ratio  -- nullable
```

Índices: `idx_meals_date`, `idx_meals_meal`, `idx_food_items_meal`.

## 4. Pipeline `/api/scan`

```
[client] POST /api/scan { image, meal, meal_context? }
  → Zod.parse(ScanInputSchema)
  → analyzeMeal(imageDataUrl, meal, mealContext)
      → fetch POST {base_url}/chatcompletion_v2
        body: { model: "MiniMax-M3", messages: [...], response_format: json_object }
      → extractJson(content)  // strips fences, locates first {…}
      → MealAnalysisSchema.safeParse(parsed)
  → calibrateMeal(meal)
      → density outlier detection (FOOD_DENSITY table, ±30%/-40% tolerance)
      → sum_mismatch detection (items vs kcal_total, >10%)
      → confidence auto-degradation
  → return { ...meal, _calibration: { flags, calibrated, original_confidence, final_confidence } }
```

### 4.1 Capa de calibración

**Motivación** (round de testing 2026-08-30, 6 fotos reales): MiniMax M3 tiende
a (a) sobreestimar kcal de hidratos (arroz, huevos fritos, empanadas), y (b)
declarar siempre `"confidence": "media"` incluso en fotos obvias. El usuario
quería poder fiarse de los números sin tener que ajustar con sliders.

**Solución**: una capa de post-procesado en el backend que no modifica kcal ni
gramos — solo marca flags y degrada la confianza. El frontend puede mostrar
"Detectamos 1 estimación dudosa" y el usuario decide si ajustar.

- `src/lib/calibration.ts` — Tabla `FOOD_DENSITY` con ~40 categorías (kcal/g
  min/max). Fuentes: BEDCA + USDA + ajustes del usuario. Categorías incluyen
  cocina española (tortilla, jamón, paella) y **latinoamericana** (arepa,
  empanada_frita, chicharrones, tostones, chorizo). `classifyFood(name)` hace
  match por **palabra completa** (token set) con variantes singular/plural.
  Decisión consciente: substring libre causaba falsos positivos
  ("empanada" matcheaba accidentalmente con `pan_blanco`).
- `src/lib/postprocess.ts` — `calibrateMeal` itera los items, genera flags
  `density_outlier` cuando `kcal/g` cae fuera del rango con tolerancia
  extendida (±30% inferior, +40% superior). También flag `sum_mismatch` si
  la suma de items difiere del `kcal_total` en >10%.
- Auto-degradación de confianza:
  - ≥2 density_outlier → `"baja"`
  - 1 outlier + original `"alta"` → `"media"`
  - 1 outlier + original `"media"` → sin cambio (no cascadeamos)
  - sum_mismatch adicional cuando final=`"media"` → baja a `"baja"`

**Limitaciones**: la API de visión no es determinística (cada llamada al
mismo foto devuelve items distintos), por lo que no podemos garantizar que
un foto específico genere siempre ≥1 flag. La cobertura mejora con el tiempo
añadiendo más categorías a la tabla según feedback del usuario.

## 5. Tests

- **integration** (`tests/integration/meals.test.ts`): `:memory:` SQLite,
  CRUD completo, CHECK constraint, cascade delete, totales. Deterministas,
  no requieren red.
- **integration** (`tests/integration/calibration.test.ts`): llama a
  `POST /api/scan` con tres fotos reales (empanadas+huevos+chicharrones,
  cinta métrica como no-comida, tortita+jamon). SKIP si no hay key/quota.
  Verifica estructura `_calibration` siempre presente. No exige flag
  concreto porque la API no es determinística.
- **integration** (`tests/integration/date-validation.test.ts`): validación
  estricta de fechas (calendario real + paridad GET/POST).
- **unit** (`tests/unit/calibration.test.ts`): 15 tests deterministas sobre
  `classifyFood` y `calibrateMeal`. Cubre: tabla `FOOD_DENSITY` completa,
  match singular/plural, detección de outliers con datos sintéticos (empanadas
  a 5 kcal/g, chicharrones a 12 kcal/g), degradación de confianza, escenarios
  reales del round de testing del usuario.
- **unit** (`tests/unit/scan.test.ts`): usa `img_def9cea61201.jpg` (jamón
  + tortilla pequeña, ~80-120 kcal). **SKIP explícito** si no hay
  `MINIMAX_API_KEY` o si upstream devuelve 429/quota. Esto es importante:
  el CI / dev puede no tener key sin que los tests fallen.
- **smoke** (`tests/smoke.sh`): curl contra un servidor ya levantado
  (post-deploy verification). No se ejecuta automáticamente en `npm test`.

## 6. Despliegue

1. Push a `re-styling`.
2. En el CT destino: `git pull` + `docker compose up -d --build`.
3. Verificar `curl http://macsn.nglab.es:3008/api/health`.

No se sube imagen a ningún registry: el CT destino construye localmente.

## 7. Lo que NO hace este repo

- Frontend / UI / PWA. Vive en otro repo.
- Auth. La PWA es single-user por dispositivo (sin login).
- Sync entre dispositivos. Decisión consciente del producto.
- Cola/workers para vision. La llamada es sync; si hay latencia alta se
  puede mover a streaming SSE más adelante.

## 8. Limitaciones conocidas (deuda técnica)

- **CORS**: el backend no define `Access-Control-Allow-Origin` en MVP.
  Aceptable para LAN; en producción pública añadir middleware Next.js
  con allowlist (probablemente solo `https://macsn.nglab.es`).
- **Validación de fechas**: el esquema `DateString` (ver `src/lib/schemas.ts`)
  valida forma YYYY-MM-DD **y** calendario real (rechaza `2026-13-99`,
  `2025-02-30`, etc.). Aplica a POST/PATCH y a las query params
  `?date`, `?from`, `?to` de GET. Antes de este fix, GET aceptaba
  cualquier string y `POST` validaba solo la forma.
