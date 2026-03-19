/**
 * ML Service Client
 * ==================
 * Wraps all HTTP calls to the Python FastAPI ML microservice.
 * Node.js backend uses this to get crop/disease predictions,
 * then optionally passes the result to Gemini for explanation.
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

// ─── Types ──────────────────────────────────────────────────────────────────
export interface CropInput {
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
}

export interface CropSuggestion {
  crop: string;
  confidence: number;
}

export interface CropPrediction {
  predicted_crop: string;
  confidence: number;
  top_3: CropSuggestion[];
}

export interface DiseasePrediction {
  disease: string;
  confidence: number;
  top_3: { disease: string; confidence: number }[];
}

// ─── Crop Recommendation ────────────────────────────────────────────────────
export async function predictCrop(input: CropInput): Promise<CropPrediction> {
  const res = await fetch(`${ML_SERVICE_URL}/predict-crop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `ML service error: ${res.status}`);
  }

  return res.json();
}

// ─── Disease Detection ──────────────────────────────────────────────────────
export async function predictDisease(imageBuffer: Buffer, mimeType: string): Promise<DiseasePrediction> {
  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: mimeType });
  formData.append("image", blob, "leaf.jpg");

  const res = await fetch(`${ML_SERVICE_URL}/predict-disease`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `ML service error: ${res.status}`);
  }

  return res.json();
}

// ─── Health Check ───────────────────────────────────────────────────────────
export async function checkMlHealth(): Promise<{ status: string; crop_model_loaded: boolean; disease_model_loaded: boolean }> {
  const res = await fetch(`${ML_SERVICE_URL}/health`);
  return res.json();
}
