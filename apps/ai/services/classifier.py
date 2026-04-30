"""Incident text classifier using TF-IDF + keyword matching.

This module provides a lightweight classifier that combines TF-IDF
vectorisation with rule-based keyword boosts to predict the category,
subcategory, and priority of ITSM incidents.
"""

from __future__ import annotations

import time

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

from models.schemas import (
    CategoryPrediction,
    ClassificationRequest,
    ClassificationResponse,
    IncidentCategory,
    IncidentPriority,
)

# ---------------------------------------------------------------------------
# Keyword catalogue – maps (category, subcategory) -> keyword list
# ---------------------------------------------------------------------------

_CATEGORY_KEYWORDS: dict[tuple[IncidentCategory, str], list[str]] = {
    (IncidentCategory.HARDWARE, "disk_failure"): [
        "disk", "hard drive", "hdd", "ssd", "storage", "raid", "sector",
    ],
    (IncidentCategory.HARDWARE, "memory"): [
        "memory", "ram", "dimm", "ecc", "memory leak",
    ],
    (IncidentCategory.HARDWARE, "power"): [
        "power", "ups", "battery", "psu", "power supply",
    ],
    (IncidentCategory.HARDWARE, "peripheral"): [
        "printer", "scanner", "monitor", "keyboard", "mouse", "usb",
    ],
    (IncidentCategory.SOFTWARE, "installation"): [
        "install", "setup", "deploy", "upgrade", "patch",
    ],
    (IncidentCategory.SOFTWARE, "crash"): [
        "crash", "freeze", "hang", "unresponsive", "not responding",
    ],
    (IncidentCategory.SOFTWARE, "configuration"): [
        "config", "settings", "preference", "registry",
    ],
    (IncidentCategory.NETWORK, "connectivity"): [
        "network", "connection", "ping", "timeout", "unreachable",
    ],
    (IncidentCategory.NETWORK, "dns"): [
        "dns", "name resolution", "domain",
    ],
    (IncidentCategory.NETWORK, "vpn"): [
        "vpn", "tunnel", "ipsec", "remote access",
    ],
    (IncidentCategory.NETWORK, "firewall"): [
        "firewall", "blocked", "port", "acl",
    ],
    (IncidentCategory.SECURITY, "malware"): [
        "malware", "virus", "ransomware", "phishing", "trojan",
    ],
    (IncidentCategory.SECURITY, "breach"): [
        "breach", "unauthorized", "intrusion", "compromised",
    ],
    (IncidentCategory.SECURITY, "vulnerability"): [
        "cve", "vulnerability", "exploit", "patch",
    ],
    (IncidentCategory.DATABASE, "performance"): [
        "slow query", "database", "db", "sql", "query performance",
    ],
    (IncidentCategory.DATABASE, "corruption"): [
        "corrupt", "data loss", "integrity",
    ],
    (IncidentCategory.DATABASE, "replication"): [
        "replication", "lag", "slave", "master",
    ],
    (IncidentCategory.EMAIL, "delivery"): [
        "email", "mail", "smtp", "bounce", "delivery",
    ],
    (IncidentCategory.EMAIL, "exchange"): [
        "exchange", "outlook", "mailbox",
    ],
    (IncidentCategory.APPLICATION, "error"): [
        "error", "exception", "traceback", "stack trace", "bug",
    ],
    (IncidentCategory.APPLICATION, "performance"): [
        "slow", "latency", "response time", "timeout", "throttle",
    ],
    (IncidentCategory.ACCESS, "login"): [
        "login", "sign in", "authenticate", "sso", "password", "locked out",
    ],
    (IncidentCategory.ACCESS, "permissions"): [
        "permission", "access denied", "unauthorized", "role", "rbac",
    ],
    (IncidentCategory.PERFORMANCE, "cpu"): [
        "cpu", "processor", "high load", "utilization",
    ],
    (IncidentCategory.PERFORMANCE, "memory_usage"): [
        "oom", "out of memory", "memory usage", "swap",
    ],
}

# Category-level keyword aggregates for TF-IDF fallback
_CATEGORY_DESCRIPTIONS: dict[IncidentCategory, str] = {}
for (_cat, _sub), _kws in _CATEGORY_KEYWORDS.items():
    _CATEGORY_DESCRIPTIONS.setdefault(_cat, []).extend(_kws)

