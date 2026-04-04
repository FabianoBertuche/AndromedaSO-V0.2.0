# CONTEXT — local-dev-setup

## Para o OpenCode: leia este arquivo antes de qualquer implementação

Este spec reorganiza o ambiente de desenvolvimento do Andromeda SO. As mudanças são cirúrgicas e bem definidas — leia os três arquivos abaixo na ordem indicada antes de escrever qualquer código.

---

## Arquivos do spec (ler nesta ordem)

1. `.kiro/specs/local-dev-setup/requirements.md` — o que fazer e por quê
2. `.kiro/specs/local-dev-setup/design.md` — como fazer (conteúdo exato dos arquivos)
3. `.kiro/specs/local-dev-setup/tasks.md` — lista de tasks para executar

## Steering files obrigatórios

- `.kiro/steering/tech.md` — stack, versões, comandos
- `.kiro/steering/structure.md` — estrutura de pastas
- `.kiro/steering/opencode-workflow.md` — convenções de código e workflow

---

## Resumo do que este spec faz

**Objetivo:** Rodar kernel e frontend localmente (Node.js direto), com apenas PostgreSQL e Redis no Docker.

**Problema atual:** Tudo roda via Docker, providers somem ao reiniciar, Ollama não conecta corretamente.

**Solução:**
1. Criar `docker-compose.infra.yml` — apenas postgres + redis
2. Criar `core/kernel/.env` com variáveis corretas para desenvolvimento local
3. Atualizar `ollama.adapter.ts` para ler `OLLAMA_BASE_URL` da env
4. Atualizar `provider.repository.factory.ts` para usar Pino em vez de console.warn
5. Adicionar script `dev` no `package.json` do kernel (`tsx --watch`)
6. Criar testes de verificação do ambiente local
7. Criar `docs/local-dev.md`

---

## Arquivos a criar/modificar

| Arquivo | Ação |
|---|---|
| `docker-compose.infra.yml` | CRIAR — postgres:16 + redis:7-alpine |
| `core/kernel/.env` | CRIAR/ATUALIZAR — variáveis de dev local |
| `core/kernel/.env.example` | ATUALIZAR — documentar todas as variáveis |
| `core/kernel/src/modules/providers/infrastructure/adapters/ollama.adapter.ts` | MODIFICAR — 1 linha |
| `core/kernel/src/modules/providers/infrastructure/repositories/provider.repository.factory.ts` | MODIFICAR — substituir console.warn por Pino |
| `core/kernel/package.json` | MODIFICAR — adicionar script "dev" |
| `core/kernel/src/__tests__/integration/local-env.test.ts` | CRIAR — testes de verificação |
| `docs/local-dev.md` | CRIAR — documentação do fluxo |

**NÃO modificar:** `docker-compose.yml`, `docker-compose.prod.yml`, `.env.prod`

---

## Variáveis de ambiente do kernel (desenvolvimento local)

```dotenv
PORT=4000
DATABASE_URL=postgres://andromeda:andromeda@localhost:5432/andromeda
REDIS_URL=redis://localhost:6379
PROVIDER_REPOSITORY_MODE=auto
OLLAMA_BASE_URL=http://127.0.0.1:11434
NODE_ENV=development
PG_REQUIRED=false
```

---

## Mudança crítica no ollama.adapter.ts

Apenas uma linha muda:

```typescript
// ANTES:
const base = baseUrl ?? DEFAULT_BASE_URL;

// DEPOIS:
const base = baseUrl ?? process.env.OLLAMA_BASE_URL ?? DEFAULT_BASE_URL;
```

---

## Após implementar

Avise o Kiro para:
1. Verificar via Playwright se o ambiente está funcionando
2. Rodar os testes de verificação local
3. Confirmar que providers persistem após restart do kernel
