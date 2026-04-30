"""Tests for the POST /api/v1/ai/similarity endpoint."""

from __future__ import annotations

from httpx import Response


class TestSimilarity:
    """Validate ticket similarity search behaviour."""

    def test_find_similar_returns_sorted_results(
        self,
        client,
        sample_similarity_request,
    ):
        response: Response = client.post(
            "/api/v1/ai/similarity", json=sample_similarity_request
        )
        assert response.status_code == 200

        body = response.json()
        assert "similar_tickets" in body
        assert "processing_time_ms" in body
        assert body["source_ticket_id"] == "INC-100"

        # Results should be sorted by similarity score (descending)
        scores = [t["similarity_score"] for t in body["similar_tickets"]]
        assert scores == sorted(scores, reverse=True)

    def test_identical_tickets_have_high_similarity(self, client):
        """Identical tickets should score close to 1.0."""
        payload = {
            "ticket": {
                "ticket_id": "SRC",
                "title": "Database connection pool exhausted",
                "description": "Application throws connection pool errors under load.",
            },
            "candidate_tickets": [
                {
                    "ticket_id": "DUP",
                    "title": "Database connection pool exhausted",
                    "description": "Application throws connection pool errors under load.",
                },
            ],
            "top_k": 1,
        }
        response = client.post("/api/v1/ai/similarity", json=payload)
        assert response.status_code == 200

        body = response.json()
        assert len(body["similar_tickets"]) == 1
        assert body["similar_tickets"][0]["similarity_score"] > 0.9

    def test_unrelated_tickets_have_low_similarity(self, client):
        """Completely unrelated tickets should have low similarity."""
        payload = {
            "ticket": {
                "ticket_id": "SRC",
                "title": "Database connection pool exhausted",
                "description": "Application throws connection pool errors under load.",
            },
            "candidate_tickets": [
                {
                    "ticket_id": "UNRELATED",
                    "title": "Office kitchen refrigerator cleaning",
                    "description": "The refrigerator in the kitchen needs to be cleaned.",
                },
            ],
            "top_k": 1,
        }
        response = client.post("/api/v1/ai/similarity", json=payload)
        assert response.status_code == 200

        body = response.json()
        assert len(body["similar_tickets"]) == 1
        # Unrelated tickets should have relatively low similarity
        assert body["similar_tickets"][0]["similarity_score"] < 0.5

    def test_empty_candidate_pool_rejected(self, client):
        """Should reject a request with an empty candidate list."""
        payload = {
            "ticket": {
                "ticket_id": "SRC",
                "title": "Test",
                "description": "Test description",
            },
            "candidate_tickets": [],
        }
        response = client.post("/api/v1/ai/similarity", json=payload)
        assert response.status_code == 422

    def test_top_k_limits_results(self, client):
        """Should not return more than top_k results."""
        payload = {
            "ticket": {
                "ticket_id": "SRC",
                "title": "Database issue",
                "description": "Connection problems with the database server.",
            },
            "candidate_tickets": [
                {
                    "ticket_id": f"C-{i}",
                    "title": f"Candidate ticket {i}",
                    "description": f"Some description for candidate {i}.",
                }
                for i in range(10)
            ],
            "top_k": 3,
        }
        response = client.post("/api/v1/ai/similarity", json=payload)
        assert response.status_code == 200

        body = response.json()
        assert len(body["similar_tickets"]) <= 3

    def test_each_result_has_required_fields(
        self,
        client,
        sample_similarity_request,
    ):
        response = client.post(
            "/api/v1/ai/similarity", json=sample_similarity_request
        )
        body = response.json()

        for ticket in body["similar_tickets"]:
            assert "ticket_id" in ticket
            assert "title" in ticket
            assert "description" in ticket
            assert "similarity_score" in ticket
            assert 0.0 <= ticket["similarity_score"] <= 1.0

    def test_processing_time_reported(
        self,
        client,
        sample_similarity_request,
    ):
        response = client.post(
            "/api/v1/ai/similarity", json=sample_similarity_request
        )
        body = response.json()
        assert body["processing_time_ms"] > 0
