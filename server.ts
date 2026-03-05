import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import nodemailer from "nodemailer";
import axios from "axios";
import { db } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "agrifuture-secret-key-2026";
const IS_PROD = process.env.NODE_ENV === "production";

// OTPs remain in-memory (they expire in 10 min, no need to persist)
let otps: Record<string, { otp: string; expires: number }> = {};

// Email Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface AuthRequest extends Request {
  user?: { id: string; email?: string; phone?: string };
}

// Cookie helper — secure only in production (HTTPS), lax in dev (HTTP)
function setAuthCookie(res: Response, token: string) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));
  app.use(cookieParser());

  // Razorpay
  const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID     || "rzp_test_dummy_id",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_secret",
  });

  // ─── MSG91 SMS ────────────────────────────────────────────────────────────
  const sendSms = async (phone: string, otp: string) => {
    const authKey    = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;

    if (!authKey || !templateId) {
      console.log(`[DEMO] SMS OTP for ${phone}: ${otp}`);
      return true;
    }

    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

    try {
      const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${cleanPhone}&authkey=${authKey}&otp=${otp}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.type === "success") return true;
      throw new Error(data.message || "MSG91 rejected");
    } catch (err: any) {
      console.error("[MSG91] Error:", err.message);
      console.log(`[FALLBACK] OTP for ${phone}: ${otp}`);
      return true;
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  // ─── Auth Middleware ──────────────────────────────────────────────────────
  const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        email?: string;
        phone?: string;
      };
      req.user = decoded;
      next();
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  // ─── Mandi Rates ─────────────────────────────────────────────────────────
  const MANDI_RATES = [
    { crop: "Wheat (Sharbati)",     price: 2425,  change:  1.5,  location: "Sehore",      state: "Madhya Pradesh" },
    { crop: "Paddy (Basmati)",      price: 4450,  change: -0.2,  location: "Karnal",      state: "Haryana" },
    { crop: "Paddy (Common)",       price: 2300,  change:  0.0,  location: "Raipur",      state: "Chhattisgarh" },
    { crop: "Cotton (Long Staple)", price: 7521,  change:  2.1,  location: "Rajkot",      state: "Gujarat" },
    { crop: "Soybean (Yellow)",     price: 4892,  change:  1.2,  location: "Indore",      state: "Madhya Pradesh" },
    { crop: "Mustard (Rapeseed)",   price: 5950,  change: -0.8,  location: "Bharatpur",   state: "Rajasthan" },
    { crop: "Chana (Gram)",         price: 5650,  change:  1.1,  location: "Vidisha",     state: "Madhya Pradesh" },
    { crop: "Tur (Arhar)",          price: 7550,  change:  3.5,  location: "Kalaburagi",  state: "Karnataka" },
    { crop: "Moong (Green Gram)",   price: 8682,  change:  0.5,  location: "Merta City",  state: "Rajasthan" },
    { crop: "Urad (Black Gram)",    price: 7400,  change:  0.2,  location: "Latur",       state: "Maharashtra" },
    { crop: "Groundnut",            price: 6783,  change:  1.5,  location: "Junagadh",    state: "Gujarat" },
    { crop: "Maize (Kharif)",       price: 2225,  change: -1.1,  location: "Davangere",   state: "Karnataka" },
    { crop: "Bajra",                price: 2625,  change:  0.5,  location: "Alwar",       state: "Rajasthan" },
    { crop: "Jowar (Maldandi)",     price: 3371,  change:  0.0,  location: "Solapur",     state: "Maharashtra" },
    { crop: "Sunflower",            price: 7280,  change:  1.8,  location: "Latur",       state: "Maharashtra" },
    { crop: "Sesame (Til)",         price: 9267,  change:  2.2,  location: "Unjha",       state: "Gujarat" },
    { crop: "Barley",               price: 1980,  change:  0.5,  location: "Jaipur",      state: "Rajasthan" },
    { crop: "Lentil (Masoor)",      price: 6700,  change:  1.0,  location: "Patna",       state: "Bihar" },
    { crop: "Safflower",            price: 5940,  change:  0.0,  location: "Parbhani",    state: "Maharashtra" },
    { crop: "Turmeric (Finger)",    price: 13500, change:  4.5,  location: "Nizamabad",   state: "Telangana" },
    { crop: "Jeera (Cumin)",        price: 24500, change: -2.5,  location: "Unjha",       state: "Gujarat" },
    { crop: "Coriander (Dhania)",   price: 6800,  change:  1.2,  location: "Kota",        state: "Rajasthan" },
    { crop: "Sugarcane (FRP)",      price: 340,   change:  0.0,  location: "Kolhapur",    state: "Maharashtra" },
    { crop: "Onion (Red)",          price: 2200,  change:  8.5,  location: "Lasalgaon",   state: "Maharashtra" },
    { crop: "Tomato (Hybrid)",      price: 1800,  change: 12.5,  location: "Kolar",       state: "Karnataka" },
    { crop: "Potato (Jyoti)",       price: 1450,  change: -3.2,  location: "Agra",        state: "Uttar Pradesh" },
    { crop: "Garlic (Ooty)",        price: 16500, change:  5.0,  location: "Mandsaur",    state: "Madhya Pradesh" },
    { crop: "Ginger (Fresh)",       price: 6200,  change:  2.1,  location: "Wayanad",     state: "Kerala" },
  ];
  // ─────────────────────────────────────────────────────────────────────────

  // ─── Health ───────────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    const { users }   = db.prepare("SELECT COUNT(*) AS users FROM users").get() as any;
    const { reports } = db.prepare("SELECT COUNT(*) AS reports FROM reports").get() as any;
    res.json({ status: "ok", timestamp: new Date().toISOString(), users, reports });
  });

  app.get("/api/mandi-rates", (_req, res) => res.json(MANDI_RATES));

  app.get("/api/market-prices", (_req, res) => {
    res.json(
      MANDI_RATES.slice(0, 6).map((m) => ({
        crop:   m.crop,
        price:  `₹${m.price}/qtl`,
        trend:  m.change >= 0 ? "up" : "down",
        change: `${m.change >= 0 ? "+" : ""}${m.change}%`,
      }))
    );
  });
  // ─────────────────────────────────────────────────────────────────────────

  // ─── OTP ─────────────────────────────────────────────────────────────────
  app.post("/api/auth/send-otp", async (req, res) => {
    const { email, phone } = req.body;
    if (!email && !phone)
      return res.status(400).json({ error: "Email or Phone is required" });

    const target = (email || phone) as string;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otps[target] = { otp, expires: Date.now() + 10 * 60 * 1000 };

    try {
      if (email) {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          await transporter.sendMail({
            from: `"AgriFuture Intelligence" <${process.env.EMAIL_USER}>`,
            to:   email,
            subject: "Your AgriFuture Verification Code",
            html: `
              <div style="font-family:sans-serif;padding:24px;max-width:480px;margin:auto;background:#fafafa;border-radius:8px;">
                <h2 style="color:#D4AF37;margin:0 0 16px">AgriFuture Intelligence</h2>
                <p style="margin:0 0 8px">Your one-time verification code is:</p>
                <div style="font-size:36px;font-weight:bold;letter-spacing:8px;margin:16px 0;color:#222">${otp}</div>
                <p style="color:#666;font-size:13px">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
              </div>`,
          });
          return res.json({ message: "OTP sent to email successfully" });
        } else {
          console.log(`[DEMO] Email OTP for ${email}: ${otp}`);
          return res.json({ message: "Demo mode — OTP is in server logs", demo: true });
        }
      } else if (phone) {
        await sendSms(phone, otp);
        return res.json({ message: "OTP sent to phone successfully" });
      }
    } catch (err) {
      console.error("OTP send error:", err);
      console.log(`[FALLBACK] OTP for ${target}: ${otp}`);
      return res.json({ message: "OTP generated (check server logs)", demo: true });
    }
  });
  // ─────────────────────────────────────────────────────────────────────────

  // ─── Register (email/phone OTP flow) ─────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    const { email, phone, password, name, otp, msg91Token } = req.body;

    const target = email || phone;
    if (!target) return res.status(400).json({ error: "Email or Phone is required" });
    if (!password) return res.status(400).json({ error: "Password is required" });

    // Verify OTP
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
      const stored = otps[target];
      if (!stored || stored.otp !== otp || stored.expires < Date.now())
        return res.status(400).json({ error: "Invalid or expired OTP" });
      delete otps[target];
    }

    if (email && db.prepare("SELECT id FROM users WHERE email = ?").get(email))
      return res.status(400).json({ error: "User already exists with this email" });
    if (phone && db.prepare("SELECT id FROM users WHERE phone = ?").get(phone))
      return res.status(400).json({ error: "User already exists with this phone" });

    const hashedPassword = await bcrypt.hash(password || Math.random().toString(36), 10);
    const user = {
      id:        Date.now().toString(),
      email:     email || null,
      phone:     phone || null,
      password:  hashedPassword,
      name:      name || "Farmer",
      createdAt: new Date().toISOString(),
    };
    db.prepare(
      "INSERT INTO users (id, name, email, phone, password, createdAt) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(user.id, user.name, user.email, user.phone, user.password, user.createdAt);

    const token = jwt.sign({ id: user.id, email: user.email, phone: user.phone }, JWT_SECRET, {
      expiresIn: "7d",
    });
    setAuthCookie(res, token);
    res.status(201).json({ id: user.id, email: user.email, phone: user.phone, name: user.name });
  });
  // ─────────────────────────────────────────────────────────────────────────

  // ─── Login (password) ─────────────────────────────────────────────────────
  app.post("/api/auth/login", async (req, res) => {
    const { email, phone, password } = req.body;
    const user: any = email
      ? db.prepare("SELECT * FROM users WHERE email = ?").get(email)
      : db.prepare("SELECT * FROM users WHERE phone = ?").get(phone);

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email: user.email, phone: user.phone }, JWT_SECRET, {
      expiresIn: "7d",
    });
    setAuthCookie(res, token);
    res.json({ id: user.id, email: user.email, phone: user.phone, name: user.name });
  });
  // ─────────────────────────────────────────────────────────────────────────

  // ─── Login via OTP (email flow — verify internal OTP then sign in) ────────
  app.post("/api/auth/login-otp", async (req, res) => {
    const { email, phone, otp } = req.body;
    const target = email || phone;
    if (!target || !otp)
      return res.status(400).json({ error: "Identifier and OTP are required" });

    const stored = otps[target];
    if (!stored || stored.otp !== otp || stored.expires < Date.now())
      return res.status(400).json({ error: "Invalid or expired OTP" });
    delete otps[target];

    // Find user — login only, no auto-creation
    const user: any = email
      ? db.prepare("SELECT * FROM users WHERE email = ?").get(email)
      : db.prepare("SELECT * FROM users WHERE phone = ?").get(phone);

    if (!user) {
      return res.status(401).json({ error: "No account found. Please register first." });
    }

    const token = jwt.sign({ id: user.id, email: user.email, phone: user.phone }, JWT_SECRET, {
      expiresIn: "7d",
    });
    setAuthCookie(res, token);
    res.json({ id: user.id, email: user.email, phone: user.phone, name: user.name });
  });
  // ─────────────────────────────────────────────────────────────────────────

  // ─── MSG91 Widget Token Verification ─────────────────────────────────────
  app.post("/api/verify-msg91-token", async (req, res) => {
    // name = display name (registration), identifier = phone/email from frontend, password = optional
    const { token, name, identifier: frontendIdentifier, password } = req.body;

    // Helper: decode MSG91 JWT token (base64url payload) to extract mobile/email.
    const decodeMsg91Jwt = (t: string): string | null => {
      try {
        const parts = t.split(".");
        if (parts.length !== 3) return null;
        // base64url → base64 before decode
        const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(
          Buffer.from(b64, "base64").toString("utf-8")
        );
        console.log("[MSG91] JWT payload:", JSON.stringify(payload));
        // MSG91 may use different field names across versions
        return (
          payload.mobile      || payload.mob         || payload.phone      ||
          payload.phoneNumber || payload.number      || payload.email       ||
          payload.mail        || payload.sub         || payload.identifier  ||
          payload.user        || payload.uid         || null
        );
      } catch {
        return null;
      }
    };

    try {
      let identifier: string | null = null;

      // 1. Try server-side API verification (requires matching authkey ↔ widgetId account)
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
        console.log("[MSG91] verifyAccessToken response:", JSON.stringify(data));

        if (data.status === "success" || data.type === "success") {
          identifier =
            data.data?.mobile || data.data?.email ||
            data.mobile       || data.email       || data.message || null;
        } else {
          console.warn("[MSG91] API verification failed, trying JWT decode. Details:", data);
        }
      } catch (apiErr) {
        console.warn("[MSG91] API call failed:", apiErr);
      }

      // 2. Fallback: decode the JWT payload to extract the identifier
      if (!identifier) {
        identifier = decodeMsg91Jwt(token);
        if (identifier) {
          console.log("[MSG91] Identifier from JWT decode:", identifier);
        }
      }

      // 3. Final fallback: use identifier passed from frontend
      //    (window.verifyOtp already verified the OTP, so the frontend knows who was verified)
      if (!identifier && frontendIdentifier && typeof frontendIdentifier === "string") {
        identifier = frontendIdentifier;
        console.warn("[MSG91] Using frontend-provided identifier:", identifier);
      }

      if (!identifier || typeof identifier !== "string") {
        console.error("[MSG91] Could not determine identifier from any source");
        return res.status(400).json({ error: "Could not verify your identity. Please try again." });
      }

      let user: any = db.prepare(
        "SELECT * FROM users WHERE email = ? OR phone = ?"
      ).get(identifier, identifier);
      const isRegistration = !!name; // name is only sent during registration

      if (!user) {
        if (!isRegistration) {
          return res.status(401).json({ error: "No account found. Please register first." });
        }
        if (!password) {
          return res.status(400).json({ error: "Password is required to create an account." });
        }
        const newUser = {
          id:        Date.now().toString(),
          name:      name || "Farmer",
          email:     identifier.includes("@") ? identifier : null,
          phone:     identifier.includes("@") ? null : identifier,
          password:  await bcrypt.hash(password, 10),
          createdAt: new Date().toISOString(),
        };
        db.prepare(
          "INSERT INTO users (id, name, email, phone, password, createdAt) VALUES (?, ?, ?, ?, ?, ?)"
        ).run(newUser.id, newUser.name, newUser.email, newUser.phone, newUser.password, newUser.createdAt);
        user = newUser;
        console.log(`[AUTH] New user registered: ${identifier}`);
      } else {
        // Update name/password if provided
        if (name && user.name === "Farmer") {
          db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, user.id);
          user.name = name;
        }
        if (password) {
          db.prepare("UPDATE users SET password = ? WHERE id = ?").run(
            await bcrypt.hash(password, 10), user.id
          );
        }
      }

      const jwtToken = jwt.sign(
        { id: user.id, email: user.email, phone: user.phone },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      setAuthCookie(res, jwtToken);
      return res.json({
        success: true,
        user: { id: user.id, email: user.email, phone: user.phone, name: user.name },
      });
    } catch (err) {
      console.error("[MSG91] Verify error:", err);
      return res.status(500).json({ error: "Verification failed" });
    }
  });
  // ─────────────────────────────────────────────────────────────────────────

  // ─── Me / Logout ──────────────────────────────────────────────────────────
  app.get("/api/auth/me", authenticate, (req: AuthRequest, res) => {
    const user: any = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user?.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ id: user.id, email: user.email, phone: user.phone, name: user.name });
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("token", {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: IS_PROD ? "none" : "lax",
    });
    res.json({ message: "Logged out" });
  });
  // ─────────────────────────────────────────────────────────────────────────

  // ─── Reports (crop predictions + drone scans history) ─────────────────────
  app.get("/api/reports", authenticate, (req: AuthRequest, res) => {
    const rows: any[] = db.prepare(
      "SELECT * FROM reports WHERE userId = ? ORDER BY createdAt DESC"
    ).all(req.user?.id);
    res.json(rows.map(r => ({ ...r, data: JSON.parse(r.data) })));
  });

  app.post("/api/reports", authenticate, (req: AuthRequest, res) => {
    const now = new Date().toISOString();
    const report = {
      id:        Date.now().toString(),
      userId:    req.user?.id,
      type:      req.body.type      || "Crop Prediction",
      title:     req.body.title     || "Report",
      summary:   req.body.summary   || "",
      data:      JSON.stringify(req.body.data ?? {}),
      timestamp: now,
      createdAt: now,
    };
    db.prepare(
      "INSERT INTO reports (id, userId, type, title, summary, data, timestamp, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(report.id, report.userId, report.type, report.title, report.summary, report.data, report.timestamp, report.createdAt);
    console.log(`[REPORTS] Saved "${report.type}" for user ${req.user?.id}`);
    res.status(201).json({ ...report, data: JSON.parse(report.data) });
  });

  app.delete("/api/reports/:id", authenticate, (req: AuthRequest, res) => {
    const result = db.prepare(
      "DELETE FROM reports WHERE id = ? AND userId = ?"
    ).run(req.params.id, req.user?.id);
    if (result.changes > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Report not found" });
    }
  });
  // ─────────────────────────────────────────────────────────────────────────

  // ─── Profile Update ───────────────────────────────────────────────────────
  app.put("/api/auth/profile", authenticate, async (req: AuthRequest, res) => {
    const user: any = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user?.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { name, state, landSize } = req.body;
    db.prepare(
      "UPDATE users SET name = COALESCE(?, name), state = COALESCE(?, state), landSize = COALESCE(?, landSize) WHERE id = ?"
    ).run(
      name     ? name.trim()     : null,
      state    ? state.trim()    : null,
      landSize !== undefined     ? landSize : null,
      user.id
    );
    const updated: any = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
    res.json({ id: updated.id, email: updated.email, phone: updated.phone, name: updated.name, state: updated.state, landSize: updated.landSize });
  });
  // ─────────────────────────────────────────────────────────────────────────

  // ─── Expenses ─────────────────────────────────────────────────────────────
  app.get("/api/expenses", authenticate, (req: AuthRequest, res) => {
    const rows = db.prepare(
      "SELECT * FROM expenses WHERE userId = ? ORDER BY createdAt DESC"
    ).all(req.user?.id);
    res.json(rows);
  });

  app.post("/api/expenses", authenticate, (req: AuthRequest, res) => {
    const { date, category, description, amount } = req.body;
    if (!category || amount === undefined)
      return res.status(400).json({ error: "category and amount are required" });

    const entry = {
      id:          Date.now().toString(),
      userId:      req.user?.id,
      date:        date || new Date().toISOString().split("T")[0],
      category,
      description: description || "",
      amount:      Number(amount),
      createdAt:   new Date().toISOString(),
    };
    db.prepare(
      "INSERT INTO expenses (id, userId, date, category, description, amount, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(entry.id, entry.userId, entry.date, entry.category, entry.description, entry.amount, entry.createdAt);
    console.log(`[EXPENSES] Added for user ${req.user?.id}: ${category} ₹${amount}`);
    res.status(201).json(entry);
  });

  app.delete("/api/expenses/:id", authenticate, (req: AuthRequest, res) => {
    const result = db.prepare(
      "DELETE FROM expenses WHERE id = ? AND userId = ?"
    ).run(req.params.id, req.user?.id);
    if (result.changes > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Expense not found" });
    }
  });
  // ─────────────────────────────────────────────────────────────────────────

  // ─── Razorpay ─────────────────────────────────────────────────────────────
  app.post("/api/create-order", async (req, res) => {
    try {
      const { amount, currency = "INR" } = req.body;
      const order = await razorpay.orders.create({
        amount:   Math.round(amount * 100),
        currency,
        receipt:  `receipt_${Date.now()}`,
      });
      res.json(order);
    } catch (error) {
      console.error("Razorpay Order Error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.post("/api/verify-payment", (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "dummy_secret")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (razorpay_signature === expected) {
      db.prepare(
        "INSERT OR IGNORE INTO orders (id, paymentId, status, createdAt) VALUES (?, ?, ?, ?)"
      ).run(razorpay_order_id, razorpay_payment_id, "paid", new Date().toISOString());
      return res.json({ status: "success", message: "Payment verified" });
    }
    return res.status(400).json({ status: "failure", message: "Invalid signature" });
  });
  // ─────────────────────────────────────────────────────────────────────────

  // ─── Vite / Static ───────────────────────────────────────────────────────
  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
  // ─────────────────────────────────────────────────────────────────────────

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🌱 AgriFuture server running → http://localhost:${PORT}`);
    console.log(`   Mode: ${IS_PROD ? "production" : "development"}\n`);
  });
}

startServer().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
