"""
Disease Detection Service
==========================
Loads the trained MobileNetV2 model and provides a predict() method
that accepts a raw image (bytes) and returns disease + confidence.
"""

import io
import json
from pathlib import Path

import numpy as np

MODELS_DIR = Path(__file__).parent.parent.parent / "models"
IMG_SIZE   = 224


class DiseaseService:
    def __init__(self):
        self._model      = None
        self._class_names = None
        self._meta        = None

    def load(self) -> None:
        """Load model artifacts. Called once at startup."""
        model_path = MODELS_DIR / "disease_model.keras"
        if not model_path.exists():
            print(f"[WARN] Disease model not found at {model_path}. Run training/train_disease.py first.")
            return

        # Lazy import — TF is heavy, only import when model exists
        import tensorflow as tf
        self._model = tf.keras.models.load_model(str(model_path))

        with open(MODELS_DIR / "disease_metadata.json") as f:
            self._meta = json.load(f)

        self._class_names = self._meta["classes"]
        print(f"[INFO] Disease model loaded: {self._meta['model_type']} "
              f"({len(self._class_names)} classes, acc={self._meta['accuracy']})")

    def is_loaded(self) -> bool:
        return self._model is not None

    def predict(self, image_bytes: bytes) -> dict:
        """
        Accepts raw image bytes (JPEG/PNG).
        Returns:
          {
            disease: str,
            confidence: float,
            top_3: [{ disease, confidence }, ...]
          }
        """
        if not self.is_loaded():
            raise RuntimeError("Disease model not loaded. Run train_disease.py first.")

        import tensorflow as tf

        # Decode + resize image
        img = tf.image.decode_image(image_bytes, channels=3, expand_animations=False)
        img = tf.image.resize(img, [IMG_SIZE, IMG_SIZE])
        img = tf.keras.applications.mobilenet_v2.preprocess_input(img)
        img = tf.expand_dims(img, 0)  # batch dimension

        # Predict
        preds = self._model.predict(img, verbose=0)[0]  # shape: (num_classes,)

        top_indices = np.argsort(preds)[::-1][:3]

        top_3 = [
            {
                "disease":    self._class_names[i],
                "confidence": round(float(preds[i]), 4),
            }
            for i in top_indices
        ]

        best_idx = top_indices[0]
        return {
            "disease":    self._class_names[best_idx],
            "confidence": round(float(preds[best_idx]), 4),
            "top_3":      top_3,
        }


# Singleton — shared across requests
disease_service = DiseaseService()
