"""
AgriFuture ML Microservice
===========================
FastAPI service that exposes ML model predictions.
Node.js backend calls this service for crop + disease predictions.

Endpoints:
  POST /predict-crop     → Random Forest / XGBoost crop recommendation
  POST /predict-disease  → MobileNetV2 plant disease detection
  GET  /health           → Health check + model status
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import crop, disease
from api.services.crop_service import crop_service
from api.services.disease_service import disease_service


# ─── Lifespan: load models once at startup ──────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[INFO] Loading ML models...")
    crop_service.load()
    disease_service.load()
    print("[INFO] Models ready.")
    yield
    print("[INFO] Shutting down.")


# ─── App ────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AgriFuture ML Service",
    description="Hybrid ML microservice for crop recommendation and disease detection",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow calls from Node.js backend (localhost) and production domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000", "*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ─── Routers ────────────────────────────────────────────────────────────────
app.include_router(crop.router,    prefix="/predict-crop",    tags=["Crop"])
app.include_router(disease.router, prefix="/predict-disease", tags=["Disease"])


# ─── Health ─────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "crop_model_loaded":    crop_service.is_loaded(),
        "disease_model_loaded": disease_service.is_loaded(),
    }
