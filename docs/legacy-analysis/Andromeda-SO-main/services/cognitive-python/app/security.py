"""Security helpers for optional service-to-service authentication."""

from __future__ import annotations

import os

from fastapi import Header, HTTPException, status


async def verify_service_token(x_service_token: str | None = Header(default=None)) -> None:
    """Validates the internal shared token when the environment requires it."""

    expected_token = os.getenv("COGNITIVE_SERVICE_AUTH_TOKEN")
    if not expected_token:
        return

    if x_service_token == expected_token:
        return

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing service token.",
    )
