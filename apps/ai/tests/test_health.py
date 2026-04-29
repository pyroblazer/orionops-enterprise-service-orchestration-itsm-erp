"""Tests for health-check and model-info endpoints."""

from __future__ import annotations

import pytest
from httpx import Response


class TestHealthEndpoint:
    """Validate the /health endpoint."""

    def test_health_returns_200(self, client):
        response: Response = client.get("/health")
        assert response.status_code == 200

        body = response.json()
        assert body["status"] == "healthy"
        assert body["service"] == "orionops-ai"
        assert body["version"] == "1.0.0"
        assert "timestamp" in body

    def test_health_has_required_fields(self, client):
        response = client.get("/health")
        body = response.json()

        assert "status" in body
        assert "service" in body
        assert "version" in body
        assert "timestamp" in body


class TestModelsEndpoint:
    """Validate the /api/v1/ai/models endpoint."""

    def test_models_returns_200(self, client):
        response: Response = client.get("/api/v1/ai/models")
        assert response.status_code == 200

    def test_models_returns_model_list(self, client):
        response = client.get("/api/v1/ai/models")
        body = response.json()

        assert "models" in body
        assert isinstance(body["models"], list)
        assert len(body["models"]) >= 1

    def test_each_model_has_required_fields(self, client):
        response = client.get("/api/v1/ai/models")
        body = response.json()

        for model in body["models"]:
            assert "name" in model
            assert "version" in model
            assert "description" in model
            assert "type" in model

    def test_expected_models_present(self, client):
        response = client.get("/api/v1/ai/models")
        body = response.json()

        model_names = [m["name"] for m in body["models"]]
        assert "Incident Classifier" in model_names
        assert "Anomaly Detector" in model_names
        assert "Root Cause Analyser" in model_names
        assert "Ticket Similarity Engine" in model_names
