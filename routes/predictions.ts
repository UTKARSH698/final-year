/**
 * Predictions Route
 * ==================
 * POST /api/predict/crop     → ML crop recommendation
 * POST /api/predict/disease  → ML plant disease detection
 *
 * Flow:
 *   Crop:    React → Node → FastAPI → React
 *   Disease: React → Node → FastAPI → React
 */

import { Router } from "express";
import multer from "multer";
import { predictCrop, predictDisease, CropInput } from "../services/mlService.js";
import { authenticate, AuthRequest } from "../middleware/authenticate.js";

const router = Router();

// Multer: memory storage, 10MB limit, images only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

// ─── POST /api/predict/crop ──────────────────────────────────────────────────
router.post("/crop", authenticate, async (req: AuthRequest, res) => {
  const { N, P, K, temperature, humidity, ph, rainfall } = req.body;

  const fields = { N, P, K, temperature, humidity, ph, rainfall };
  const missing = Object.entries(fields).filter(([, v]) => v === undefined || v === null).map(([k]) => k);
  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
  }

  try {
    const input: CropInput = { N: +N, P: +P, K: +K, temperature: +temperature, humidity: +humidity, ph: +ph, rainfall: +rainfall };
    const prediction = await predictCrop(input);
    res.json(prediction);
  } catch (err: any) {
    console.error("[PREDICT CROP]", err.message);
    res.status(500).json({ error: err.message || "Prediction failed" });
  }
});

// ─── POST /api/predict/disease ───────────────────────────────────────────────
router.post("/disease", authenticate, upload.single("image"), async (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Image file is required" });
  }

  try {
    const result = await predictDisease(req.file.buffer, req.file.mimetype);
    res.json(result);
  } catch (err: any) {
    console.error("[PREDICT DISEASE]", err.message);
    res.status(500).json({ error: err.message || "Disease detection failed" });
  }
});

export default router;
