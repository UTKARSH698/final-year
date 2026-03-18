import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import { initDb, pool } from "./db.js";
import authRouter     from "./routes/auth.js";
import marketRouter   from "./routes/market.js";
import reportsRouter  from "./routes/reports.js";
import expensesRouter from "./routes/expenses.js";
import paymentsRouter from "./routes/payments.js";

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

  app.use(express.json({ limit: "10mb" }));
  app.use(cookieParser());

  // ─── Health ──────────────────────────────────────────────────────────────
  app.get("/api/health", async (_req, res) => {
    try {
      const { rows: [u] } = await pool.query("SELECT COUNT(*) AS count FROM users");
      const { rows: [r] } = await pool.query("SELECT COUNT(*) AS count FROM reports");
      res.json({ status: "ok", timestamp: new Date().toISOString(), users: u.count, reports: r.count });
    } catch {
      res.status(503).json({ status: "error", message: "Database unavailable" });
    }
  });

  // ─── Routes ──────────────────────────────────────────────────────────────
  app.use("/api/auth",          authRouter);
  app.use("/api",               marketRouter);
  app.use("/api/reports",       reportsRouter);
  app.use("/api/expenses",      expensesRouter);
  app.use("/api",               paymentsRouter);

  // ─── MSG91 widget token (legacy path kept for frontend compatibility) ─────
  app.post("/api/verify-msg91-token", (req, res) => {
    res.redirect(307, "/api/auth/verify-msg91-token");
  });

  // ─── Vite / Static ───────────────────────────────────────────────────────
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: "all" },
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
