# SDD MVP04: Model Center + Provider Management

## Scope

MVP04 introduces a Model Center focused on provider lifecycle, model sync, health verification, benchmark execution, and routing decision history.

## Entities

### Provider

- id
- name
- apiBase
- apiKeyEnc
- health

### ModelBenchmarkResult

- modelId
- taskType
- score
- latencyMs

## Endpoints

- POST /api/providers -> Create + test
- POST /api/providers/:id/sync -> List/enrich models
- GET /api/providers/:id/health -> Ping + latency
- POST /api/models/:id/benchmark -> Run suite
- GET /api/router/decisions -> History

## Flows

### 1) Add OpenAI

- POST /api/providers with provider payload
- Connection/health verification is executed

### 2) Sync Catalog

- POST /api/providers/:id/sync
- Provider model catalog is updated

### 3) Benchmark

- POST /api/models/:id/benchmark
- Score and latency are persisted and exposed live

### 4) Infer Route

- Router uses benchmark and capability ranking
- Coding default target: GPT-4o (score baseline 9.4)
