"""Root cause suggestion router.

Exposes the POST /api/v1/ai/root-cause/suggest endpoint that analyses
incident details and optionally related incidents to propose root causes.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status

from models.schemas import RootCauseRequest, RootCauseResponse
from services.similarity import suggest_root_causes

router = APIRouter(prefix="/api/v1/ai/root-cause", tags=["root-cause-analysis"])

logger = logging.getLogger(__name__)


@router.post(
    "/suggest",
    response_model=RootCauseResponse,
    summary="Suggest root causes for an incident",
    status_code=status.HTTP_200_OK,
)
def suggest(request: RootCauseRequest) -> RootCauseResponse:
    """Analyse an incident and optionally related incidents to suggest root causes.

    Uses pattern matching against a catalogue of common ITSM root-cause
    categories, boosted by similarity to historical incidents.
    """
    try:
        result = suggest_root_causes(request)
        logger.info(
            "Root-cause analysis for incident %s: %d suggestions in %.2f ms",
            request.incident_id,
            len(result.suggestions),
            result.processing_time_ms,
        )
        return result
    except Exception as exc:
        logger.exception("Root-cause analysis failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Root-cause analysis error: {exc}",
        ) from exc
