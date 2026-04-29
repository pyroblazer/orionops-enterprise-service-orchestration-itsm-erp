"""Anomaly detection router.

Exposes the POST /api/v1/ai/anomaly/detect endpoint for identifying
statistical anomalies in metric time-series data.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status

from models.schemas import AnomalyDetectionRequest, AnomalyDetectionResponse
from services.anomaly_detector import detect_anomalies

router = APIRouter(prefix="/api/v1/ai/anomaly", tags=["anomaly-detection"])

logger = logging.getLogger(__name__)


@router.post(
    "/detect",
    response_model=AnomalyDetectionResponse,
    summary="Detect anomalies in metric data",
    status_code=status.HTTP_200_OK,
)
def detect(request: AnomalyDetectionRequest) -> AnomalyDetectionResponse:
    """Analyse a sequence of metric data points for anomalies.

    Supports z-score and IQR statistical methods. Returns per-point
    anomaly flags, scores, and the applied threshold.
    """
    try:
        result = detect_anomalies(request)
        logger.info(
            "Anomaly detection complete for metric '%s': %d anomalies out of %d points (%s) in %.2f ms",
            request.metric_name,
            result.anomaly_count,
            len(request.data_points),
            request.method.value,
            result.processing_time_ms,
        )
        return result
    except Exception as exc:
        logger.exception("Anomaly detection failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Anomaly detection error: {exc}",
        ) from exc
