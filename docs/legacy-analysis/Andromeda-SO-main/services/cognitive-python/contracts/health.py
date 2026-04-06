"""Health and readiness contracts for the cognitive Python service."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str
    checks: dict[str, Any] = Field(default_factory=dict)


class ReadinessResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str
    dependencies: dict[str, str] = Field(default_factory=dict)