# Priority keyword signals
_PRIORITY_SIGNALS: dict[IncidentPriority, list[str]] = {
    IncidentPriority.CRITICAL: [
        "down", "outage", "critical", "emergency", "production down",
        "system down", "all users", "data loss",
    ],
    IncidentPriority.HIGH: [
        "severe", "urgent", "major", "multiple users", "service degraded",
        "significant impact",
    ],
    IncidentPriority.MEDIUM: [
        "moderate", "some users", "workaround available", "partial",
    ],
    IncidentPriority.LOW: [
        "minor", "cosmetic", "single user", "informational", "request",
    ],
}


class IncidentClassifier:
    """Lightweight incident classifier combining TF-IDF and keyword matching.

    The classifier pre-computes TF-IDF vectors from a corpus of ITSM-relevant
    keyword phrases so that each prediction call is a simple cosine similarity
    computation.
    """

    def __init__(self) -> None:
        self._vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            max_features=5000,
        )
        # Build corpus – one document per (category, subcategory)
        self._labels: list[tuple[IncidentCategory, str]] = []
        corpus: list[str] = []
        for label, keywords in _CATEGORY_KEYWORDS.items():
            self._labels.append(label)
            corpus.append(" ".join(keywords))

        self._tfidf_matrix = self._vectorizer.fit_transform(corpus)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def classify(self, request: ClassificationRequest) -> ClassificationResponse:
        """Classify an incident and return the top-3 predictions.

        Parameters
        ----------
        request:
            Incoming classification request with title and description.

        Returns
        -------
        ClassificationResponse
            Predicted category, subcategory, priority, and confidence scores.
        """
        start = time.perf_counter()

        text = f"{request.title} {request.description}".lower()

        # 1) TF-IDF similarity scores
        tfidf_scores = self._tfidf_scores(text)

        # 2) Keyword match boost
        keyword_scores = self._keyword_scores(text)

        # 3) Combined score (weighted blend)
        combined = 0.6 * tfidf_scores + 0.4 * keyword_scores

        # Top-3 indices
        top_indices = np.argsort(combined)[::-1][:3]
        total_score = combined[top_indices].sum()
        if total_score == 0:
            total_score = 1.0

        predictions: list[CategoryPrediction] = []
        for idx in top_indices:
            cat, sub = self._labels[idx]
            conf = float(combined[idx] / total_score)
            predictions.append(
                CategoryPrediction(category=cat, subcategory=sub, confidence=conf)
            )

        # Normalize confidence values
        conf_sum = sum(p.confidence for p in predictions)
        for p in predictions:
            p.confidence = round(p.confidence / conf_sum, 4) if conf_sum > 0 else 0.0

        best = predictions[0]
        priority = self._infer_priority(text)

        elapsed_ms = (time.perf_counter() - start) * 1000

        return ClassificationResponse(
            predicted_category=best.category,
            predicted_subcategory=best.subcategory,
            predicted_priority=priority,
            confidence=best.confidence,
            predictions=predictions,
            processing_time_ms=round(elapsed_ms, 2),
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _tfidf_scores(self, text: str) -> np.ndarray:
        """Compute cosine similarity between *text* and each category vector."""
        vec = self._vectorizer.transform([text])
        # dot-product gives cosine similarity because TF-IDF rows are L2-normalised
        scores = (self._tfidf_matrix @ vec.T).toarray().flatten()
        return scores

    def _keyword_scores(self, text: str) -> np.ndarray:
        """Score each label by the proportion of matching keywords."""
        scores = np.zeros(len(self._labels), dtype=np.float64)
        for i, (_, keywords) in enumerate(_CATEGORY_KEYWORDS.items()):
            matches = sum(1 for kw in keywords if kw in text)
            scores[i] = matches / max(len(keywords), 1)
        return scores

    def _infer_priority(self, text: str) -> IncidentPriority:
        """Heuristic priority estimation based on keyword signals."""
        priority_hits: dict[IncidentPriority, int] = {}
        for priority, signals in _PRIORITY_SIGNALS.items():
            priority_hits[priority] = sum(1 for s in signals if s in text)
        best = max(priority_hits, key=priority_hits.get)  # type: ignore[arg-type]
        if priority_hits[best] == 0:
            return IncidentPriority.MEDIUM
        return best
