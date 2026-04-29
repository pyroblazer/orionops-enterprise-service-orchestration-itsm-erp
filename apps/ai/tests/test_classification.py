"""Tests for the POST /api/v1/ai/classify endpoint."""

from __future__ import annotations

import pytest
from httpx import Response


class TestClassifyIncident:
    """Validate incident classification behaviour."""

    def test_classify_returns_category_and_confidence(
        self,
        client,
        sample_classification_request,
    ):
        response: Response = client.post(
            "/api/v1/ai/classify", json=sample_classification_request
        )
        assert response.status_code == 200

        body = response.json()
        assert "predicted_category" in body
        assert "predicted_subcategory" in body
        assert "predicted_priority" in body
        assert "confidence" in body
        assert "predictions" in body
        assert "processing_time_ms" in body

        # Confidence should be between 0 and 1
        assert 0.0 <= body["confidence"] <= 1.0

        # Should return at least 1 prediction
        assert len(body["predictions"]) >= 1

    def test_classify_with_network_keywords(self, client):
        payload = {
            "title": "DNS resolution failure",
            "description": "Cannot resolve internal domain names. DNS server unreachable.",
        }
        response = client.post("/api/v1/ai/classify", json=payload)
        assert response.status_code == 200

        body = response.json()
        assert body["predicted_category"] == "network"
        assert body["confidence"] > 0.0

    def test_classify_with_empty_title_rejected(self, client):
        payload = {
            "title": "",
            "description": "Some description",
        }
        response = client.post("/api/v1/ai/classify", json=payload)
        assert response.status_code == 422  # Validation error

    def test_classify_with_empty_description_rejected(self, client):
        payload = {
            "title": "Some title",
            "description": "",
        }
        response = client.post("/api/v1/ai/classify", json=payload)
        assert response.status_code == 422

    def test_classify_with_missing_fields_rejected(self, client):
        response = client.post("/api/v1/ai/classify", json={})
        assert response.status_code == 422

    def test_classify_confidence_threshold(self, client):
        """Classification should return a reasonable confidence score."""
        payload = {
            "title": "Email delivery failure for outlook",
            "description": "Exchange server is bouncing all outgoing emails.",
        }
        response = client.post("/api/v1/ai/classify", json=payload)
        assert response.status_code == 200

        body = response.json()
        # With keyword matches, confidence should be positive
        assert body["confidence"] > 0.0

    def test_classify_returns_multiple_predictions(self, client):
        """Top-3 predictions are returned ordered by confidence."""
        payload = {
            "title": "Slow database query performance",
            "description": "Database queries are timing out. Slow response times.",
        }
        response = client.post("/api/v1/ai/classify", json=payload)
        assert response.status_code == 200

        body = response.json()
        predictions = body["predictions"]

        # Should return up to 3 predictions
        assert 1 <= len(predictions) <= 3

        # Each prediction should have required fields
        for pred in predictions:
            assert "category" in pred
            assert "subcategory" in pred
            assert "confidence" in pred
            assert 0.0 <= pred["confidence"] <= 1.0

    def test_classify_priority_inference(self, client):
        """Priority should be inferred from urgency keywords."""
        critical_payload = {
            "title": "Production down - all users affected",
            "description": "Critical system outage. Emergency. Production is down for all users.",
        }
        response = client.post("/api/v1/ai/classify", json=critical_payload)
        assert response.status_code == 200
        body = response.json()
        assert body["predicted_priority"] == "critical"

    def test_classify_processing_time_reported(
        self,
        client,
        sample_classification_request,
    ):
        response = client.post(
            "/api/v1/ai/classify", json=sample_classification_request
        )
        body = response.json()
        assert body["processing_time_ms"] > 0
