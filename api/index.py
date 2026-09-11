"""Vercel ASGI entrypoint for the existing API contract."""
from backend.app.main import app

__all__ = ["app"]
