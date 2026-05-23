"""Vercel Python serverless handler for the OrionOps AI service."""

import os
import sys

# Add parent directory to path so imports work from Vercel's function context
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app  # noqa: F401

# Vercel Python runtime expects a WSGI/ASGI app exported as `app`
# FastAPI is ASGI-compatible and Vercel's Python runtime handles it directly.
