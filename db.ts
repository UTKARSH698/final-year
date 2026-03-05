import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'agrifuture.db');
export const db = new Database(DB_PATH);

// ─── WAL mode for better concurrent read performance ─────────────────────────
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ───────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL DEFAULT 'Farmer',
    email     TEXT UNIQUE,
    phone     TEXT UNIQUE,
    password  TEXT NOT NULL,
    state     TEXT,
    landSize  TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reports (
    id        TEXT PRIMARY KEY,
    userId    TEXT NOT NULL,
    type      TEXT NOT NULL,
    title     TEXT NOT NULL,
    summary   TEXT,
    data      TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id        TEXT PRIMARY KEY,
    paymentId TEXT,
    status    TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id          TEXT PRIMARY KEY,
    userId      TEXT NOT NULL,
    date        TEXT NOT NULL,
    category    TEXT NOT NULL,
    description TEXT DEFAULT '',
    amount      REAL NOT NULL,
    createdAt   TEXT NOT NULL
  );
`);

// ─── One-time JSON → SQLite migration ────────────────────────────────────────
function migrateJson<T extends Record<string, any>>(
  filePath: string,
  table: string,
  columns: string[],
  transform?: (row: T) => T,
): void {
  if (!fs.existsSync(filePath)) return;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8').trim();
    if (!raw || raw === '[]') return;
    const rows: T[] = JSON.parse(raw);
    if (!rows.length) return;

    const existing = (db.prepare(`SELECT COUNT(*) as n FROM ${table}`).get() as any).n;
    if (existing > 0) {
      console.log(`[DB] ${table}: already has data, skipping JSON migration`);
      return;
    }

    const cols = columns.join(', ');
    const placeholders = columns.map(() => '?').join(', ');
    const insert = db.prepare(`INSERT OR IGNORE INTO ${table} (${cols}) VALUES (${placeholders})`);

    const migrate = db.transaction(() => {
      for (const row of rows) {
        const r = transform ? transform(row) : row;
        insert.run(columns.map(c => r[c] ?? null));
      }
    });
    migrate();
    console.log(`[DB] Migrated ${rows.length} rows from ${path.basename(filePath)} → ${table}`);
  } catch (err) {
    console.error(`[DB] Migration failed for ${filePath}:`, err);
  }
}

// Migrate users — flatten _hasPassword field
migrateJson(
  path.join(DATA_DIR, 'users.json'),
  'users',
  ['id', 'name', 'email', 'phone', 'password', 'state', 'landSize', 'createdAt'],
  (u) => ({ ...u, createdAt: u.createdAt || new Date().toISOString() }),
);

// Migrate reports — data field must be JSON string
migrateJson(
  path.join(DATA_DIR, 'reports.json'),
  'reports',
  ['id', 'userId', 'type', 'title', 'summary', 'data', 'timestamp', 'createdAt'],
  (r) => ({
    ...r,
    data:      typeof r.data === 'string' ? r.data : JSON.stringify(r.data ?? {}),
    timestamp: r.timestamp || r.createdAt || new Date().toISOString(),
    createdAt: r.createdAt || r.timestamp || new Date().toISOString(),
  }),
);

// Migrate orders
migrateJson(
  path.join(DATA_DIR, 'orders.json'),
  'orders',
  ['id', 'paymentId', 'status', 'createdAt'],
  (o) => ({ ...o, createdAt: o.createdAt || new Date().toISOString() }),
);

// Migrate expenses
migrateJson(
  path.join(DATA_DIR, 'expenses.json'),
  'expenses',
  ['id', 'userId', 'date', 'category', 'description', 'amount', 'createdAt'],
  (e) => ({ ...e, createdAt: e.createdAt || new Date().toISOString() }),
);

console.log(`[DB] SQLite ready → ${DB_PATH}`);
