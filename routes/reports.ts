import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/authenticate.js";
import { pool } from "../db.js";

const router = Router();

router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user?.id]
    );
    res.json(rows.map((r) => ({ ...r, data: JSON.parse(r.data) })));
  } catch (err) {
    console.error("[REPORTS] GET error:", err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date().toISOString();
    const id = Date.now().toString();
    const { type = "Crop Prediction", title = "Report", summary = "", data = {} } = req.body;

    await pool.query(
      `INSERT INTO reports (id, user_id, type, title, summary, data, timestamp, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, req.user?.id, type, title, summary, JSON.stringify(data), now, now]
    );
    console.log(`[REPORTS] Saved "${type}" for user ${req.user?.id}`);
    res.status(201).json({ id, userId: req.user?.id, type, title, summary, data, timestamp: now, createdAt: now });
  } catch (err) {
    console.error("[REPORTS] POST error:", err);
    res.status(500).json({ error: "Failed to save report" });
  }
});

router.delete("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM reports WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user?.id]
    );
    if (rowCount && rowCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Report not found" });
    }
  } catch (err) {
    console.error("[REPORTS] DELETE error:", err);
    res.status(500).json({ error: "Failed to delete report" });
  }
});

export default router;
