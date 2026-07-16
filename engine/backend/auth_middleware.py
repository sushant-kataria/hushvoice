"""Optional shared-secret gate for the HushVoice engine HTTP API.

When ``ENGINE_API_KEY`` (or ``HUSHVOICE_ENGINE_API_KEY``) is set, requests
must send ``Authorization: Bearer <key>`` (or ``X-HushVoice-Key``).
``/health`` stays open for Docker/Cloudflare health checks.
"""

from __future__ import annotations

import os
import secrets

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.types import ASGIApp


def _configured_key() -> str:
    return (
        os.environ.get("ENGINE_API_KEY")
        or os.environ.get("HUSHVOICE_ENGINE_API_KEY")
        or ""
    ).strip()


class EngineApiKeyMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)
        self.key = _configured_key()

    async def dispatch(self, request: Request, call_next) -> Response:
        if not self.key:
            return await call_next(request)

        path = request.url.path or "/"
        if path == "/health" or path.endswith("/health"):
            return await call_next(request)

        auth = request.headers.get("authorization") or ""
        header_key = request.headers.get("x-hushvoice-key") or ""
        token = ""
        if auth.lower().startswith("bearer "):
            token = auth[7:].strip()
        elif header_key:
            token = header_key.strip()

        if not token or not secrets.compare_digest(token, self.key):
            return JSONResponse(
                {"detail": "Unauthorized — set Authorization: Bearer <ENGINE_API_KEY>"},
                status_code=401,
            )
        return await call_next(request)
