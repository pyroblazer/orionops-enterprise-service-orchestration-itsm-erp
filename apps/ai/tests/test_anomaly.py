"""Tests for the POST /api/v1/ai/anomaly/detect endpoint."""

from __future__ import annotations

from datetime import datetime, timezone

import pytest
from httpx import Response


class TestAnomalyDetection:
    """Validate anomaly detection behaviour."""

    def test_detect_returns_anomaly_score(
        self,
        client,
        sample_anomaly_request,
    ):
        response: Response = client.post(
            "/api/v1/ai/anomaly/detect", json=sample_anomaly_request
        )
        assert response.status_code == 200

        body = response.json()
        assert "anomaly_count" in body
        assert "anomalies" in body
        assert "global_threshold" in body
        assert "processing_time_ms" in body
        assert body["metric_name"] == "cpu_utilization"
        assert body["method"] == "z_score"

    def test_normal_data_returns_low_anomaly_count(self, client):
        """A series of stable values should produce few or no anomalies."""
        base = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        points = [
            {
                "timestamp": base.replace(minute=i).isoformat(),
                "value": 50.0 + (i % 3),
            }
            for i in range(20)
        ]
        payload = {
            "metric_name": "memory_usage",
            "data_points": points,
            "method": "z_score",
        }
        response = client.post("/api/v1/ai/anomaly/detect", json=payload)
        assert response.status_code == 200

        body = response.json()
        # With stable data, anomaly count should be low (0 or very few)
        assert body["anomaly_count"] <= 3

    def test_outlier_data_returns_high_anomaly_count(
        self,
        client,
        sample_anomaly_request,
    ):
        """The injected outlier (500.0) should be flagged."""
        response = client.post(
            "/api/v1/ai/anomaly/detect", json=sample_anomaly_request
        )
        body = response.json()
        assert body["anomaly_count"] >= 1

        # The outlier should have a higher score than normal points
        anomalies = [a for a in body["anomalies"] if a["is_anomaly"]]
        assert len(anomalies) >= 1

        # At least one anomaly should have value 500.0
        outlier_values = [a for a in anomalies if a["value"] == 500.0]
        assert len(outlier_values) >= 1

    def test_iqr_method(self, client):
        """The IQR method should also detect the outlier."""
        base = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        points = [
            {
                "timestamp": base.replace(minute=i).isoformat(),
                "value": 10.0 + i * 0.5,
            }
            for i in range(15)
        ]
        points.append({
            "timestamp": base.replace(minute=15).isoformat(),
            "value": 200.0,
        })

        payload = {
            "metric_name": "response_time",
            "data_points": points,
            "method": "iqr",
        }
        response = client.post("/api/v1/ai/anomaly/detect", json=payload)
        assert response.status_code == 200

        body = response.json()
        assert body["method"] == "iqr"
        assert body["anomaly_count"] >= 1

    def test_custom_threshold(self, client):
        """A very high threshold should suppress anomaly detection."""
        base = datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc)
        points = [
            {
                "timestamp": base.replace(minute=i).isoformat(),
                "value": float(i),
            }
            for i in range(10)
        ]
        points.append({
            "timestamp": base.replace(minute=10).isoformat(),
            "value": 100.0,
        })

        payload = {
            "metric_name": "test_metric",
            "data_points": points,
            "method": "z_score",
            "threshold": 100.0,  # Extremely high threshold
        }
        response = client.post("/api/v1/ai/anomaly/detect", json=payload)
        assert response.status_code == 200

        body = response.json()
        # With a very high threshold, few or no anomalies should be detected
        assert body["anomaly_count"] == 0

    def test_minimum_data_points_validation(self, client):
        """Should reject requests with fewer than 3 data points."""
        payload = {
            "metric_name": "test",
            "data_points": [
                {"timestamp": datetime.now(timezone.utc).isoformat(), "value": 1.0},
                {"timestamp": datetime.now(timezone.utc).isoformat(), "value": 2.0},
            ],
        }
        response = client.post("/api/v1/ai/anomaly/detect", json=payload)
        assert response.status_code == 422

    def test_each_anomaly_has_required_fields(
        self,
        client,
        sample_anomaly_request,
    ):
        response = client.post(
            "/api/v1/ai/anomaly/detect", json=sample_anomaly_request
        )
        body = response.json()

        for anomaly in body["anomalies"]:
            assert "timestamp" in anomaly
            assert "value" in anomaly
            assert "score" in anomaly
            assert "is_anomaly" in anomaly
            assert "threshold" in anomaly
            assert isinstance(anomaly["is_anomaly"], bool)
