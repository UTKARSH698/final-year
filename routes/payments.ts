import { Router } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { pool } from "../db.js";

const router = Router();

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID     || "rzp_test_dummy_id",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_secret",
});

router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR" } = req.body;
    const order = await razorpay.orders.create({
      amount:   Math.round(amount * 100),
      currency,
      receipt:  `receipt_${Date.now()}`,
    });
    res.json(order);
  } catch (err) {
    console.error("[PAYMENTS] Razorpay order error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.post("/verify-payment", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "dummy_secret")
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (razorpay_signature !== expected) {
    return res.status(400).json({ status: "failure", message: "Invalid signature" });
  }

  try {
    await pool.query(
      `INSERT INTO orders (id, payment_id, status, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [razorpay_order_id, razorpay_payment_id, "paid", new Date().toISOString()]
    );
    res.json({ status: "success", message: "Payment verified" });
  } catch (err) {
    console.error("[PAYMENTS] DB error:", err);
    res.status(500).json({ error: "Payment recorded but DB write failed" });
  }
});

export default router;
