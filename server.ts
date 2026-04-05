import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import { initDb, pool } from "./db.js";
import authRouter        from "./routes/auth.js";
import marketRouter      from "./routes/market.js";
import reportsRouter     from "./routes/reports.js";
import expensesRouter    from "./routes/expenses.js";
import paymentsRouter    from "./routes/payments.js";
import predictionsRouter from "./routes/predictions.js";
import { authenticate, requireAdmin, AuthRequest } from "./middleware/authenticate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const IS_PROD = process.env.NODE_ENV === "production";

if (IS_PROD && !process.env.JWT_SECRET) {
  console.error("[FATAL] JWT_SECRET environment variable is not set in production.");
  process.exit(1);
}

async function startServer() {
  await initDb();

  const app  = express();
  const PORT = Number(process.env.PORT) || 3000;

  // ─── Security ────────────────────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: false,   // managed by Vite / CDN scripts
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cors({
    origin: IS_PROD
      ? process.env.ALLOWED_ORIGINS?.split(",") || true
      : true,
    credentials: true,
  }));

  app.use(express.json({ limit: "10mb" }));
  app.use(cookieParser());

  // ─── Health (public — shows DB connectivity) ─────────────────────────────
  app.get("/api/health", async (_req, res) => {
    try {
      const { rows: [u] } = await pool.query("SELECT COUNT(*) AS count FROM users");
      const { rows: [r] } = await pool.query("SELECT COUNT(*) AS count FROM reports");
      const { rows: [e] } = await pool.query("SELECT COUNT(*) AS count FROM expenses");
      const { rows: [o] } = await pool.query("SELECT COUNT(*) AS count FROM orders");
      const { rows: [ver] } = await pool.query("SELECT version() AS version");
      const { rows: [dbSize] } = await pool.query("SELECT pg_size_pretty(pg_database_size(current_database())) AS size");
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        database: {
          engine: "PostgreSQL",
          version: (ver.version as string).split(" ").slice(0, 2).join(" "),
          size: dbSize.size,
          connected: true,
        },
        tables: {
          users: Number(u.count),
          reports: Number(r.count),
          expenses: Number(e.count),
          orders: Number(o.count),
        },
      });
    } catch {
      res.status(503).json({ status: "error", database: { connected: false }, message: "Database unavailable" });
    }
  });

  // ─── Admin: detailed stats (admin only) ──────────────────────────────────
  app.get("/api/admin/stats", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { rows: [u] } = await pool.query("SELECT COUNT(*) AS count FROM users");
      const { rows: [r] } = await pool.query("SELECT COUNT(*) AS count FROM reports");
      const { rows: [e] } = await pool.query("SELECT COUNT(*) AS count FROM expenses");
      const { rows: [o] } = await pool.query("SELECT COUNT(*) AS count FROM orders");
      const { rows: recentUsers } = await pool.query("SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC LIMIT 10");
      const { rows: [dbSize] } = await pool.query("SELECT pg_size_pretty(pg_database_size(current_database())) AS size");
      res.json({
        tables: { users: Number(u.count), reports: Number(r.count), expenses: Number(e.count), orders: Number(o.count) },
        dbSize: dbSize.size,
        recentUsers,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  // ─── Admin: list all users (admin only) ──────────────────────────────────
  app.get("/api/admin/users", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { rows } = await pool.query("SELECT id, name, email, phone, role, state, land_size, created_at FROM users ORDER BY created_at DESC");
      res.json(rows);
    } catch {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // ─── Admin: update user role (admin only) ────────────────────────────────
  app.put("/api/admin/users/:id/role", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: "Role must be 'user' or 'admin'" });
    try {
      await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, req.params.id]);
      res.json({ message: "Role updated" });
    } catch {
      res.status(500).json({ error: "Failed to update role" });
    }
  });

  // ─── Activity Log helper ──────────────────────────────────────────────────
  const logActivity = async (userId: string, action: string, detail: string, ip: string) => {
    try {
      await pool.query(
        `INSERT INTO activity_log (user_id, action, detail, ip) VALUES ($1, $2, $3, $4)`,
        [userId, action, detail, ip]
      );
    } catch (err) {
      console.warn("[ACTIVITY] Log failed:", err);
    }
  };

  // Middleware to log activity on key endpoints
  app.use("/api", (req: any, _res, next) => {
    const userId = req.user?.id;
    if (userId && req.method === 'POST') {
      const ip = req.ip || req.headers['x-forwarded-for'] || '';
      const path = req.originalUrl;
      if (path.includes('/reports')) logActivity(userId, 'save_report', 'Saved a prediction report', ip);
      else if (path.includes('/expenses')) logActivity(userId, 'add_expense', 'Added expense entry', ip);
      else if (path.includes('/create-order')) logActivity(userId, 'create_order', 'Created payment order', ip);
    }
    next();
  });

  // ─── Activity Log endpoints ──────────────────────────────────────────────
  app.get("/api/activity", authenticate, async (req: AuthRequest, res) => {
    try {
      const { rows } = await pool.query(
        "SELECT * FROM activity_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
        [req.user?.id]
      );
      res.json(rows);
    } catch {
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  app.get("/api/admin/activity", authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT a.*, u.name as user_name FROM activity_log a
         LEFT JOIN users u ON a.user_id = u.id
         ORDER BY a.created_at DESC LIMIT 100`
      );
      res.json(rows);
    } catch {
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  // ─── Routes ──────────────────────────────────────────────────────────────
  app.use("/api/auth",          authRouter);
  app.use("/api",               marketRouter);
  app.use("/api/reports",       reportsRouter);
  app.use("/api/expenses",      expensesRouter);
  app.use("/api",               paymentsRouter);
  app.use("/api/predict",       predictionsRouter);

  // ─── MSG91 widget token (legacy path kept for frontend compatibility) ─────
  app.post("/api/verify-msg91-token", (req, res) => {
    res.redirect(307, "/api/auth/verify-msg91-token");
  });

  // ─── Global error handler ────────────────────────────────────────────────
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[UNHANDLED]", err.stack || err.message);
    res.status(500).json({ error: "Internal server error" });
  });

  // ─── Vite / Static ───────────────────────────────────────────────────────
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("/{*splat}", (_req, res) =>
      res.sendFile(path.join(distPath, "index.html"))
    );
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🌱 AgriFuture server running → http://localhost:${PORT}`);
    console.log(`   Mode: ${IS_PROD ? "production" : "development"}\n`);
  });
}

startServer().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
