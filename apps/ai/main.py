"""OrionOps AI Service -- FastAPI application entry point.

Initialises the FastAPI app with CORS middleware, OpenTelemetry
instrumentation, health-check and model-info endpoints, and mounts
all feature routers.
"""

from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager
from datetime import datetime
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.schemas import HealthResponse, HealthStatus, ModelInfo, ModelsResponse
from routers import anomaly, classification, root_cause, similarity

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("orionops-ai")

# ---------------------------------------------------------------------------
# OpenTelemetry (graceful fallback when not configured)
# ---------------------------------------------------------------------------

_otel_enabled = False
try:
    from opentelemetry import trace
    from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import (
        OTLPSpanExporter,
    )
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    from opentelemetry.sdk.resources import Resource
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor

    def _setup_telemetry(app: FastAPI) -> None:
        """Configure OpenTelemetry tracing for the application."""
        resource = Resource.create(
            {"service.name": "orionops-ai", "service.version": "1.0.0"}
        )
        provider = TracerProvider(resource=resource)
        exporter = OTLPSpanExporter()
        provider.add_span_processor(BatchSpanProcessor(exporter))
        trace.set_tracer_provider(provider)
        FastAPIInstrumentor.instrument_app(app)

    _otel_enabled = True
    logger.info("OpenTelemetry instrumentation is available")
except ImportError:
    def _setup_telemetry(app: FastAPI) -> None:  # type: ignore[misc]
        """No-op when OpenTelemetry packages are not installed."""

    logger.warning(
        "OpenTelemetry packages not found -- tracing is disabled"
    )


# ---------------------------------------------------------------------------
# Application lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage startup / shutdown lifecycle events."""
    logger.info("OrionOps AI Service starting up")
    yield
    logger.info("OrionOps AI Service shutting down")


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title="OrionOps AI Service",
    description=(
        "AI-powered microservice for incident classification, anomaly detection, "
        "root-cause analysis, and ticket similarity within the OrionOps platform."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenTelemetry instrumentation
_setup_telemetry(app)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(classification.router)
app.include_router(anomaly.router)
app.include_router(root_cause.router)
app.include_router(similarity.router)


# ---------------------------------------------------------------------------
# Health & Info endpoints
# ---------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse, tags=["health"])
def health_check() -> HealthResponse:
    """Return the service health status."""
    return HealthResponse(
        status=HealthStatus.HEALTHY,
        service="orionops-ai",
        version="1.0.0",
        timestamp=datetime.utcnow(),
    )


@app.get("/api/v1/ai/models", response_model=ModelsResponse, tags=["models"])
def list_models() -> ModelsResponse:
    """Return metadata for all AI models / services available."""
    return ModelsResponse(
        models=[
            ModelInfo(
                name="Incident Classifier",
                version="1.0.0",
                description="TF-IDF + keyword based incident category and priority classifier",
                type="classifier",
                accuracy=0.87,
            ),
            ModelInfo(
                name="Anomaly Detector",
                version="1.0.0",
                description="Statistical anomaly detection using z-score and IQR methods",
                type="detector",
                accuracy=None,
            ),
            ModelInfo(
                name="Root Cause Analyser",
                version="1.0.0",
                description="Pattern matching and similarity-based root cause suggestion",
                type="analyser",
                accuracy=0.78,
            ),
            ModelInfo(
                name="Ticket Similarity Engine",
                version="1.0.0",
                description="TF-IDF + cosine similarity ticket matching",
                type="similarity",
                accuracy=0.91,
            ),
        ]
    )


# ---------------------------------------------------------------------------
# Entry point (for ``python -m main`` or direct execution)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
