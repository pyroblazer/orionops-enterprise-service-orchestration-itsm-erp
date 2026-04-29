# ===========================================================================
# Multi-stage Dockerfile for the OrionOps AI Service
# ===========================================================================

# ----------- Stage 1: Build / install dependencies --------------------------
FROM python:3.12-slim AS builder

WORKDIR /build

# Install build-time system deps
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies into a virtual environment
COPY requirements.txt .
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:${PATH}"
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ----------- Stage 2: Runtime image ----------------------------------------
FROM python:3.12-slim AS runtime

LABEL maintainer="OrionOps Team"
LABEL description="OrionOps AI Service -- classification, anomaly detection, RCA, similarity"
LABEL org.opencontainers.image.source="https://github.com/orionops/orionops-enterprise"

# Create non-root user
RUN groupadd --gid 1000 appuser && \
    useradd --uid 1000 --gid appuser --shell /bin/bash --create-home appuser

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:${PATH}"

# Copy application source
COPY . .

# Ensure ownership
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
