"""Pydantic schemas for crop recommendation endpoints."""

from pydantic import BaseModel, Field


class CropInput(BaseModel):
    N:           float = Field(..., ge=0,  le=200, description="Nitrogen content (kg/ha)")
    P:           float = Field(..., ge=0,  le=200, description="Phosphorous content (kg/ha)")
    K:           float = Field(..., ge=0,  le=300, description="Potassium content (kg/ha)")
    temperature: float = Field(..., ge=0,  le=55,  description="Temperature (°C)")
    humidity:    float = Field(..., ge=0,  le=100, description="Relative humidity (%)")
    ph:          float = Field(..., ge=0,  le=14,  description="Soil pH")
    rainfall:    float = Field(..., ge=0,  le=500, description="Rainfall (mm)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "N": 90, "P": 42, "K": 43,
                "temperature": 20.8, "humidity": 82.0,
                "ph": 6.5, "rainfall": 202.9,
            }
        }
    }


class CropSuggestion(BaseModel):
    crop:       str
    confidence: float = Field(..., description="Confidence score 0–1")


class CropPrediction(BaseModel):
    predicted_crop: str
    confidence:     float
    top_3:          list[CropSuggestion]
