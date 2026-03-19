"""Pydantic schemas for disease detection endpoints."""

from pydantic import BaseModel, Field


class DiseasePrediction(BaseModel):
    disease:    str   = Field(..., description="Predicted disease class name")
    confidence: float = Field(..., description="Confidence score 0–1")
    top_3:      list[dict] = Field(..., description="Top 3 predictions with confidence")
