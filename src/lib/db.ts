// lib/db.ts — better-sqlite3 init (idempotent). Returns a singleton DB.

import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

export type DB = Database.Database;

let _db: DB | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  meal TEXT NOT NULL CHECK (meal IN ('breakfast','lunch','dinner','snack')),
  kcal INTEGER NOT NULL,
  p INTEGER NOT NULL,
  f INTEGER NOT NULL,
  h INTEGER NOT NULL,
  photo_base64 TEXT,
  confidence TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date);
CREATE INDEX IF NOT EXISTS idx_meals_meal ON meals(meal);

CREATE TABLE IF NOT EXISTS food_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meal_id INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grams REAL NOT NULL,
  kcal INTEGER NOT NULL,
  p REAL NOT NULL,
  f REAL NOT NULL,
  h REAL NOT NULL,
  ord INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_food_items_meal ON food_items(meal_id);

CREATE TABLE IF NOT EXISTS daily_settings (
  date TEXT PRIMARY KEY,
  kcal_goal INTEGER,
  p_ratio INTEGER,
  f_ratio INTEGER,
  h_ratio INTEGER
);
`;

export function getDbPath(): string {
  const envPath = process.env.MACSN_DB_PATH;
  if (envPath) return envPath;
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  return path.join(dataDir, "macsn.db");
}

export function initDb(dbPath?: string): DB {
  if (_db) return _db;
  const finalPath = dbPath ?? getDbPath();
  const dir = path.dirname(finalPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new Database(finalPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  _db = db;
  return db;
}

export function resetDbForTest(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
