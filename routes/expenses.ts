import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/authenticate.js";
import { pool } from "../db.js";

const router = Router();

router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM expenses WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user?.id]
    );
    res.json(rows);
  } catch (err) {
    console.error("[EXPENSES] GET error:", err);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { date, category, description = "", amount } = req.body;
    if (!category || amount === undefined)
      return res.status(400).json({ error: "category and amount are required" });

    const id = Date.now().toString();
    const now = new Date().toISOString();
    const entryDate = date || now.split("T")[0];

    await pool.query(
      `INSERT INTO expenses (id, user_id, date, category, description, amount, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, req.user?.id, entryDate, category, description, Number(amount), now]
    );
    console.log(`[EXPENSES] Added for user ${req.user?.id}: ${category} ₹${amount}`);
    res.status(201).json({ id, userId: req.user?.id, date: entryDate, category, description, amount: Number(amount), createdAt: now });
  } catch (err) {
    console.error("[EXPENSES] POST error:", err);
    res.status(500).json({ error: "Failed to save expense" });
  }
});

router.delete("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM expenses WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user?.id]
    );
    if (rowCount && rowCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Expense not found" });
    }
  } catch (err) {
    console.error("[EXPENSES] DELETE error:", err);
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

export default router;
