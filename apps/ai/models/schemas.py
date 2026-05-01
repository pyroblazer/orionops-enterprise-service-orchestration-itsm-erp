"""Pydantic models for all AI service request and response types."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class IncidentCategory(str, Enum):
    """Standard ITSM incident categories."""

    HARDWARE = "hardware"
    SOFTWARE = "software"
    NETWORK = "network"
    SECURITY = "security"
    DATABASE = "database"
    EMAIL = "email"
    APPLICATION = "application"
    ACCESS = "access"
    PERFORMANCE = "performance"
    OTHER = "other"


class IncidentPriority(str, Enum):
    """ITSM incident priority levels."""

    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class AnomalyMethod(str, Enum):
    """Supported anomaly detection methods."""

    Z_SCORE = "z_score"
    IQR = "iqr"


class HealthStatus(str, Enum):
    """Service health status."""

    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


# ---------------------------------------------------------------------------
# Health / Info
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    """Response schema for the health-check endpoint."""

    status: HealthStatus = HealthStatus.HEALTHY
    service: str = "orionops-ai"
    version: str = Field(default="1.0.0", description="Service semantic version")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ModelInfo(BaseModel):
    """Metadata about a single AI model / service."""

    name: str = Field(..., description="Human-readable model name")
    version: str = Field(..., description="Model version string")
    description: str = Field(..., description="Short description of the model")
    type: str = Field(..., description="Model type (e.g. classifier, detector)")
    accuracy: Optional[float] = Field(default=None, description="Reported accuracy metric")


class ModelsResponse(BaseModel):
    """Response listing all available AI models."""

    models: list[ModelInfo] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Classification
# ---------------------------------------------------------------------------

class ClassificationRequest(BaseModel):
    """Request schema for incident classification."""

    title: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Incident title / summary",
    )
    description: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Detailed incident description",
    )
    additional_context: Optional[dict[str, Any]] = Field(
        default=None,
        description="Optional key-value context (e.g. affected_ci, reporter_role)",
    )


class CategoryPrediction(BaseModel):
    """A single category prediction with confidence score."""

    category: IncidentCategory
    subcategory: str = Field(..., description="Granular subcategory label")
    confidence: float = Field(..., ge=0.0, le=1.0)


class ClassificationResponse(BaseModel):
    """Response schema for incident classification."""

    predicted_category: IncidentCategory
    predicted_subcategory: str
    predicted_priority: IncidentPriority
    confidence: float = Field(..., ge=0.0, le=1.0, description="Top prediction confidence")
    predictions: list[CategoryPrediction] = Field(
        ...,
        min_length=1,
        max_length=3,
        description="Top-N predictions ordered by confidence",
    )
    processing_time_ms: float = Field(..., description="Inference latency in ms")


# ---------------------------------------------------------------------------
# Anomaly Detection
# ---------------------------------------------------------------------------

class MetricDataPoint(BaseModel):
    """A single metric observation."""

    timestamp: datetime
    value: float
    label: Optional[str] = Field(default=None, description="Optional metric name / tag")


class AnomalyDetectionRequest(BaseModel):
    """Request schema for anomaly detection."""

    metric_name: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Name of the metric being analysed",
    )
    data_points: list[MetricDataPoint] = Field(
        ...,
        min_length=3,
        description="Observed data points (minimum 3 required)",
    )
    method: AnomalyMethod = Field(
        default=AnomalyMethod.Z_SCORE,
        description="Statistical method to use",
    )
    threshold: Optional[float] = Field(
        default=None,
        description="Override default anomaly threshold",
    )


class AnomalyResult(BaseModel):
    """A single detected anomaly."""

    timestamp: datetime
    value: float
    score: float = Field(..., description="Anomaly score (higher = more anomalous)")
    is_anomaly: bool
    threshold: float = Field(..., description="Threshold used for this data point")


class AnomalyDetectionResponse(BaseModel):
    """Response schema for anomaly detection."""

    metric_name: str
    method: AnomalyMethod
    anomaly_count: int = Field(..., description="Total anomalies detected")
    anomalies: list[AnomalyResult] = Field(default_factory=list)
    global_threshold: float = Field(..., description="Threshold applied across the series")
    processing_time_ms: float


# ---------------------------------------------------------------------------
# Root Cause Analysis
# ---------------------------------------------------------------------------

class RelatedIncident(BaseModel):
    """A previously observed incident relevant to the current analysis."""

    incident_id: str
    title: str
    category: Optional[str] = None
    resolution: Optional[str] = None
    similarity: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Similarity score to the current incident",
    )


class RootCauseRequest(BaseModel):
    """Request schema for root-cause suggestion."""

    incident_id: str = Field(..., description="Identifier of the current incident")
    title: str = Field(..., min_length=1, max_length=500)
    description: str = Field(..., min_length=1, max_length=10000)
    category: Optional[str] = None
    related_incidents: list[RelatedIncident] = Field(default_factory=list)
    context: Optional[dict[str, Any]] = None


class RootCauseSuggestion(BaseModel):
    """A single suggested root cause."""

    cause: str = Field(..., description="Human-readable root cause description")
    confidence: float = Field(..., ge=0.0, le=1.0)
    supporting_evidence: list[str] = Field(default_factory=list)
    related_incident_ids: list[str] = Field(default_factory=list)
    recommended_actions: list[str] = Field(default_factory=list)


class RootCauseResponse(BaseModel):
    """Response schema for root-cause analysis."""

    incident_id: str
    suggestions: list[RootCauseSuggestion] = Field(default_factory=list)
    processing_time_ms: float


# ---------------------------------------------------------------------------
# Similarity
# ---------------------------------------------------------------------------

class TicketData(BaseModel):
    """A ticket to compare against the knowledge base."""

    ticket_id: Optional[str] = Field(default=None, description="Optional ticket identifier")
    title: str = Field(..., min_length=1, max_length=500)
    description: str = Field(..., min_length=1, max_length=10000)


class SimilarTicket(BaseModel):
    """A ticket identified as similar."""

    ticket_id: str
    title: str
    description: str
    category: Optional[str] = None
    status: Optional[str] = None
    similarity_score: float = Field(..., ge=0.0, le=1.0)


class SimilarityRequest(BaseModel):
    """Request schema for ticket similarity search."""

    ticket: TicketData = Field(..., description="Source ticket to match")
    candidate_tickets: list[TicketData] = Field(
        ...,
        min_length=1,
        description="Pool of candidate tickets to search",
    )
    top_k: int = Field(default=5, ge=1, le=50, description="Max results to return")


class SimilarityResponse(BaseModel):
    """Response schema for ticket similarity search."""

    source_ticket_id: Optional[str] = None
    similar_tickets: list[SimilarTicket] = Field(default_factory=list)
    processing_time_ms: float
