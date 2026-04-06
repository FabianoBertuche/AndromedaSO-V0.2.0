"""Smoke tests for the cognitive Python service contracts."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_healthcheck_returns_ok() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["service"] == "cognitive-python"


def test_contracts_version_returns_metadata() -> None:
    response = client.get("/contracts/version")

    assert response.status_code == 200
    payload = response.json()
    assert payload["service"] == "cognitive-python"
    assert payload["version"] == "0.1.0"
    assert payload["contracts"]["base"] == "1.0.0"


def test_echo_returns_canonical_response() -> None:
    response = client.post(
        "/echo",
        json={
            "requestId": "req-echo",
            "correlationId": "corr-echo",
            "input": {"message": "hello"},
            "timeoutMs": 500,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["echo"]["message"] == "hello"
    assert payload["trace"]["requestId"] == "req-echo"


def test_ping_returns_canonical_response() -> None:
    response = client.post(
        "/v1/integration/ping",
        json={
            "requestId": "req-1",
            "correlationId": "corr-1",
            "input": {"message": "ping"},
            "timeoutMs": 500,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["echo"] == "ping"
    assert payload["trace"]["requestId"] == "req-1"


def test_classify_returns_non_authoritative_signal() -> None:
    response = client.post(
        "/v1/cognitive/classify",
        json={
            "requestId": "req-2",
            "correlationId": "corr-2",
            "taskId": "task-2",
            "input": {"query": "write a TypeScript adapter"},
            "timeoutMs": 500,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["activityType"] == "coding.generate"
    assert payload["trace"]["taskId"] == "task-2"
