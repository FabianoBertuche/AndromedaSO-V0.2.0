"""FastAPI entrypoint for the Andromeda cognitive Python service."""

from __future__ import annotations

from datetime import datetime, timezone
from time import perf_counter
from typing import Any, Optional

from fastapi import Depends, FastAPI

from app.security import verify_service_token
from app.routers.language import router as language_router
from contracts.base import CognitiveMetrics, CognitiveRequest, CognitiveResponse, TraceContext
from contracts.classification import TaskClassification
from contracts.health import HealthResponse, ReadinessResponse
from contracts.version import ContractsVersionResponse
from services.planner.classifier import classify_query
from services.documents.parser import DocumentParser
from services.documents.chunker import DocumentChunker
from services.rag.embeddings import EmbeddingService
from services.rag.vector_store import SimpleVectorStore

SERVICE_NAME = "cognitive-python"
SERVICE_VERSION = "0.1.0"

# Instantiate services
doc_parser = DocumentParser()
doc_chunker = DocumentChunker()
embedding_service = EmbeddingService()
vector_store = SimpleVectorStore()

app = FastAPI(
    title="Andromeda Cognitive Python",
    version=SERVICE_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.include_router(language_router)


@app.get("/health", response_model=HealthResponse)
async def healthcheck() -> HealthResponse:
    """Returns a shallow liveness report for operational monitoring."""

    return HealthResponse(
        status="ok",
        service=SERVICE_NAME,
        version=SERVICE_VERSION,
        timestamp=utc_now(),
        checks={
            "http": "ok",
            "contracts": "loaded",
        },
    )


@app.get("/readiness", response_model=ReadinessResponse)
async def readiness() -> ReadinessResponse:
    """Returns readiness state for internal orchestration."""

    return ReadinessResponse(
        status="ready",
        service=SERVICE_NAME,
        version=SERVICE_VERSION,
        timestamp=utc_now(),
        dependencies={
            "planner": "ready",
            "contracts": "ready",
        },
    )


@app.get("/vector-store/health")
async def vector_store_health() -> dict[str, object]:
    """Returns readiness details for the in-memory vector store."""

    documents = len(vector_store.vectors)
    chunks = sum(len(entries) for entries in vector_store.vectors.values())

    return {
        "status": "ok",
        "service": "vector-store",
        "backend": "in-memory",
        "documents": documents,
        "chunks": chunks,
        "timestamp": utc_now(),
    }


@app.get("/contracts/version", response_model=ContractsVersionResponse)
async def contracts_version() -> ContractsVersionResponse:
    """Returns the canonical contract versions exposed by the service."""

    return ContractsVersionResponse(
        service=SERVICE_NAME,
        version=SERVICE_VERSION,
        contracts={
            "base": "1.0.0",
            "classification": "1.0.0",
            "health": "1.0.0",
        },
    )


@app.post(
    "/echo",
    response_model=CognitiveResponse,
    dependencies=[Depends(verify_service_token)],
)
async def echo(payload: CognitiveRequest) -> CognitiveResponse:
    """Simple echo endpoint for transport validation."""

    started_at = perf_counter()

    return build_response(
        payload=payload,
        data={
            "echo": payload.input,
            "service": SERVICE_NAME,
        },
        model_used="echo-v1",
        duration_ms=elapsed_ms(started_at),
    )


@app.post(
    "/v1/integration/ping",
    response_model=CognitiveResponse,
    dependencies=[Depends(verify_service_token)],
)
async def integration_ping(payload: CognitiveRequest) -> CognitiveResponse:
    """Echoes a canonical response to validate TS <-> Python connectivity."""

    started_at = perf_counter()
    message = str(payload.input.get("message", "ping"))

    return build_response(
        payload=payload,
        data={
            "echo": message,
            "acknowledged": True,
            "service": SERVICE_NAME,
        },
        model_used="ping-v1",
        duration_ms=elapsed_ms(started_at),
    )


@app.post(
    "/v1/documents/parse",
    response_model=CognitiveResponse,
    dependencies=[Depends(verify_service_token)],
)
async def parse_document(payload: CognitiveRequest) -> CognitiveResponse:
    started_at = perf_counter()
    content = str(payload.input.get("content", "")).encode("utf-8")
    mime_type = str(payload.input.get("mimeType", "text/plain"))
    
    text = await doc_parser.parse(content, mime_type)
    
    return build_response(
        payload=payload,
        data={"text": text},
        model_used="parser-v1",
        duration_ms=elapsed_ms(started_at),
    )


@app.post(
    "/v1/documents/chunk",
    response_model=CognitiveResponse,
    dependencies=[Depends(verify_service_token)],
)
async def chunk_document(payload: CognitiveRequest) -> CognitiveResponse:
    started_at = perf_counter()
    text = str(payload.input.get("text", ""))
    
    chunks = doc_chunker.chunk(text)
    
    return build_response(
        payload=payload,
        data={"chunks": chunks},
        model_used="chunker-v1",
        duration_ms=elapsed_ms(started_at),
    )


@app.post(
    "/v1/rag/retrieve",
    response_model=CognitiveResponse,
    dependencies=[Depends(verify_service_token)],
)
async def retrieve_knowledge(payload: CognitiveRequest) -> CognitiveResponse:
    started_at = perf_counter()
    query = str(payload.input.get("query", ""))
    top_k = int(payload.input.get("topK", 5))
    lang_filter: Optional[str] = payload.input.get("langFilter")
    
    query_embedding = await embedding_service.generate_query_embedding(query)
    results = vector_store.search(query_embedding, top_k=top_k)
    
    if lang_filter and results:
        filtered_results = []
        for result in results:
            result_lang = result.get("metadata", {}).get("detectedLang")
            if result_lang == lang_filter:
                filtered_results.append(result)
        if filtered_results:
            results = filtered_results
    
    return build_response(
        payload=payload,
        data={"results": results},
        model_used="rag-retriever-v1",
        duration_ms=elapsed_ms(started_at),
    )


@app.post(
    "/v1/cognitive/classify",
    response_model=CognitiveResponse,
    dependencies=[Depends(verify_service_token)],
)
async def classify_task(payload: CognitiveRequest) -> CognitiveResponse:
    """Returns a non-authoritative routing signal for the TS kernel."""

    started_at = perf_counter()
    query = str(payload.input.get("query", ""))
    classification: TaskClassification = classify_query(query)

    return build_response(
        payload=payload,
        data=classification.model_dump(),
        model_used="hybrid-signal-v1",
        duration_ms=elapsed_ms(started_at),
    )


@app.post(
    "/evolution/analyze-episodes",
    dependencies=[Depends(verify_service_token)],
)
async def analyze_episodes(payload: dict[str, Any]) -> dict[str, Any]:
    started_at = perf_counter()
    episodes = payload.get("episodes", []) if isinstance(payload, dict) else []
    suggestions = build_episode_suggestions(episodes if isinstance(episodes, list) else [])
    duration = elapsed_ms(started_at)

    return {
        "success": True,
        "data": {
            "suggestions": suggestions,
        },
        "metrics": {
            "latencyMs": duration,
        },
        "warnings": [],
        "error": None,
        "provider": SERVICE_NAME,
        "modelUsed": "episode-analyzer-v1",
        "durationMs": duration,
        "trace": {
            "requestId": str(payload.get("requestId", "episode-analysis")),
            "correlationId": str(payload.get("correlationId", "episode-analysis")),
            "agentId": payload.get("agentId"),
            "tenantId": payload.get("tenantId"),
        },
    }


def build_response(
    payload: CognitiveRequest,
    data: dict[str, object],
    model_used: str,
    duration_ms: int,
) -> CognitiveResponse:
    """Builds the canonical response envelope expected by the TS adapter."""

    return CognitiveResponse(
        success=True,
        data=data,
        metrics=CognitiveMetrics(latencyMs=duration_ms),
        warnings=[],
        error=None,
        provider=SERVICE_NAME,
        modelUsed=model_used,
        durationMs=duration_ms,
        trace=TraceContext(
            requestId=payload.requestId,
            correlationId=payload.correlationId,
            taskId=payload.taskId,
            sessionId=payload.sessionId,
            agentId=payload.agentId,
            tenantId=payload.tenantId,
        ),
    )


def utc_now() -> str:
    """Returns the current UTC timestamp in ISO 8601 format."""

    return datetime.now(timezone.utc).isoformat()


def elapsed_ms(started_at: float) -> int:
    """Converts a perf counter delta into integer milliseconds."""

    return max(1, int((perf_counter() - started_at) * 1000))


def build_episode_suggestions(episodes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    suggestions: list[dict[str, Any]] = []
    grouped: dict[str, list[dict[str, Any]]] = {}

    for episode in episodes:
        tags = episode.get("tags") if isinstance(episode.get("tags"), list) else []
        normalized_tags = [str(tag).strip().lower() for tag in tags if str(tag).strip()] or ["general"]
        for tag in normalized_tags:
            grouped.setdefault(tag, []).append(episode)

    for tag, tagged_episodes in grouped.items():
        if len(tagged_episodes) < 2:
            continue

        importance = sum(float(item.get("importanceScore", 0) or 0) for item in tagged_episodes) / len(tagged_episodes)
        confidence = min(0.95, max(0.55, 0.58 + min(len(tagged_episodes), 6) * 0.05 + importance / 250))
        summaries = [str(item.get("summary") or item.get("content") or "").strip() for item in tagged_episodes]
        summaries = [summary for summary in summaries if summary]
        source_ids = [str(item.get("id")) for item in tagged_episodes if item.get("id")]

        suggestions.append({
            "title": f"Reforcar playbook para {tag}",
            "summary": f"{len(tagged_episodes)} episodios recentes sugerem uma melhoria recorrente em {tag}.",
            "suggestion": build_suggestion_text(tag, summaries),
            "confidence": round(confidence, 3),
            "sourceEpisodeIds": source_ids[:6],
        })

    return suggestions[:8]


def build_suggestion_text(tag: str, summaries: list[str]) -> str:
    examples = "; ".join(summaries[:2])
    if examples:
        return f"Adicionar ao playbook uma verificacao explicita para {tag} antes da execucao. Evidencias recentes: {examples}"
    return f"Adicionar ao playbook uma verificacao explicita para {tag} antes da execucao."
