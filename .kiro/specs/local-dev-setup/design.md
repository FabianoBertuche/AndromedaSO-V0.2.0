# Design Técnico — local-dev-setup

## Visão Geral

Esta feature reorganiza o ambiente de desenvolvimento do Andromeda SO para eliminar a sobrecarga de containers Node.js. O kernel e o frontend passam a rodar diretamente no terminal do host com hot-reload nativo via `tsx --watch`, enquanto apenas PostgreSQL e Redis continuam no Docker. O Ollama já roda no host em `localhost:11434`.

O objetivo central é garantir que providers, catálogos e benchmarks persistam entre restarts do kernel via PostgreSQL, e que o ambiente seja configurável por variáveis de ambiente sem alteração de código.

```
┌─────────────────────────────────────────────────────────┐
│                        HOST                             │
│                                                         │
│  ┌──────────────────┐    ┌──────────────────────────┐  │
│  │  kernel (tsx)    │    │  frontend (vite)         │  │
│  │  :4000           │    │  :5173                   │  │
│  └────────┬─────────┘    └──────────────────────────┘  │
│           │                                             │
│  ┌────────▼─────────────────────────────────────────┐  │
│  │              Docker (infra only)                 │  │
│  │  ┌─────────────────┐  ┌──────────────────────┐  │  │
│  │  │  postgres:16    │  │  redis:7-alpine      │  │  │
│  │  │  :5432          │  │  :6379               │  │  │
│  │  └─────────────────┘  └──────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────┐                                   │
│  │  Ollama (host)   │                                   │
│  │  :11434          │                                   │
│  └──────────────────┘                                   │
└─────────────────────────────────────────────────────────┘
```

---

## Arquitetura

### Separação de responsabilidades

| Camada | Onde roda | Como |
|---|---|---|
| PostgreSQL | Docker | `docker-compose.infra.yml` |
| Redis | Docker | `docker-compose.infra.yml` |
| Kernel (Node.js) | Host | `npm run dev` (tsx --watch) |
| Frontend (React) | Host | `npm run dev` (vite) |
| Ollama | Host | processo nativo |

### Fluxo de inicialização do kernel

```
npm run dev
  └─ tsx --watch src/index.ts
       └─ dotenv.config()  ← lê core/kernel/.env
            └─ validateEnvironment()
                 └─ getProviderRepository()
                      └─ resolveMode()  ← PROVIDER_REPOSITORY_MODE
                           ├─ 'memory'  → ProviderRepositoryMemory
                           ├─ 'postgres' → ProviderRepositoryPostgres (erro se falhar)
                           └─ 'auto'
                                ├─ NODE_ENV=test → ProviderRepositoryMemory
                                ├─ PostgreSQL OK → ProviderRepositoryPostgres
                                └─ PostgreSQL KO → ProviderRepositoryMemory + log warn
```

### Fluxo de resolução do Ollama adapter

```
ollamaAdapterFactory(apiKey?, baseUrl?)
  └─ base = baseUrl
          ?? process.env.OLLAMA_BASE_URL
          ?? 'http://127.0.0.1:11434'
```

---

## Componentes e Interfaces

### 1. `docker-compose.infra.yml` (novo arquivo na raiz)

Arquivo Docker Compose exclusivo para infraestrutura de desenvolvimento local. Não substitui nem altera `docker-compose.prod.yml`.

**Conteúdo exato:**

```yaml
services:
  postgres:
    image: postgres:16
    container_name: andromeda-postgres-dev
    restart: unless-stopped
    environment:
      POSTGRES_USER: andromeda
      POSTGRES_PASSWORD: andromeda
      POSTGRES_DB: andromeda
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U andromeda -d andromeda"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 20s

  redis:
    image: redis:7-alpine
    container_name: andromeda-redis-dev
    restart: unless-stopped
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

volumes:
  postgres_dev_data:
```

### 2. `core/kernel/.env` (atualização)

Variáveis completas para desenvolvimento local. Variáveis existentes não listadas são preservadas.

```dotenv
PORT=4000
DATABASE_URL=postgres://andromeda:andromeda@localhost:5432/andromeda
REDIS_URL=redis://localhost:6379
PROVIDER_REPOSITORY_MODE=auto
OLLAMA_BASE_URL=http://127.0.0.1:11434
NODE_ENV=development
PG_REQUIRED=false
```

