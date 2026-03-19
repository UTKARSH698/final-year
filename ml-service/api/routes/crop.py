"""Crop recommendation route."""

from fastapi import APIRouter, HTTPException

from api.schemas.crop import CropInput, CropPrediction
from api.services.crop_service import crop_service

router = APIRouter()


@router.post("", response_model=CropPrediction, summary="Recommend a crop based on soil + climate")
def predict_crop(body: CropInput) -> CropPrediction:
    """
    Accepts soil nutrients and climate features.
    Returns the recommended crop, confidence score, and top-3 suggestions.
    """
    try:
        result = crop_service.predict(
            N=body.N, P=body.P, K=body.K,
            temperature=body.temperature,
            humidity=body.humidity,
            ph=body.ph,
            rainfall=body.rainfall,
        )
        return CropPrediction(**result)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")
