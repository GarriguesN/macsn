#!/usr/bin/env bash
# tests/smoke.sh — E2E curl smoke against running server
# Usage: BASE=http://localhost:3008 bash tests/smoke.sh

set -euo pipefail
BASE="${BASE:-http://localhost:3008}"

echo "==> health"
curl -fsS "${BASE}/api/health" | head -c 200; echo

echo "==> meals list (should be [])"
curl -fsS "${BASE}/api/meals" | head -c 200; echo

echo "==> create meal"
RESP=$(curl -fsS -X POST "${BASE}/api/meals" \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-08-30","meal":"lunch","items":[{"name":"pollo","grams":200,"kcal":330,"p":62,"f":7,"h":0}],"notes":"smoke"}')
echo "$RESP" | head -c 400; echo
ID=$(echo "$RESP" | sed -n 's/.*"id":\([0-9]\+\).*/\1/p' | head -1)
echo "ID=$ID"

echo "==> get meal $ID"
curl -fsS "${BASE}/api/meals/${ID}" | head -c 400; echo

echo "==> patch meal $ID"
curl -fsS -X PATCH "${BASE}/api/meals/${ID}" \
  -H "Content-Type: application/json" \
  -d '{"notes":"patched"}' | head -c 400; echo

echo "==> totals for 2026-08-30"
curl -fsS "${BASE}/api/meals/totals?date=2026-08-30" | head -c 400; echo

echo "==> delete meal $ID"
curl -fsS -X DELETE "${BASE}/api/meals/${ID}" -w "\nstatus=%{http_code}\n"

echo "==> totals after delete"
curl -fsS "${BASE}/api/meals/totals?date=2026-08-30" | head -c 400; echo

echo "==> OK"
