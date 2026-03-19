/**
 * Frontend Prediction API Service
 * =================================
 * Calls Node.js → FastAPI ML endpoints for crop and disease predictions.
 */

export interface CropInput {
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
}

export interface CropResult {
  predicted_crop: string;
  confidence: number;
  top_3: { crop: string; confidence: number }[];
}

export interface DiseaseResult {
  disease: string;
  confidence: number;
  top_3: { disease: string; confidence: number }[];
}

// ─── Crop Recommendation ─────────────────────────────────────────────────────
export async function getCropRecommendation(input: CropInput): Promise<CropResult> {
  const res = await fetch("/api/predict/crop", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Crop prediction failed");
  }

  return res.json();
}

// ─── Disease Detection ───────────────────────────────────────────────────────
export async function detectDisease(formData: FormData): Promise<DiseaseResult> {
  const res = await fetch("/api/predict/disease", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Disease detection failed");
  }

  return res.json();
}
