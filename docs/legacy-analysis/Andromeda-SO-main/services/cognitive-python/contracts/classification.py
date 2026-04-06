"""Contracts for the MVP05 non-authoritative task classification signal."""

from __future__ import annotations

from pydantic import BaseModel, Field


class TaskClassification(BaseModel):
    activityType: str
    requiredCapabilities: list[str] = Field(default_factory=list)
    confidence: float
    reasoning: str | None = None
