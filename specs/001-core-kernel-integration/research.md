# Research: Core Kernel Integration

## Decision 1: Canonical module manifest and discovery boundary
- Decision: usar `module.manifest.yaml` como ponto único de entrada do discovery, com schema canônico em `core/kernel/src/contracts/moduleManifest.schema.ts`.
- Rationale: atende os Artigos VI, VII e VIII da constituição e permite que o core descubra módulos sem acoplamento ao código interno das variantes.
- Alternatives considered:
  - JSON puro: descartado por pior ergonomia para configuração humana.
  - Discovery por convenção implícita sem manifesto: descartado por reduzir rastreabilidade e validação.

## Decision 2: Contract validation with Zod and semver-major compatibility
- Decision: validar contratos com Zod em `core/kernel/src/contracts/moduleContract.schema.ts` e tratar compatibilidade por major de semver como regra mínima de aceitação.
- Rationale: a stack oficial do projeto já usa Zod, e a checagem de major reduz risco de quebra enquanto mantém a validação simples no v1.
- Alternatives considered:
  - AJV/JSON Schema como engine principal: descartado por não ser a convenção principal do core.
  - Compatibilidade total por string exata: descartado por ser rígido demais para evolução controlada.

## Decision 3: Dual registry model
- Decision: manter registry operacional em memória e persistir estado/eventos em PostgreSQL por meio de Drizzle e dos adaptadores em `core/kernel/src/store/`.
- Rationale: satisfaz FR-006, mantém acesso rápido no runtime e preserva trilha de auditoria para recuperação.
- Alternatives considered:
  - PostgreSQL apenas: descartado por aumentar acoplamento de runtime ao banco.
  - Redis como fonte principal: descartado por não ser o sistema de registro primário oficial da constituição.

## Decision 4: Explicit lifecycle state machine
- Decision: usar máquina de estados explícita com os estados `discovered`, `registered`, `validated`, `loaded`, `initialized`, `running`, `stopped` e `failed`.
- Rationale: satisfaz FR-005, facilita observabilidade, previne transições inválidas e melhora testabilidade.
- Alternatives considered:
  - Lifecycle implícito distribuído em serviços: descartado por dificultar validação e auditoria.
  - Event bus mais genérico para o v1: descartado por complexidade prematura.

## Decision 5: Reject circular dependencies and incompatible variants before load
- Decision: tratar dependências circulares e incompatibilidade de versão como erros de validação antes do carregamento.
- Rationale: satisfaz FR-007 e FR-008, reduz falhas tardias e evita loops operacionais difíceis de depurar.
- Alternatives considered:
  - Resolver ciclos automaticamente: descartado por comportamento pouco previsível.
  - Deixar falhar apenas em runtime: descartado por piorar segurança operacional.

## Decision 6: Kernel growth through extension contracts
- Decision: permitir absorção de novos tipos de módulo por contratos e pontos de extensão do core, preservando `core/kernel` como centro sistêmico.
- Rationale: atende FR-010 e os Artigos IV e V, mantendo o crescimento arquitetural por integração estrutural, não por exceções locais.
- Alternatives considered:
  - Criar fluxos dedicados por tipo de módulo: descartado por fragmentar a arquitetura.
  - Acoplar regras por variante dentro do core: descartado por violar contratos canônicos.
