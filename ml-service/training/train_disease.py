"""
Plant Disease Detection Model Training
=======================================
Dataset  : PlantVillage (38 classes)
           https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset
Model    : MobileNetV2 (transfer learning, frozen base → fine-tuned top layers)
Input    : 224×224 RGB image
Output   : disease class name + confidence score

Training stages:
  1. Feature extraction — base frozen, only top classifier trained (10 epochs)
  2. Fine-tuning       — top 30 base layers unfrozen, lower learning rate (10 epochs)
"""

import json
import sys
from pathlib import Path

import numpy as np

# ─── Paths ──────────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent
MODELS_DIR = ROOT / "models"
MODELS_DIR.mkdir(exist_ok=True)

DATA_DIR = Path(__file__).parent / "data" / "plantvillage"

IMG_SIZE    = 224
BATCH_SIZE  = 32
EPOCHS_FE   = 10   # Feature extraction epochs
EPOCHS_FT   = 10   # Fine-tuning epochs


# ─── Lazy TF import (avoids slow import at module level) ────────────────────
def get_tf():
    try:
        import tensorflow as tf
        return tf
    except ImportError:
        print("[ERROR] TensorFlow not installed. Run: pip install tensorflow")
        sys.exit(1)


# ─── Data pipeline ──────────────────────────────────────────────────────────
def build_datasets(tf):
    if not DATA_DIR.exists():
        print(f"[ERROR] PlantVillage dataset not found at: {DATA_DIR}")
        print("  Download from: https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset")
        print("  Extract so structure is: ml-service/training/data/plantvillage/<ClassName>/img.jpg")
        sys.exit(1)

    # Preprocessing: normalize to [0,1], MobileNetV2 expects [-1,1] via preprocess_input
    preprocess = tf.keras.applications.mobilenet_v2.preprocess_input

    train_ds = tf.keras.utils.image_dataset_from_directory(
        DATA_DIR,
        validation_split=0.2,
        subset="training",
        seed=42,
        image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        DATA_DIR,
        validation_split=0.2,
        subset="validation",
        seed=42,
        image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
    )

    class_names = train_ds.class_names
    num_classes = len(class_names)
    print(f"[INFO] Found {num_classes} classes: {class_names[:5]}...")

    # Apply preprocessing + cache + prefetch for performance
    AUTOTUNE = tf.data.AUTOTUNE

    def apply_preprocess(images, labels):
        return preprocess(images), labels

    # Data augmentation for training
    augment = tf.keras.Sequential([
        tf.keras.layers.RandomFlip("horizontal"),
        tf.keras.layers.RandomRotation(0.1),
        tf.keras.layers.RandomZoom(0.1),
        tf.keras.layers.RandomBrightness(0.1),
    ])

    train_ds = (
        train_ds
        .map(lambda x, y: (augment(x, training=True), y), num_parallel_calls=AUTOTUNE)
        .map(apply_preprocess, num_parallel_calls=AUTOTUNE)
        .cache()
        .prefetch(AUTOTUNE)
    )
    val_ds = (
        val_ds
        .map(apply_preprocess, num_parallel_calls=AUTOTUNE)
        .cache()
        .prefetch(AUTOTUNE)
    )

    return train_ds, val_ds, class_names, num_classes


# ─── Model ──────────────────────────────────────────────────────────────────
def build_model(tf, num_classes: int):
    base = tf.keras.applications.MobileNetV2(
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    base.trainable = False  # Freeze base for feature extraction phase

    inputs = tf.keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
    x = base(inputs, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    x = tf.keras.layers.Dense(256, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.2)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax")(x)

    model = tf.keras.Model(inputs, outputs)
    return model, base


# ─── Training ───────────────────────────────────────────────────────────────
def train(tf, model, base, train_ds, val_ds):
    callbacks = [
        tf.keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=2),
    ]

    # ── Stage 1: Feature extraction ─────────────────────────────────────────
    print("\n[INFO] Stage 1: Feature extraction (base frozen)...")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS_FE, callbacks=callbacks)

    # ── Stage 2: Fine-tuning top 30 base layers ──────────────────────────────
    print("\n[INFO] Stage 2: Fine-tuning top 30 base layers...")
    base.trainable = True
    for layer in base.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-4),  # Lower LR for fine-tuning
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS_FT, callbacks=callbacks)

    return model


# ─── Main ───────────────────────────────────────────────────────────────────
def main():
    tf = get_tf()

    train_ds, val_ds, class_names, num_classes = build_datasets(tf)
    model, base = build_model(tf, num_classes)
    model.summary()

    model = train(tf, model, base, train_ds, val_ds)

    # Evaluate on validation set
    loss, acc = model.evaluate(val_ds)
    print(f"\n[RESULT] Validation accuracy: {acc:.4f}")

    # Save model
    model_path = MODELS_DIR / "disease_model.keras"
    model.save(str(model_path))
    print(f"[INFO] Saved model to {model_path}")

    # Save class names and metadata
    metadata = {
        "model_type":  "MobileNetV2",
        "accuracy":    round(float(acc), 4),
        "input_size":  IMG_SIZE,
        "classes":     class_names,
        "num_classes": num_classes,
    }
    with open(MODELS_DIR / "disease_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"[INFO] Classes ({num_classes}): {class_names[:5]}...")
    print("[DONE] Disease model training complete.")


if __name__ == "__main__":
    main()
