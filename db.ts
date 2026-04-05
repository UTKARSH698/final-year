import pkg from "pg";
const { Pool } = pkg;

if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
  console.error("[FATAL] DATABASE_URL environment variable is not set in production.");
  process.exit(1);
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/agrifuture",
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : false,
});

// ─── Schema ───────────────────────────────────────────────────────────────
export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL DEFAULT 'Farmer',
      email       TEXT UNIQUE,
      phone       TEXT UNIQUE,
      password    TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'user',
      state       TEXT,
      land_size   TEXT,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      type        TEXT NOT NULL,
      title       TEXT NOT NULL,
      summary     TEXT,
      data        TEXT NOT NULL,
      timestamp   TEXT NOT NULL,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id          TEXT PRIMARY KEY,
      payment_id  TEXT,
      status      TEXT,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      date        TEXT NOT NULL,
      category    TEXT NOT NULL,
      description TEXT DEFAULT '',
      amount      NUMERIC NOT NULL,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS otp_tokens (
      target     TEXT PRIMARY KEY,
      otp        TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id         SERIAL PRIMARY KEY,
      user_id    TEXT NOT NULL,
      action     TEXT NOT NULL,
      detail     TEXT DEFAULT '',
      ip         TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Performance indexes
    CREATE INDEX IF NOT EXISTS idx_users_email    ON users (email);
    CREATE INDEX IF NOT EXISTS idx_users_phone    ON users (phone);
    CREATE INDEX IF NOT EXISTS idx_reports_user   ON reports (user_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_user  ON expenses (user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders (status);
    CREATE INDEX IF NOT EXISTS idx_activity_user  ON activity_log (user_id);
  `);
  // Migration: add role column if missing (for existing DBs)
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'`);
  } catch { /* column already exists */ }

  console.log("[DB] PostgreSQL schema ready");
}
