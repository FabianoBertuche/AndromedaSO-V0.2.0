# Design — provider-persistence-docker

## Visão Geral

Este documento descreve a implementação de duas correções críticas para o ambiente Docker de produção:
1. Ativação do repositório PostgreSQL para persistência de providers
2. Configuração automática do adapter Ollama para Docker Desktop (Windows/Mac)

---

## 1. docker-compose.prod.yml

O serviço `kernel` no `docker-compose.prod.yml` foi atualizado com as seguintes variáveis de ambiente:

```yaml
kernel:
  # ... config existente ...
  environment:
    NODE_ENV: production
    PORT: 4000
    DATABASE_URL: postgres://andromeda:prodkey@postgres:5432/andromeda
    REDIS_URL: redis://redis:6379
    PROVIDER_REPOSITORY_MODE: postgres        # ← Novo: ativa repositório PostgreSQL
    OLLAMA_BASE_URL: http://host.docker.internal:11434  # ← Novo: URL do Ollama no host
```

### Detalhamento

| Variável | Valor | Propósito |
|----------|-------|-----------|
| `NODE_ENV` | `production` | Indica ambiente de produção (usado pelo OllamaAdapter para fallback) |
| `PROVIDER_REPOSITORY_MODE` | `postgres` | Força uso do ProviderRepositoryPostgres em vez de memória |
| `OLLAMA_BASE_URL` | `http://host.docker.internal:11434` | Permite ao container acessar Ollama no host Windows/Mac |

---

## 2. ollama.adapter.ts

O `ollama.adapter.ts` implementa detecção automática de ambiente Docker através da variável `NODE_ENV`:

```typescript
const base = baseUrl ?? process.env.OLLAMA_BASE_URL ?? (
  process.env.NODE_ENV === 'production' 
    ? 'http://host.docker.internal:11434' 
    : DEFAULT_BASE_URL  // 'http://127.0.0.1:11434'
);
```

### Lógica de Fallback

| Condição | URL Base Usada |
|----------|---------------|
| `baseUrl` fornecido (parâmetro) | `baseUrl` (sobrescreve tudo) |
| `OLLAMA_BASE_URL` definida | `process.env.OLLAMA_BASE_URL` |
| `NODE_ENV === 'production'` | `http://host.docker.internal:11434` |
| Caso contrário (desenvolvimento) | `http://127.0.0.1:11434` |

### Comportamento

1. **Sucesso**: Retorna modelos locais do Ollama mesclados com modelos cloud do seed
2. **Falha (timeout 5s)**: Registra aviso no log e retorna apenas dados de seed

---

## 3. .env.prod.example

O arquivo `.env.prod.example` foi documentado com as variáveis de produção:

```bash
# Modo do repositório de providers: postgres para produção com PostgreSQL
PROVIDER_REPOSITORY_MODE=postgres

# URL base do Ollama no Docker Desktop (Windows/Mac) — aponta para o host
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

---

## Decisões de Design

1. **Fallback automático via NODE_ENV**: Preferimos detectar `production` em vez de exigir variável extra, pois o `docker-compose.prod.yml` já define `NODE_ENV=production`.

2. **hostname `host.docker.internal`**: Padrão Docker Desktop para Windows/Mac que resolve para o IP do host. Não funciona em Linux (que usa `network_mode: host` ou `--add-host`).

3. **PROVIDER_REPOSITORY_MODE=postgres**: Configuração explícita em vez de `auto` garante que o operador seja forçado a escolher persistência em produção.
