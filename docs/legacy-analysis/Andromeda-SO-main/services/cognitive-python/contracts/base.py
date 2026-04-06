"""Canonical request and response envelopes for TS <-> Python integration."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class TraceContext(BaseModel):
    requestId: str
    correlationId: str
    taskId: str | None = None
    sessionId: str | None = None
    agentId: str | None = None
    tenantId: str | None = None


class CognitiveMetrics(BaseModel):
    tokensIn: int | None = None
    tokensOut: int | None = None
    latencyMs: int | None = None


class CognitiveError(BaseModel):
    code: str
    message: str
    retryable: bool = False
    details: dict[str, Any] | None = None


class CognitiveRequest(BaseModel):
    requestId: str
    correlationId: str
    taskId: str | None = None
    sessionId: str | None = None
    agentId: str | None = None
    tenantId: str | None = None
    input: dict[str, Any] = Field(default_factory=dict)
    constraints: dict[str, Any] | None = None
    context: dict[str, Any] | None = None
    timeoutMs: int = 1500
    traceMetadata: dict[str, Any] | None = None


class CognitiveResponse(BaseModel):
    success: bool
    data: dict[str, Any] | None
    metrics: CognitiveMetrics | None = None
    warnings: list[str] = Field(default_factory=list)
    error: CognitiveError | None = None
    provider: str = "cognitive-python"
    modelUsed: str | None = None
    durationMs: int
    trace: TraceContext
