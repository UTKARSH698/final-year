import pkg from "pg";
const { Pool } = pkg;

if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
  console.error("[FATAL] DATABASE_URL environment variable is not set in production.");
  process.exit(1);
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/agrifuture",
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
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
  `);
  console.log("[DB] PostgreSQL schema ready");
}
