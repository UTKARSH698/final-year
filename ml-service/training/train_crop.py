"""
Crop Recommendation Model Training
===================================
Dataset : Crop Recommendation Dataset (Kaggle)
          https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset
Features : N, P, K, temperature, humidity, pH, rainfall
Target   : crop label (22 classes)

Models trained:
  1. Random Forest
  2. XGBoost
Best model is selected by test accuracy and saved with joblib.
"""

import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from xgboost import XGBClassifier

# ─── Paths ──────────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent
MODELS_DIR = ROOT / "models"
MODELS_DIR.mkdir(exist_ok=True)

DATA_PATH = Path(__file__).parent / "data" / "Crop_recommendation.csv"


# ─── Load & Validate Data ───────────────────────────────────────────────────
def load_data(path: Path) -> pd.DataFrame:
    if not path.exists():
        print(f"[ERROR] Dataset not found at: {path}")
        print("  Download from: https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset")
        print("  Place it at:   ml-service/training/data/Crop_recommendation.csv")
        sys.exit(1)
    df = pd.read_csv(path)
    print(f"[INFO] Loaded {len(df)} rows, columns: {list(df.columns)}")
    return df


# ─── Preprocessing ──────────────────────────────────────────────────────────
def preprocess(df: pd.DataFrame):
    feature_cols = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
    label_col = "label"

    # Validate columns
    missing = [c for c in feature_cols + [label_col] if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns in dataset: {missing}")

    X = df[feature_cols].values
    y = df[label_col].values

    # Encode labels
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    return X_scaled, y_encoded, le, scaler


# ─── Train Models ───────────────────────────────────────────────────────────
def train_random_forest(X_train, y_train) -> RandomForestClassifier:
    print("[INFO] Training Random Forest...")
    rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        min_samples_split=2,
        random_state=42,
        n_jobs=-1,
    )
    rf.fit(X_train, y_train)
    return rf


def train_xgboost(X_train, y_train) -> XGBClassifier:
    print("[INFO] Training XGBoost...")
    xgb = XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        use_label_encoder=False,
        eval_metric="mlogloss",
        random_state=42,
        n_jobs=-1,
    )
    xgb.fit(X_train, y_train)
    return xgb


# ─── Evaluate ───────────────────────────────────────────────────────────────
def evaluate(name: str, model, X_test, y_test, le: LabelEncoder) -> float:
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n[RESULT] {name} accuracy: {acc:.4f}")
    print(classification_report(y_test, y_pred, target_names=le.classes_))
    return acc


# ─── Main ───────────────────────────────────────────────────────────────────
def main():
    df = load_data(DATA_PATH)
    X, y, le, scaler = preprocess(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Train both models
    rf_model = train_random_forest(X_train, y_train)
    xgb_model = train_xgboost(X_train, y_train)

    # Evaluate
    rf_acc  = evaluate("Random Forest", rf_model,  X_test, y_test, le)
    xgb_acc = evaluate("XGBoost",       xgb_model, X_test, y_test, le)

    # Select best
    if rf_acc >= xgb_acc:
        best_model, best_name, best_acc = rf_model, "RandomForest", rf_acc
    else:
        best_model, best_name, best_acc = xgb_model, "XGBoost", xgb_acc

    print(f"\n[INFO] Best model: {best_name} ({best_acc:.4f})")

    # Save artifacts
    joblib.dump(best_model, MODELS_DIR / "crop_model.joblib")
    joblib.dump(scaler,     MODELS_DIR / "crop_scaler.joblib")
    joblib.dump(le,         MODELS_DIR / "crop_label_encoder.joblib")

    # Save metadata (class names + feature order)
    metadata = {
        "model_type":  best_name,
        "accuracy":    round(best_acc, 4),
        "features":    ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"],
        "classes":     list(le.classes_),
        "num_classes": len(le.classes_),
    }
    with open(MODELS_DIR / "crop_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"[INFO] Saved to {MODELS_DIR}/")
    print(f"[INFO] Classes ({len(le.classes_)}): {list(le.classes_)}")


if __name__ == "__main__":
    main()
