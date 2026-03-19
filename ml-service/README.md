# AgriFuture ML Service

Python FastAPI microservice providing crop recommendation and plant disease detection.

## Architecture

```
React Frontend
      │
      ▼
Node.js Backend  ──► Gemini API  (chatbot + explanations)
      │
      ▼
FastAPI ML Service  (this service)
  ├── POST /predict-crop     → Random Forest / XGBoost
  └── POST /predict-disease  → MobileNetV2
```

## Folder Structure

```
ml-service/
├── training/
│   ├── train_crop.py          # Train RF + XGBoost on soil/climate data
│   ├── train_disease.py       # Train MobileNetV2 on PlantVillage
│   └── data/                  # Place datasets here (gitignored)
│       ├── Crop_recommendation.csv
│       └── plantvillage/      # PlantVillage extracted here
├── api/
│   ├── main.py                # FastAPI app + lifespan model loading
│   ├── routes/
│   │   ├── crop.py            # POST /predict-crop
│   │   └── disease.py         # POST /predict-disease
│   ├── schemas/
│   │   ├── crop.py            # Pydantic input/output models
│   │   └── disease.py
│   └── services/
│       ├── crop_service.py    # Loads + runs crop model
│       └── disease_service.py # Loads + runs disease model
├── models/                    # Saved models (gitignored, created after training)
│   ├── crop_model.joblib
│   ├── crop_scaler.joblib
│   ├── crop_label_encoder.joblib
│   ├── crop_metadata.json
│   ├── disease_model.keras
│   └── disease_metadata.json
├── requirements.txt
├── Dockerfile
└── .env.example
```

## Setup

### 1. Create virtual environment

```bash
cd ml-service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Download datasets

**Crop Recommendation:**
- Download from: https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset
- Place at: `training/data/Crop_recommendation.csv`

**PlantVillage (for disease detection):**
- Download from: https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset
- Extract so structure is: `training/data/plantvillage/<ClassName>/image.jpg`

### 3. Train models

```bash
# Train crop recommendation model
python -m training.train_crop

# Train disease detection model (needs GPU recommended, ~30min on CPU)
python -m training.train_disease
```

Both scripts print accuracy and save to `models/`.

### 4. Start the service

```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

API docs available at: http://localhost:8000/docs

---

## API Reference

### `POST /predict-crop`

```json
// Request
{
  "N": 90, "P": 42, "K": 43,
  "temperature": 20.8, "humidity": 82.0,
  "ph": 6.5, "rainfall": 202.9
}

// Response
{
  "predicted_crop": "rice",
  "confidence": 0.96,
  "top_3": [
    { "crop": "rice",   "confidence": 0.96 },
    { "crop": "maize",  "confidence": 0.02 },
    { "crop": "jute",   "confidence": 0.01 }
  ]
}
```

### `POST /predict-disease`

```
Content-Type: multipart/form-data
Field: image (JPEG/PNG, max 10MB)
```

```json
// Response
{
  "disease": "Tomato___Early_blight",
  "confidence": 0.92,
  "top_3": [
    { "disease": "Tomato___Early_blight",  "confidence": 0.92 },
    { "disease": "Tomato___Late_blight",   "confidence": 0.05 },
    { "disease": "Tomato___healthy",       "confidence": 0.02 }
  ]
}
```

### `GET /health`

```json
{
  "status": "ok",
  "crop_model_loaded": true,
  "disease_model_loaded": true
}
```

---

## Docker

```bash
docker build -t agrifuture-ml .
docker run -p 8000:8000 -v $(pwd)/models:/app/models agrifuture-ml
```

## Add to Node.js .env

```env
ML_SERVICE_URL=http://localhost:8000
```
