# Plano de Implementação: provider-persistence-docker

## Requisitos

- **Requisito 1**: Ativar PostgreSQL no container de produção
- **Requisito 2**: Configurar URL base do Ollama para Docker
- **Requisito 3**: Documentar variáveis de ambiente de produção

---

## Tarefas

### 1. Atualizar docker-compose.prod.yml com variáveis de ambiente

**Requisito(s):** 1, 2

- [x] 1.1. Adicionar `PROVIDER_REPOSITORY_MODE=postgres` ao serviço kernel
  - Confirmação: `docker-compose.prod.yml` linha 51
  - Impacto: Provider_Repository_Factory usará ProviderRepositoryPostgres

- [x] 1.2. Adicionar `OLLAMA_BASE_URL=http://host.docker.internal:11434` ao serviço kernel
  - Confirmação: `docker-compose.prod.yml` linha 52
  - Impacto: OllamaAdapter tentará conectar ao Ollama do host no Docker Desktop

- [x] 1.3. Garantir `NODE_ENV=production` no serviço kernel
  - Confirmação: `docker-compose.prod.yml` linha 47
  - Impacto: Usado pelo OllamaAdapter para detectar ambiente Docker

---

### 2. Atualizar ollama.adapter.ts para detectar ambiente Docker

**Requisito(s):** 2

- [x] 2.1. Adicionar lógica `NODE_ENV === 'production'` para fallback host.docker.internal
  - Confirmação: `ollama.adapter.ts` linhas 29-33
  - Detalhamento: `baseUrl ?? process.env.OLLAMA_BASE_URL ?? (NODE_ENV === 'production' ? 'http://host.docker.internal:11434' : DEFAULT_BASE_URL)`

- [x] 2.2. Manter DEFAULT_BASE_URL como `http://127.0.0.1:11434` para desenvolvimento local
  - Confirmação: `ollama.adapter.ts` linha 16
  - Impacto: Desenvolvimento sem Docker continua funcionando

---

### 3. Documentar .env.prod.example com variáveis de produção

**Requisito(s):** 3

- [x] 3.1. Adicionar `PROVIDER_REPOSITORY_MODE` com comentário explicativo
  - Confirmação: `.env.prod.example` linhas 8-9
  - Valor: `postgres`
  - Comentário: "Modo do repositório de providers: postgres para produção com PostgreSQL"

- [x] 3.2. Adicionar `OLLAMA_BASE_URL` com comentário explicativo
  - Confirmação: `.env.prod.example` linhas 11-12
  - Valor: `http://host.docker.internal:11434`
  - Comentário: "URL base do Ollama no Docker Desktop (Windows/Mac) — aponta para o host"

---

## Status

| Tarefa | Status |
|--------|--------|
| docker-compose.prod.yml atualizado | ✅ Concluído |
| ollama.adapter.ts com fallback Docker | ✅ Concluído |
| .env.prod.example documentado | ✅ Concluído |

## Arquivos Modificados

| Arquivo | Mudanças |
|---------|---------|
| `docker-compose.prod.yml` | +2 variáveis de ambiente (PROVIDER_REPOSITORY_MODE, OLLAMA_BASE_URL) |
| `core/kernel/src/modules/providers/infrastructure/adapters/ollama.adapter.ts` | +Lógica de fallback para host.docker.internal |
| `.env.prod.example` | +2 variáveis documentadas com comentários |
