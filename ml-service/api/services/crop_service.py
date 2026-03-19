"""
Crop Prediction Service
========================
Loads the trained Random Forest / XGBoost model and provides
a predict() method used by the crop route.
"""

import json
from pathlib import Path
from typing import Optional

import joblib
import numpy as np

MODELS_DIR = Path(__file__).parent.parent.parent / "models"


class CropService:
    def __init__(self):
        self._model  = None
        self._scaler = None
        self._le     = None
        self._meta   = None

    def load(self) -> None:
        """Load model artifacts from disk. Called once at startup."""
        model_path = MODELS_DIR / "crop_model.joblib"
        if not model_path.exists():
            print(f"[WARN] Crop model not found at {model_path}. Run training/train_crop.py first.")
            return

        self._model  = joblib.load(MODELS_DIR / "crop_model.joblib")
        self._scaler = joblib.load(MODELS_DIR / "crop_scaler.joblib")
        self._le     = joblib.load(MODELS_DIR / "crop_label_encoder.joblib")

        with open(MODELS_DIR / "crop_metadata.json") as f:
            self._meta = json.load(f)

        print(f"[INFO] Crop model loaded: {self._meta['model_type']} "
              f"(acc={self._meta['accuracy']})")

    def is_loaded(self) -> bool:
        return self._model is not None

    def predict(self, N: float, P: float, K: float,
                temperature: float, humidity: float,
                ph: float, rainfall: float) -> dict:
        """
        Returns:
          {
            predicted_crop: str,
            confidence: float,
            top_3: [{ crop, confidence }, ...]
          }
        """
        if not self.is_loaded():
            raise RuntimeError("Crop model is not loaded. Run train_crop.py first.")

        features = np.array([[N, P, K, temperature, humidity, ph, rainfall]])
        features_scaled = self._scaler.transform(features)

        # Predicted class
        pred_encoded = self._model.predict(features_scaled)[0]
        predicted_crop = self._le.inverse_transform([pred_encoded])[0]

        # Class probabilities for top-3
        proba = self._model.predict_proba(features_scaled)[0]
        top_indices = np.argsort(proba)[::-1][:3]

        top_3 = [
            {
                "crop":       self._le.inverse_transform([i])[0],
                "confidence": round(float(proba[i]), 4),
            }
            for i in top_indices
        ]

        return {
            "predicted_crop": predicted_crop,
            "confidence":     round(float(proba[pred_encoded]), 4),
            "top_3":          top_3,
        }


# Singleton — shared across requests
crop_service = CropService()
