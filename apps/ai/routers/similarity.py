"""Ticket similarity router.

Exposes the POST /api/v1/ai/similarity endpoint that ranks candidate
tickets by their textual similarity to a source ticket.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status

from models.schemas import SimilarityRequest, SimilarityResponse
from services.similarity import find_similar_tickets

router = APIRouter(prefix="/api/v1/ai", tags=["similarity"])

logger = logging.getLogger(__name__)


@router.post(
    "/similarity",
    response_model=SimilarityResponse,
    summary="Find similar tickets",
    status_code=status.HTTP_200_OK,
)
def find_similar(request: SimilarityRequest) -> SimilarityResponse:
    """Find tickets similar to the source ticket from a candidate pool.

    Uses TF-IDF vectorisation and cosine similarity to rank candidates.
    Returns up to *top_k* results ordered by descending similarity score.
    """
    try:
        result = find_similar_tickets(request)
        logger.info(
            "Similarity search: %d results from %d candidates in %.2f ms",
            len(result.similar_tickets),
            len(request.candidate_tickets),
            result.processing_time_ms,
        )
        return result
    except Exception as exc:
        logger.exception("Similarity search failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Similarity search error: {exc}",
        ) from exc
