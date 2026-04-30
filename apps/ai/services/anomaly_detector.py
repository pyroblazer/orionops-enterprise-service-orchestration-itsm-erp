"""Statistical anomaly detection using z-score and IQR methods.

Provides stateless helper functions that operate on a list of float
metric values and return anomaly scores, flags, and threshold metadata.
"""

from __future__ import annotations

import time
from typing import Optional

import numpy as np

from models.schemas import (
    AnomalyDetectionRequest,
    AnomalyDetectionResponse,
    AnomalyMethod,
    AnomalyResult,
)


# ---------------------------------------------------------------------------
# Default thresholds
# ---------------------------------------------------------------------------

_DEFAULT_Z_SCORE_THRESHOLD = 3.0
_DEFAULT_IQR_MULTIPLIER = 1.5


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------

def detect_anomalies(request: AnomalyDetectionRequest) -> AnomalyDetectionResponse:
    """Run anomaly detection over the provided metric data.

    Parameters
    ----------
    request:
        Metric data, method, and optional threshold override.

    Returns
    -------
    AnomalyDetectionResponse
        Per-point anomaly flags with scores and the global threshold.
    """
    start = time.perf_counter()

    values = np.array([dp.value for dp in request.data_points], dtype=np.float64)
    timestamps = [dp.timestamp for dp in request.data_points]

    if request.method == AnomalyMethod.Z_SCORE:
        scores, threshold = _z_score_analysis(values, request.threshold)
    else:
        scores, threshold = _iqr_analysis(values, request.threshold)

    anomalies: list[AnomalyResult] = []
    for i, (ts, val, score) in enumerate(zip(timestamps, values, scores)):
        anomalies.append(
            AnomalyResult(
                timestamp=ts,
                value=float(val),
                score=round(float(score), 6),
                is_anomaly=bool(abs(score) > threshold),
                threshold=threshold,
            )
        )

    anomaly_count = sum(1 for a in anomalies if a.is_anomaly)
    elapsed_ms = (time.perf_counter() - start) * 1000

    return AnomalyDetectionResponse(
        metric_name=request.metric_name,
        method=request.method,
        anomaly_count=anomaly_count,
        anomalies=anomalies,
        global_threshold=threshold,
        processing_time_ms=round(elapsed_ms, 2),
    )


# ---------------------------------------------------------------------------
# Z-Score
# ---------------------------------------------------------------------------

def _z_score_analysis(
    values: np.ndarray,
    threshold_override: Optional[float],
) -> tuple[np.ndarray, float]:
    """Compute modified z-scores (median-based) for robustness.

    Returns
    -------
    tuple[np.ndarray, float]
        Z-score array and the applied threshold.
    """
    median = np.median(values)
    mad = np.median(np.abs(values - median))
    # 0.6745 scales MAD to be consistent with standard deviation for normal data
    mad_scaled = mad * 0.6745
    if mad_scaled == 0:
        mad_scaled = 1e-10  # avoid division by zero for constant series

    z_scores = (values - median) / mad_scaled
    threshold = threshold_override or _DEFAULT_Z_SCORE_THRESHOLD
    return z_scores, threshold


# ---------------------------------------------------------------------------
# IQR
# ---------------------------------------------------------------------------

def _iqr_analysis(
    values: np.ndarray,
    multiplier_override: Optional[float],
) -> tuple[np.ndarray, float]:
    """Compute anomaly scores based on the Interquartile Range method.

    The *score* returned for each point is the number of IQR-multipliers
    it lies beyond the fence boundary (0 if inside).

    Returns
    -------
    tuple[np.ndarray, float]
        Score array and the applied IQR multiplier (used as threshold).
    """
    q1 = float(np.percentile(values, 25))
    q3 = float(np.percentile(values, 75))
    iqr = q3 - q1
    if iqr == 0:
        iqr = 1e-10

    multiplier = multiplier_override or _DEFAULT_IQR_MULTIPLIER
    lower_fence = q1 - multiplier * iqr
    upper_fence = q3 + multiplier * iqr

    scores = np.zeros_like(values, dtype=np.float64)
    for i, v in enumerate(values):
        if v < lower_fence:
            scores[i] = abs(v - lower_fence) / iqr
        elif v > upper_fence:
            scores[i] = abs(v - upper_fence) / iqr
        # else: score remains 0

    return scores, multiplier