### 3. `core/kernel/.env.example` (atualização)

```dotenv
# Porta do servidor HTTP do kernel
PORT=4000

# URL de conexão com o PostgreSQL
# Desenvolvimento local: postgres://andromeda:andromeda@localhost:5432/andromeda
DATABASE_URL=postgres://andromeda:andromeda@localhost:5432/andromeda

# URL de conexão com o Redis
REDIS_URL=redis://localhost:6379

# Modo do repositório de providers: auto | memory | postgres
# auto: usa PostgreSQL se disponível, senão in-memory
# memory: sempre in-memory (útil para testes sem banco)
# postgres: sempre PostgreSQL (falha se banco indisponível)
PROVIDER_REPOSITORY_MODE=auto

# URL base do Ollama (LLM local)
OLLAMA_BASE_URL=http://127.0.0.1:11434

# Ambiente de execução
NODE_ENV=development

# Se true, o kernel falha na inicialização caso o PostgreSQL não esteja acessível
PG_REQUIRED=false
```

### 4. Ollama Adapter — leitura de `OLLAMA_BASE_URL`

**Arquivo:** `core/kernel/src/modules/providers/infrastructure/adapters/ollama.adapter.ts`

Alteração mínima: a linha de resolução do `base` passa a consultar `process.env.OLLAMA_BASE_URL` antes do fallback hardcoded.

```typescript
// Antes:
const base = baseUrl ?? DEFAULT_BASE_URL;

// Depois:
const base = baseUrl ?? process.env.OLLAMA_BASE_URL ?? DEFAULT_BASE_URL;
```

O export `ollamaAdapter` (backward-compatible) permanece inalterado — ele chama `ollamaAdapterFactory()` sem argumentos, o que aciona a leitura da env var.

### 5. Provider Repository Factory — logger Pino

**Arquivo:** `core/kernel/src/modules/providers/infrastructure/repositories/provider.repository.factory.ts`

Substituição de `console.warn` por logger Pino nomeado `providers:factory`. Adição de log informativo ao selecionar o modo.

```typescript
import pino from 'pino';

const log = pino({ name: 'providers:factory' });

// Substituições:
// console.warn('[providers] PostgreSQL unavailable...')
// → log.warn('PostgreSQL indisponível, usando repositório in-memory como fallback')

// Adições:
// Após selecionar memoryRepository:
log.info({ mode: 'memory' }, 'Repositório de providers inicializado');

// Após selecionar postgresRepository:
log.info({ mode: 'postgres' }, 'Repositório de providers inicializado');
```

### 6. `package.json` do kernel — script `dev`

**Arquivo:** `core/kernel/package.json`

Adição do script `dev` sem remover nenhum script existente:

```json
"scripts": {
  "dev": "tsx --watch src/index.ts",
  "build": "tsc -p tsconfig.json",
  "lint": "eslint . --ext .ts",
  "test": "cross-env DOCKER_HOST=tcp://localhost:2375 vitest run",
  "test:watch": "cross-env DOCKER_HOST=tcp://localhost:2375 vitest",
  "start": "node scripts/start-auto.mjs",
  "start:local": "node scripts/start-auto.mjs --preferred=4010,4020,4030",
  "start:fixed": "tsx src/index.ts",
  "migrate": "drizzle-kit migrate",
  "benchmark": "autocannon -c 10 -d 20 http://localhost:4000/api/metrics",
  "benchmark:full": "npm run benchmark"
}
```

### 7. Arquivo de testes de verificação local

**Arquivo:** `core/kernel/src/__tests__/integration/local-env.test.ts`

