"""Contract version metadata for the cognitive Python service."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ContractsVersionResponse(BaseModel):
    service: str
    version: str
    contracts: dict[str, str] = Field(default_factory=dict)
