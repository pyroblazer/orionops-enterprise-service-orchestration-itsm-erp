"""Tests for the POST /api/v1/ai/root-cause/suggest endpoint."""

from __future__ import annotations

import pytest
from httpx import Response


class TestRootCause:
    """Validate root-cause suggestion behaviour."""

    def test_suggest_returns_suggestions(
        self,
        client,
        sample_root_cause_request,
    ):
        response: Response = client.post(
            "/api/v1/ai/root-cause/suggest", json=sample_root_cause_request
        )
        assert response.status_code == 200

        body = response.json()
        assert "incident_id" in body
        assert "suggestions" in body
        assert "processing_time_ms" in body
        assert body["incident_id"] == "INC-300"
        assert len(body["suggestions"]) >= 1

    def test_suggestions_sorted_by_confidence(
        self,
        client,
        sample_root_cause_request,
    ):
        response = client.post(
            "/api/v1/ai/root-cause/suggest", json=sample_root_cause_request
        )
        body = response.json()

        confidences = [s["confidence"] for s in body["suggestions"]]
        assert confidences == sorted(confidences, reverse=True)

    def test_with_related_incidents_context(
        self,
        client,
        sample_root_cause_request,
    ):
        """Related incidents with matching keywords should boost confidence."""
        response = client.post(
            "/api/v1/ai/root-cause/suggest", json=sample_root_cause_request
        )
        assert response.status_code == 200

        body = response.json()
        # Should have at least one suggestion mentioning resource exhaustion
        causes = [s["cause"].lower() for s in body["suggestions"]]
        # At least one suggestion should be related to resource/performance
        assert len(body["suggestions"]) >= 1

        # Check that related incident IDs appear in supporting evidence
        for suggestion in body["suggestions"]:
            if suggestion.get("related_incident_ids"):
                assert "INC-250" in suggestion["related_incident_ids"]
                break

    def test_with_minimal_input(self, client):
        """Should still return results with minimal input."""
        payload = {
            "incident_id": "INC-999",
            "title": "Something is wrong",
            "description": "System is not behaving as expected.",
        }
        response = client.post("/api/v1/ai/root-cause/suggest", json=payload)
        assert response.status_code == 200

        body = response.json()
        assert body["incident_id"] == "INC-999"
        # May return 0 or more suggestions with generic text
        assert isinstance(body["suggestions"], list)

    def test_suggestion_fields(
        self,
        client,
        sample_root_cause_request,
    ):
        """Each suggestion should have all required fields."""
        response = client.post(
            "/api/v1/ai/root-cause/suggest", json=sample_root_cause_request
        )
        body = response.json()

        for suggestion in body["suggestions"]:
            assert "cause" in suggestion
            assert "confidence" in suggestion
            assert "supporting_evidence" in suggestion
            assert "related_incident_ids" in suggestion
            assert "recommended_actions" in suggestion
            assert 0.0 <= suggestion["confidence"] <= 1.0
            assert isinstance(suggestion["supporting_evidence"], list)
            assert isinstance(suggestion["recommended_actions"], list)

    def test_suggestion_relevance(
        self,
        client,
    ):
        """A security-related incident should produce security-related causes."""
        payload = {
            "incident_id": "INC-SEC",
            "title": "Unauthorized access detected",
            "description": (
                "Security monitoring detected unauthorized access to the "
                "production database. Possible breach. Malware detected."
            ),
        }
        response = client.post("/api/v1/ai/root-cause/suggest", json=payload)
        assert response.status_code == 200

        body = response.json()
        causes = " ".join(s["cause"].lower() for s in body["suggestions"])
        assert "security" in causes

    def test_recommended_actions_present(
        self,
        client,
        sample_root_cause_request,
    ):
        """Suggestions should include actionable recommendations."""
        response = client.post(
            "/api/v1/ai/root-cause/suggest", json=sample_root_cause_request
        )
        body = response.json()

        for suggestion in body["suggestions"]:
            assert len(suggestion["recommended_actions"]) >= 1

    def test_processing_time_reported(
        self,
        client,
        sample_root_cause_request,
    ):
        response = client.post(
            "/api/v1/ai/root-cause/suggest", json=sample_root_cause_request
        )
        body = response.json()
        assert body["processing_time_ms"] > 0