```typescript
/**
 * Testes de verificação do ambiente de desenvolvimento local.
 *
 * Estes testes requerem infraestrutura real rodando:
 *   - PostgreSQL em DATABASE_URL (padrão: localhost:5432)
 *   - Ollama em OLLAMA_BASE_URL (padrão: http://127.0.0.1:11434)
 *
 * Para subir a infraestrutura:
 *   docker-compose -f docker-compose.infra.yml up -d
 *
 * Para rodar apenas estes testes:
 *   cd core/kernel && npm run test -- local-env
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from 'pg';
import { resetProviderRepositoryFactory, getProviderRepository } from
  '../../modules/providers/infrastructure/repositories/provider.repository.factory.js';

const isCI = process.env.CI === 'true';
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://andromeda:andromeda@localhost:5432/andromeda';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434';

describe.skipIf(isCI)('Local Environment Verification', () => {
  describe('PostgreSQL', () => {
    let client: Client;

    beforeAll(async () => {
      client = new Client({ connectionString: DATABASE_URL });
    });

    afterAll(async () => {
      await client.end().catch(() => {});
    });

    it('deve conectar ao PostgreSQL via DATABASE_URL', async () => {
      await expect(client.connect()).resolves.not.toThrow();
    });

    it('deve persistir provider entre restarts da factory', async () => {
      // Forçar modo postgres para este teste
      process.env.PROVIDER_REPOSITORY_MODE = 'postgres';
      resetProviderRepositoryFactory();

      const repo = await getProviderRepository();
      const provider = {
        id: `test-${Date.now()}`,
        name: `test-provider-${Date.now()}`,
        type: 'ollama' as const,
        health: 'unknown' as const,
        createdAt: new Date().toISOString(),
        selectedModelIds: []
      };

      await repo.create(provider);

      // Simular restart: resetar factory e obter nova instância
      resetProviderRepositoryFactory();
      const repoAfterRestart = await getProviderRepository();
      const found = await repoAfterRestart.findById(provider.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(provider.id);
      expect(found?.name).toBe(provider.name);

      // Cleanup
      resetProviderRepositoryFactory();
      process.env.PROVIDER_REPOSITORY_MODE = 'auto';
    });
  });

  describe('Ollama', () => {
    it('deve conectar ao Ollama via OLLAMA_BASE_URL', async () => {
      const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`).catch(() => null);

      if (!res) {
        throw new Error(
          `Ollama não está acessível em ${OLLAMA_BASE_URL}. ` +
          'Certifique-se de que o Ollama está rodando: https://ollama.ai'
        );
      }

      expect(res.status).toBe(200);
    });

    it('deve listar ao menos um modelo no Ollama', async () => {
      const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
      const json = await res.json() as { models: unknown[] };

      expect(Array.isArray(json.models)).toBe(true);
      expect(json.models.length).toBeGreaterThanOrEqual(1);
    });
  });
});
```

### 8. `docs/local-dev.md`

**Arquivo:** `docs/local-dev.md` (criar ou atualizar)

Conteúdo completo na seção de Modelos de Dados abaixo.

---

## Modelos de Dados

Nenhum novo modelo de dados é introduzido. A feature reutiliza as tabelas existentes criadas pelo `ProviderRepositoryPostgres.initialize()`:

- `provider_state`
- `provider_model_catalog`
- `provider_model_benchmark`
- `provider_routing_decision`

O volume Docker `postgres_dev_data` persiste os dados entre `docker-compose down` e `docker-compose up`. Para resetar o banco de desenvolvimento, usar:

```bash
docker-compose -f docker-compose.infra.yml down -v
docker-compose -f docker-compose.infra.yml up -d
cd core/kernel && npm run migrate
```

---

## Conteúdo de `docs/local-dev.md`

```markdown
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

