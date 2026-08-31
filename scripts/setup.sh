#!/usr/bin/env bash
# scripts/setup.sh — install de dependencias reproducible.
# React 19 RC + @types/react 18 chocan en peer deps → --legacy-peer-deps obligatorio.
# Prioriza npm ci (lockfile); si no hay package-lock.json, cae a npm install.
set -euo pipefail
cd "$(dirname "$0")/.."
npm ci --legacy-peer-deps || npm install --legacy-peer-deps