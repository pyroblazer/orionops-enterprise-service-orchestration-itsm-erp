"""Shared test fixtures for the OrionOps AI service test suite."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Generator

import pytest
from fastapi.testclient import TestClient

# Import the FastAPI app -- because tests/ sits one level inside apps/ai/,
# we need a sys.path tweak so ``import main`` resolves to apps/ai/main.py.
import sys
import os

# Ensure the AI service root (apps/ai/) is on sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app  # noqa: E402


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    """Yield a ``TestClient`` wired to the FastAPI application."""
    with TestClient(app) as c:
        yield c


# ---------------------------------------------------------------------------
# Sample data fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def sample_classification_request() -> dict:
    """Return a valid classification request payload."""
    return {
        "title": "VPN tunnel is down and users cannot connect remotely",
        "description": (
            "Since 10:00 AM this morning, the primary VPN tunnel between "
            "office-A and the data centre has been unreachable. Users are "
            "reporting connection timeouts and cannot access internal resources."
        ),
    }


@pytest.fixture()
def sample_metrics() -> list[dict]:
    """Return a list of metric data points (mostly normal, one outlier)."""
    base = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
    points: list[dict] = []
    for i in range(20):
        points.append({
            "timestamp": (base.replace(hour=10, minute=i) if i < 20 else base).isoformat(),
            "value": 50.0 + (i % 5) * 2,  # normal range ~50-58
        })
    # Inject an outlier
    points.append({
        "timestamp": base.replace(hour=10, minute=20).isoformat(),
        "value": 500.0,
    })
    return points


@pytest.fixture()
def sample_anomaly_request(sample_metrics: list[dict]) -> dict:
    """Return a valid anomaly detection request payload."""
    return {
        "metric_name": "cpu_utilization",
        "data_points": sample_metrics,
        "method": "z_score",
    }


@pytest.fixture()
def sample_similarity_request() -> dict:
    """Return a valid similarity search request payload."""
    return {
        "ticket": {
            "ticket_id": "INC-100",
            "title": "Database connection pool exhausted",
            "description": "Application throws 'connection pool exhausted' errors during peak hours.",
        },
        "candidate_tickets": [
            {
                "ticket_id": "INC-200",
                "title": "DB pool size too small",
                "description": "Connection pool running out of connections under load.",
            },
            {
                "ticket_id": "INC-201",
                "title": "Printer jam on 3rd floor",
                "description": "The HP LaserJet on the 3rd floor has a paper jam.",
            },
            {
                "ticket_id": "INC-202",
                "title": "Database slow queries",
                "description": "Several database queries are running slowly causing timeouts.",
            },
        ],
        "top_k": 3,
    }


@pytest.fixture()
def sample_root_cause_request() -> dict:
    """Return a valid root-cause analysis request payload."""
    return {
        "incident_id": "INC-300",
        "title": "Production server CPU spike",
        "description": (
            "The production web server experienced a sudden CPU spike to 100% "
            "causing all services to become unresponsive. Memory usage was also high."
        ),
        "related_incidents": [
            {
                "incident_id": "INC-250",
                "title": "Memory leak in application server",
                "resolution": "Increased JVM heap size and patched memory leak.",
                "similarity": 0.8,
            }
        ],
    }
