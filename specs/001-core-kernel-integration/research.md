# Research: Core Kernel Integration

## Decision 1: Manifest descriptor and discovery rules
- Chosen: `module.manifest.yaml` with fields (id, name, group, variant, version, entrypoint, contracts, dependencies, capabilities, critical, enabled)
- Rationale: alinha com constituição de modularidade, versão e contratos claros.
- Alternatives:
  - JSON manifest: rejeitado por preferir YAML para leitura e configuração humana.

## Decision 2: Contract validation
- Chosen: Zod para validação de entradas/saídas do core e dos módulos, com geração de tipos TypeScript.
- Rationale: compatibilidade JavaScript + garantia de runtime.
- Alternatives:
  - AJV/JSON Schema: menos ergonomia para devs TS.

## Decision 3: Registry persistente
- Chosen: Drizzle ORM + PostgreSQL como armazenamento de auditoria + Redis como cache operante.
- Rationale: dual-mode (memória para runtime, persistência para recovery e auditoria) requisição no spec.
- Alternatives:
  - apenas Redis: sem historico forte e atomicidade transacional falha.

## Decision 4: Lifecycle states
- Chosen: pipeline de estados com máquina explícita: discovered, registered, validated, loaded, initialized, running, stopped, failed.
- Rationale: cobre requisitos e facilita debug/observability.
- Alternatives:
  - Heimdall inspired event bus: mais complexo para v1

## Decision 5: Circular dependencies
- Chosen: proibição como erro de validação.
- Rationale: mantém estabilidade; adequa-se à regra de não loops implícitos.

## Decision 6: Expansão do core
- Chosen: regras de plugin via contratos canônicos para que novos tipos de módulo sejam registrados e validados sem alterar loops centrais.
- Rationale: atende Artigo V e IV da constituição.
