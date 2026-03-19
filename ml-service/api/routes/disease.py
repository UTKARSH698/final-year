"""Plant disease detection route."""

from fastapi import APIRouter, File, HTTPException, UploadFile

from api.schemas.disease import DiseasePrediction
from api.services.disease_service import disease_service

router = APIRouter()


@router.post("", response_model=DiseasePrediction, summary="Detect plant disease from a leaf image")
async def predict_disease(image: UploadFile = File(..., description="Leaf image (JPEG/PNG)")) -> DiseasePrediction:
    """
    Accepts a plant leaf image upload.
    Returns the detected disease name, confidence, and top-3 predictions.
    """
    # Validate content type
    if image.content_type not in ("image/jpeg", "image/jpg", "image/png", "image/webp"):
        raise HTTPException(status_code=400, detail="Only JPEG/PNG/WebP images are accepted.")

    # Limit file size to 10MB
    image_bytes = await image.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large. Max 10MB.")

    try:
        result = disease_service.predict(image_bytes)
        return DiseasePrediction(**result)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")
