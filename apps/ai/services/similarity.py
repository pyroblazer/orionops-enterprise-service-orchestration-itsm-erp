"""Text similarity engine using TF-IDF vectorisation and cosine similarity.

Provides a reusable similarity calculator that can be used both by the
similarity router and by the root-cause analysis service.
"""

from __future__ import annotations

import time

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from models.schemas import (
    RootCauseRequest,
    RootCauseResponse,
    RootCauseSuggestion,
    SimilarTicket,
    SimilarityRequest,
    SimilarityResponse,
)


# ---------------------------------------------------------------------------
# Root-cause pattern catalogue
# ---------------------------------------------------------------------------

_ROOT_CAUSE_PATTERNS: list[dict[str, list[str]]] = [
    {
        "cause": "Resource exhaustion on the affected server",
        "keywords": ["slow", "cpu", "memory", "disk", "high load", "utilization", "oom"],
        "actions": [
            "Check current resource utilisation on the affected host",
            "Review recent deployments for regressions",
            "Scale horizontally or vertically if thresholds are consistently exceeded",
        ],
    },
    {
        "cause": "Network connectivity or DNS resolution failure",
        "keywords": ["timeout", "unreachable", "dns", "connection refused", "network"],
        "actions": [
            "Run traceroute / mtr to the target host",
            "Check DNS resolution and firewall rules",
            "Verify VPN / proxy configuration",
        ],
    },
    {
        "cause": "Application deployment or configuration change",
        "keywords": ["deploy", "config", "upgrade", "patch", "restart", "change"],
        "actions": [
            "Review recent change records for the affected CI",
            "Roll back the most recent deployment",
            "Compare configuration files with the known-good baseline",
        ],
    },
    {
        "cause": "Database performance degradation",
        "keywords": ["database", "query", "sql", "slow", "lock", "deadlock", "connection pool"],
        "actions": [
            "Analyse slow query log",
            "Check for blocking sessions and deadlocks",
            "Verify index health and statistics freshness",
        ],
    },
    {
        "cause": "Security incident or unauthorized access",
        "keywords": ["unauthorized", "breach", "malware", "phishing", "suspicious", "exploit"],
        "actions": [
            "Isolate the affected system",
            "Collect and preserve forensic evidence",
            "Revoke compromised credentials and force password reset",
        ],
    },
    {
        "cause": "Hardware failure or degradation",
        "keywords": ["disk", "failed", "error", "smart", "raid", "power", "hardware"],
        "actions": [
            "Check hardware diagnostic logs (SMART, BMC/IPMI)",
            "Initiate hardware replacement procedure",
            "Fail over to redundant component if available",
        ],
    },
]


def compute_similarity(
    source: str,
    candidates: list[str],
) -> np.ndarray:
    """Compute cosine similarity between *source* and each candidate text.

    Parameters
    ----------
    source:
        The reference document string.
    candidates:
        A list of document strings to compare against.

    Returns
    -------
    np.ndarray
        1-D array of similarity scores in ``[0, 1]``, aligned with *candidates*.
    """
    if not candidates:
        return np.array([], dtype=np.float64)

    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
    tfidf_matrix = vectorizer.fit_transform([source] + candidates)
    scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    return scores


# ---------------------------------------------------------------------------
# Ticket similarity (used by the similarity router)
# ---------------------------------------------------------------------------

def find_similar_tickets(request: SimilarityRequest) -> SimilarityResponse:
    """Find the *top_k* most similar tickets from the candidate pool.

    Parameters
    ----------
    request:
        Similarity request with source ticket, candidates, and top_k.

    Returns
    -------
    SimilarityResponse
        Ranked list of similar tickets with scores.
    """
    start = time.perf_counter()

    source_text = f"{request.ticket.title} {request.ticket.description}"
    candidate_texts = [
        f"{c.title} {c.description}" for c in request.candidate_tickets
    ]

    scores = compute_similarity(source_text, candidate_texts)

    top_k = min(request.top_k, len(scores))
    top_indices = np.argsort(scores)[::-1][:top_k]

    similar_tickets: list[SimilarTicket] = []
    for idx in top_indices:
        ticket = request.candidate_tickets[int(idx)]
        similar_tickets.append(
            SimilarTicket(
                ticket_id=ticket.ticket_id or f"candidate-{idx}",
                title=ticket.title,
                description=ticket.description,
                similarity_score=round(float(scores[idx]), 6),
            )
        )

    elapsed_ms = (time.perf_counter() - start) * 1000

    return SimilarityResponse(
        source_ticket_id=request.ticket.ticket_id,
        similar_tickets=similar_tickets,
        processing_time_ms=round(elapsed_ms, 2),
    )


# ---------------------------------------------------------------------------
# Root-cause suggestion (used by the root-cause router)
# ---------------------------------------------------------------------------

def suggest_root_causes(request: RootCauseRequest) -> RootCauseResponse:
    """Suggest potential root causes based on pattern matching and similarity.

    Parameters
    ----------
    request:
        Root-cause request with incident details and optionally related incidents.

    Returns
    -------
    RootCauseResponse
        Ranked root-cause suggestions with confidence and evidence.
    """
    start = time.perf_counter()

    incident_text = f"{request.title} {request.description}".lower()

    suggestions: list[RootCauseSuggestion] = []

    # 1) Pattern-based matching against catalogue
    for pattern in _ROOT_CAUSE_PATTERNS:
        match_count = sum(1 for kw in pattern["keywords"] if kw in incident_text)
        if match_count == 0:
            continue

        confidence = min(match_count / len(pattern["keywords"]) + 0.2, 0.95)

        # Check if any related incidents support this cause
        related_ids: list[str] = []
        evidence: list[str] = []
        for ri in request.related_incidents:
            ri_text = f"{ri.title} {ri.resolution or ''}".lower()
            ri_matches = sum(1 for kw in pattern["keywords"] if kw in ri_text)
            if ri_matches > 0:
                related_ids.append(ri.incident_id)
                evidence.append(
                    f"Related incident {ri.incident_id} shares {ri_matches} keyword(s)"
                )

        evidence.insert(0, f"Matched {match_count}/{len(pattern['keywords'])} keywords")

        suggestions.append(
            RootCauseSuggestion(
                cause=pattern["cause"],
                confidence=round(confidence, 4),
                supporting_evidence=evidence,
                related_incident_ids=related_ids,
                recommended_actions=pattern["actions"],
            )
        )

    # 2) Boost confidence when related incidents have high similarity
    if request.related_incidents:
        for sug in suggestions:
            for ri in request.related_incidents:
                if ri.incident_id in sug.related_incident_ids and ri.similarity:
                    sug.confidence = min(sug.confidence + ri.similarity * 0.1, 0.99)
                    sug.confidence = round(sug.confidence, 4)

    # Sort by confidence descending
    suggestions.sort(key=lambda s: s.confidence, reverse=True)

    elapsed_ms = (time.perf_counter() - start) * 1000

    return RootCauseResponse(
        incident_id=request.incident_id,
        suggestions=suggestions,
        processing_time_ms=round(elapsed_ms, 2),
    )
