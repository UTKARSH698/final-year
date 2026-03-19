import { Router, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { pool } from "../db.js";
import { authenticate, AuthRequest } from "../middleware/authenticate.js";
import { setAuthCookie, clearAuthCookie } from "../utils/cookie.js";
import { generateOtp, storeOtp, verifyOtp } from "../utils/otp.js";
import { sendEmailOtp } from "../utils/email.js";
import { sendSmsOtp } from "../utils/sms.js";

const router = Router();

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many OTP requests, please try again in 15 minutes" },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts, please try again in 15 minutes" },
});
const JWT_SECRET = process.env.JWT_SECRET || "agrifuture-dev-secret-local-only";

function signToken(user: { id: string; email?: string | null; phone?: string | null }) {
  return jwt.sign({ id: user.id, email: user.email, phone: user.phone }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

// ─── Send OTP ──────────────────────────────────────────────────────────────
router.post("/send-otp", otpLimiter, async (req, res) => {
  const { email, phone } = req.body;
  if (!email && !phone)
    return res.status(400).json({ error: "Email or Phone is required" });

  const target = (email || phone) as string;
  const otp = generateOtp();
  storeOtp(target, otp);

  try {
    if (email) {
      await sendEmailOtp(email, otp);
      return res.json({ message: "OTP sent to email successfully" });
    } else {
      await sendSmsOtp(phone, otp);
      return res.json({ message: "OTP sent to phone successfully" });
    }
  } catch (err) {
    console.error("[AUTH] OTP send error:", err);
    return res.json({ message: "OTP generated (check server logs)", demo: true });
  }
});

// ─── Register ──────────────────────────────────────────────────────────────
router.post("/register", otpLimiter, async (req, res) => {
  const { email, phone, password, name, otp, msg91Token } = req.body;
  const target = email || phone;
  if (!target) return res.status(400).json({ error: "Email or Phone is required" });
  if (!password) return res.status(400).json({ error: "Password is required" });

  if (msg91Token) {
    try {
      const response = await fetch(
        "https://control.msg91.com/api/v5/widget/verifyAccessToken",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ authkey: process.env.MSG91_AUTH_KEY, "access-token": msg91Token }),
        }
      );
      const data = await response.json();
      if (data.status !== "success" && data.type !== "success")
        return res.status(400).json({ error: "Authentication Failure" });
    } catch {
      return res.status(500).json({ error: "Verification failed" });
    }
  } else {
    if (!verifyOtp(target, otp))
      return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  const existing = email
    ? (await pool.query("SELECT id FROM users WHERE email = $1", [email])).rows[0]
    : (await pool.query("SELECT id FROM users WHERE phone = $1", [phone])).rows[0];
  if (existing) return res.status(400).json({ error: "User already exists" });

  const id = crypto.randomUUID();
  const hashedPassword = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();

  await pool.query(
    `INSERT INTO users (id, name, email, phone, password, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, name || "Farmer", email || null, phone || null, hashedPassword, now]
  );

  const token = signToken({ id, email, phone });
  setAuthCookie(res, token);
  res.status(201).json({ id, email, phone, name: name || "Farmer" });
});

// ─── Login (password) ──────────────────────────────────────────────────────
router.post("/login", loginLimiter, async (req, res) => {
  const { email, phone, password } = req.body;
  const { rows } = email
    ? await pool.query("SELECT * FROM users WHERE email = $1", [email])
    : await pool.query("SELECT * FROM users WHERE phone = $1", [phone]);
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ id: user.id, email: user.email, phone: user.phone, name: user.name });
});

// ─── Login via OTP ─────────────────────────────────────────────────────────
router.post("/login-otp", loginLimiter, async (req, res) => {
  const { email, phone, otp } = req.body;
  const target = email || phone;
  if (!target || !otp)
    return res.status(400).json({ error: "Identifier and OTP are required" });

  if (!verifyOtp(target, otp))
    return res.status(400).json({ error: "Invalid or expired OTP" });

  const { rows } = email
    ? await pool.query("SELECT * FROM users WHERE email = $1", [email])
    : await pool.query("SELECT * FROM users WHERE phone = $1", [phone]);
  const user = rows[0];

  if (!user)
    return res.status(401).json({ error: "No account found. Please register first." });

  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ id: user.id, email: user.email, phone: user.phone, name: user.name });
});

// ─── MSG91 Widget Token Verification ───────────────────────────────────────
router.post("/verify-msg91-token", async (req, res) => {
  const { token, name, identifier: frontendIdentifier, password } = req.body;

  const decodeMsg91Jwt = (t: string): string | null => {
    try {
      const parts = t.split(".");
      if (parts.length !== 3) return null;
      const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
      return (
        payload.mobile || payload.mob || payload.phone ||
        payload.phoneNumber || payload.number || payload.email ||
        payload.mail || payload.sub || payload.identifier ||
        payload.user || payload.uid || null
      );
    } catch { return null; }
  };

  try {
    let identifier: string | null = null;

    try {
      const response = await fetch(
        "https://control.msg91.com/api/v5/widget/verifyAccessToken",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ authkey: process.env.MSG91_AUTH_KEY, "access-token": token }),
        }
      );
      const data = await response.json();
      if (data.status === "success" || data.type === "success") {
        identifier = data.data?.mobile || data.data?.email || data.mobile || data.email || null;
      }
    } catch (e) { console.warn("[MSG91] API call failed:", e); }

    if (!identifier) identifier = decodeMsg91Jwt(token);
    if (!identifier && frontendIdentifier) identifier = frontendIdentifier;
    if (!identifier) return res.status(400).json({ error: "Could not verify identity." });

    const { rows } = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR phone = $1",
      [identifier]
    );
    let user = rows[0];
    const isRegistration = !!name;

    if (!user) {
      if (!isRegistration) return res.status(401).json({ error: "No account found. Please register first." });
      if (!password) return res.status(400).json({ error: "Password is required to create an account." });

      const newId = crypto.randomUUID();
      const hashed = await bcrypt.hash(password, 10);
      const now = new Date().toISOString();
      await pool.query(
        `INSERT INTO users (id, name, email, phone, password, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          newId, name || "Farmer",
          identifier.includes("@") ? identifier : null,
          identifier.includes("@") ? null : identifier,
          hashed, now,
        ]
      );
      const { rows: newRows } = await pool.query("SELECT * FROM users WHERE id = $1", [newId]);
      user = newRows[0];
    } else {
      if (name && user.name === "Farmer") {
        await pool.query("UPDATE users SET name = $1 WHERE id = $2", [name, user.id]);
        user.name = name;
      }
      if (password) {
        await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
          await bcrypt.hash(password, 10), user.id,
        ]);
      }
    }

    const jwtToken = signToken(user);
    setAuthCookie(res, jwtToken);
    res.json({ success: true, user: { id: user.id, email: user.email, phone: user.phone, name: user.name } });
  } catch (err) {
    console.error("[MSG91] Verify error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// ─── Me ────────────────────────────────────────────────────────────────────
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [req.user?.id]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ id: user.id, email: user.email, phone: user.phone, name: user.name });
});

// ─── Logout ────────────────────────────────────────────────────────────────
router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Logged out" });
});

// ─── Profile Update ────────────────────────────────────────────────────────
router.put("/profile", authenticate, async (req: AuthRequest, res: Response) => {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [req.user?.id]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: "User not found" });

  const { name, state, landSize } = req.body;
  await pool.query(
    `UPDATE users
     SET name = COALESCE($1, name),
         state = COALESCE($2, state),
         land_size = COALESCE($3, land_size)
     WHERE id = $4`,
    [name?.trim() || null, state?.trim() || null, landSize ?? null, user.id]
  );
  const { rows: updated } = await pool.query("SELECT * FROM users WHERE id = $1", [user.id]);
  const u = updated[0];
  res.json({ id: u.id, email: u.email, phone: u.phone, name: u.name, state: u.state, landSize: u.land_size });
});

export default router;
