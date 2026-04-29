"""Incident classification router.

Exposes the POST /api/v1/ai/classify endpoint that predicts the category,
subcategory, and priority of an ITSM incident.
"""

from __future__ import annotations

import logging
from functools import lru_cache

from fastapi import APIRouter, HTTPException, status

from models.schemas import ClassificationRequest, ClassificationResponse
from services.classifier import IncidentClassifier

router = APIRouter(prefix="/api/v1/ai", tags=["classification"])

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _get_classifier() -> IncidentClassifier:
    """Return a singleton classifier instance (cached for the process lifetime)."""
    logger.info("Initialising IncidentClassifier")
    return IncidentClassifier()


@router.post(
    "/classify",
    response_model=ClassificationResponse,
    summary="Classify an incident",
    status_code=status.HTTP_200_OK,
)
def classify_incident(request: ClassificationRequest) -> ClassificationResponse:
    """Classify an incident based on its title and description.

    Returns the predicted category, subcategory, priority, and up to
    three confidence-ranked predictions.
    """
    try:
        classifier = _get_classifier()
        result = classifier.classify(request)
        logger.info(
            "Classified incident as %s/%s (confidence=%.4f) in %.2f ms",
            result.predicted_category,
            result.predicted_subcategory,
            result.confidence,
            result.processing_time_ms,
        )
        return result
    except Exception as exc:
        logger.exception("Classification failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Classification error: {exc}",
        ) from exc
