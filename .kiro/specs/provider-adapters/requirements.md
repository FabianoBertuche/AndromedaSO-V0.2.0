# Provider Adapters Completos — Requirements

## Context

A V0.2.0 atual tem 20 providers, mas apenas 4 (OpenAI, Anthropic, Groq, Ollama) têm adapters HTTP reais. Os outros 16 só retornam seed data estática, não fazendo chamadas às APIs reais dos provedores.

O usuário solicita que TODOS os 16 providers restantes tenham adapters reais implementados.

## Providers a Implementar

| Provider | Endpoint | Auth | Status Atual |
|----------|----------|------|--------------|
| google | https://generativelanguage.googleapis.com | x-goog-api-key | seed only |
| xai | https://api.x.ai | Bearer | seed only |
| mistral | https://api.mistral.ai | Bearer | seed only |
| together | https://api.together.xyz | Bearer | seed only |
| fireworks | https://api.fireworks.ai | Bearer | seed only |
| deepinfra | https://api.deepinfra.com | Bearer | seed only |
| novita | https://api.novita.ai | Bearer | seed only |
| lmstudio | user-provided | None | seed only |
| vllm | user-provided | None/Bearer | seed only |
| openrouter | https://openrouter.ai | Bearer | seed only |
| hyperbolic | https://api.hyperbolic.xyz | Bearer | seed only |
| replicate | https://api.replicate.com | Bearer | seed only |
| cohere | https://api.cohere.ai | Bearer | seed only |
| azure-openai | user-provided | api-key | seed only |
| google-vertex | user-provided | GCP ADC | seed only |
| aws-bedrock | AWS SDK v3 | AWS creds | seed only |

## Acceptance Criteria

### AC1: Adapters Funcionam
- Todos os 16 providers têm adapter real que faz chamadas HTTP
- GET /v1/models retorna lista real de modelos

### AC2: Health Check Real
- Health check tenta pingar a API real com timeout 3s
- Retorna latency real quando API responde

### AC3: Fallback para Seed
- Quando API falha (timeout, erro, sem credenciais), retorna seed data
- Usuário sempre tem modelo para selecionar

### AC4: TypeScript Compila
- `npx tsc --noEmit` passa para backend e frontend

### AC5: Code Philosophy Compliance
- Early Exit em todos os adapters
- Parse Don't Validate nos retornos de API
- Fail Fast com erros descritivos

## Constraints

- Sem novas dependências externas (exceto AWS SDK para Bedrock se necessário)
- Padrão OpenAI-compatible para endpoints
- Timeout 3s para todas as chamadas HTTP
- Seguir code-philosophy: Early Exit, Parse Don't Validate, Atomic Predictability, Fail Fast, Intentional Naming
