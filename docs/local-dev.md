# Desenvolvimento Local — Andromeda SO

Guia para subir o ambiente de desenvolvimento local onde kernel e frontend rodam
diretamente no terminal com hot-reload, e apenas PostgreSQL e Redis ficam no Docker.

## Pré-requisitos

- Node.js 20+
- Docker Desktop (ou Docker Engine + Compose plugin)
- Ollama rodando em `localhost:11434` — [instalar](https://ollama.ai)
- Ao menos um modelo Ollama instalado: `ollama pull llama3.2`

## Portas utilizadas

| Serviço    | Porta |
|------------|-------|
| Kernel     | 4000  |
| Frontend   | 5173  |
| PostgreSQL | 5432  |
| Redis      | 6379  |
| Ollama     | 11434 |

## Passo a passo

### 1. Subir infraestrutura Docker

```bash
docker-compose -f docker-compose.infra.yml up -d
```

Aguarde o healthcheck do PostgreSQL ficar `healthy`:

```bash
docker-compose -f docker-compose.infra.yml ps
```

### 2. Rodar migrations do banco

```bash
cd core/kernel && npm run migrate
```

### 3. Iniciar o kernel com hot-reload

```bash
cd core/kernel && npm run dev
```

O kernel estará disponível em `http://localhost:4000`.

### 4. Iniciar o frontend

Em outro terminal:

```bash
cd frontend && npm run dev
```

O frontend estará disponível em `http://localhost:5173`.

## Variáveis de ambiente

O kernel lê `core/kernel/.env` automaticamente. Copie o exemplo se necessário:

```bash
cp core/kernel/.env.example core/kernel/.env
```

| Variável | Valor padrão | Descrição |
|---|---|---|
| `DATABASE_URL` | `postgres://andromeda:andromeda@localhost:5432/andromeda` | Conexão PostgreSQL |
| `REDIS_URL` | `redis://localhost:6379` | Conexão Redis |
| `PROVIDER_REPOSITORY_MODE` | `auto` | Modo do repositório de providers |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | Endereço do Ollama |
| `PORT` | `4000` | Porta do kernel |
| `NODE_ENV` | `development` | Ambiente |
| `PG_REQUIRED` | `false` | Se true, falha se PostgreSQL indisponível |

## Verificar se o ambiente está funcionando

```bash
cd core/kernel && npm run test -- local-env
```

Este comando executa testes de conexão com PostgreSQL, persistência de providers
e conectividade com o Ollama. Requer infraestrutura rodando.

## Resetar o banco de desenvolvimento

```bash
docker-compose -f docker-compose.infra.yml down -v
docker-compose -f docker-compose.infra.yml up -d
cd core/kernel && npm run migrate
```

## Diferença entre ambientes

| | Desenvolvimento local | Produção |
|---|---|---|
| Kernel | `tsx --watch` no host | Container Docker |
| Frontend | Vite no host | Container Docker (nginx) |
| PostgreSQL | Docker, porta 5432 | Docker, porta 5433 |
| Redis | Docker, porta 6379 | Docker, porta 6380 |
| Compose file | `docker-compose.infra.yml` | `docker-compose.prod.yml` |
