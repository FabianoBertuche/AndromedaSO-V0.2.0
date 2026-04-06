# cognitive-python

Serviço interno do MVP05 para a fundação cognitiva híbrida do Andromeda.

## Objetivo

Este serviço **não substitui** o kernel TypeScript. Ele expõe endpoints internos estáveis para sinais cognitivos, health checks e futura expansão em `rag`, `memory`, `eval`, `benchmark`, `planner` e `documents`.

## Requisitos

- Python 3.11+
- dependências de `requirements.txt`

## Instalação

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Execução

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8008 --reload
```

## Variáveis de ambiente

- `COGNITIVE_SERVICE_AUTH_TOKEN`: quando definida, exige `X-Service-Token` em todas as rotas internas.

## Endpoints

- `GET /health`
- `GET /readiness`
- `POST /v1/integration/ping`
- `POST /v1/cognitive/classify`

## Observações

- O contrato de request/response é canônico e compatível com o adapter TypeScript do MVP05.
- O endpoint de classificação é **não autoritativo**. A decisão final de roteamento continua no kernel TypeScript.