O kernel lê `core/kernel/.env` automaticamente. As variáveis padrão já estão
configuradas para desenvolvimento local. Copie o exemplo se necessário:

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
```

---

## Propriedades de Corretude

*Uma propriedade é uma característica ou comportamento que deve ser verdadeiro em todas as execuções válidas de um sistema — essencialmente, uma declaração formal sobre o que o sistema deve fazer. Propriedades servem como ponte entre especificações legíveis por humanos e garantias de corretude verificáveis por máquinas.*

Com base na análise de prework, as propriedades testáveis como property-based tests são:

**Reflexão sobre redundância:**
- 3.1 e 3.3 testam aspectos complementares da resolução de `baseUrl` (env var vs argumento explícito). Podem ser combinados em uma única propriedade de precedência.
- 5.2 e 6.3 testam persistência de providers — 6.3 é o teste de integração real que valida 5.2. São equivalentes; manter apenas uma propriedade.
- 5.4 testa logging do modo selecionado — propriedade independente e valiosa.

### Propriedade 1: Resolução de baseUrl do Ollama adapter

*Para qualquer* URL base passada explicitamente como argumento para `ollamaAdapterFactory`, o adapter deve usar essa URL nas requisições, independentemente do valor de `process.env.OLLAMA_BASE_URL`.

**Valida: Requisito 3.3**

### Propriedade 2: Fallback de OLLAMA_BASE_URL para env var

*Para qualquer* valor válido de `process.env.OLLAMA_BASE_URL`, ao instanciar `ollamaAdapterFactory` sem argumento `baseUrl`, o adapter deve usar o valor da variável de ambiente nas requisições HTTP.

**Valida: Requisito 3.1**

### Propriedade 3: Persistência de providers entre restarts da factory

*Para qualquer* conjunto de providers criados via `ProviderRepositoryPostgres`, após chamar `resetProviderRepositoryFactory()` e obter uma nova instância do repositório, todos os providers criados devem ser recuperáveis por `findById`.

**Valida: Requisitos 5.2, 6.3**

### Propriedade 4: Log do modo de repositório selecionado

*Para qualquer* modo de repositório selecionado (`postgres` ou `memory`), o logger Pino com nome `providers:factory` deve emitir uma mensagem de nível `info` contendo o campo `mode` com o valor correspondente ao modo selecionado.

**Valida: Requisito 5.4**

---

## Tratamento de Erros

### Factory de repositório

| Situação | Modo `auto` | Modo `postgres` | Modo `memory` |
|---|---|---|---|
| PostgreSQL acessível | Usa PostgreSQL | Usa PostgreSQL | Usa memory |
| PostgreSQL inacessível | Fallback para memory + `log.warn` | Lança erro (kernel não sobe) | Usa memory |
| `DATABASE_URL` ausente | Fallback para memory + `log.warn` | Lança erro | Usa memory |

### Ollama adapter

| Situação | Comportamento |
|---|---|
| Ollama acessível | Retorna modelos reais + cloud seeds |
| Ollama inacessível | Retorna seed models + `log.warn` (graceful degradation existente) |
| `OLLAMA_BASE_URL` inválida | Erro de rede capturado, fallback para seeds |

### Testes de verificação local

Cada teste de integração deve capturar erros de conexão e relançar com mensagem descritiva:

```typescript
// Padrão de erro descritivo
if (!res) {
  throw new Error(
    `[local-env] Serviço X não está acessível em ${URL}. ` +
    'Para iniciá-lo: <comando>'
  );
}
```

---

## Estratégia de Testes

### Testes unitários (sem infraestrutura)

- `ollama.adapter.test.ts` — testar resolução de `baseUrl` com mocks de `fetch`
- `provider.repository.factory.test.ts` — testar seleção de modo e logging com mocks de `ProviderRepositoryPostgres`

### Testes de integração (requerem infraestrutura local)

- `local-env.test.ts` — verificação de conectividade real com PostgreSQL e Ollama
- Skippados automaticamente quando `CI=true`
- Executados manualmente pelo desenvolvedor: `npm run test -- local-env`

### Property-based testing

Usar [fast-check](https://github.com/dubzzz/fast-check) (já disponível no ecossistema Vitest) para as Propriedades 1, 2 e 4.

Para a Propriedade 3 (persistência), usar geração de providers com dados aleatórios via `fc.record`:

```typescript
// Exemplo de gerador para Propriedade 3
const providerArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  type: fc.constantFrom('ollama', 'openai'),
  health: fc.constantFrom('unknown', 'healthy', 'unhealthy'),
  createdAt: fc.date().map(d => d.toISOString()),
  selectedModelIds: fc.array(fc.string())
});
```

Cada property test deve rodar mínimo 100 iterações.

Tag format: `// Feature: local-dev-setup, Property {N}: {texto}`

### Configuração de testes

- Property tests: `vitest run` (sem infraestrutura)
- Integration tests: `vitest run --reporter=verbose` com infraestrutura local ativa
- CI pipeline: apenas property tests e unit tests (integration tests skippados via `CI=true`)
