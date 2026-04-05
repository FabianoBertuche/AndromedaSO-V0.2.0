# CONTEXT — agents-module

## Para o OpenCode: leia este arquivo antes de qualquer implementação

Este spec introduz o módulo de agentes do Andromeda SO V0.2.0 como um subsistema modular para:

1. criar agentes configuráveis;
2. editar agentes existentes;
3. excluir agentes logicamente;
4. duplicar agentes existentes;
5. ativar e desativar agentes;
6. instanciar agentes por template;
7. carregar agentes já resolvidos para execução;
8. descobrir templates adicionados por pasta;
9. resolver a configuração final do agente de forma determinística e rastreável.

Fora do escopo inicial deste spec:

1. execução multi-agent complexa;
2. orchestration avançada;
3. memory longa sofisticada;
4. RAG avançado;
5. avaliação automática;
6. marketplace de templates;
7. versionamento distribuído externo.

---

## Arquivos do spec (ler nesta ordem)

1. `.kiro/specs/agents-module/requirements.md`
2. `.kiro/specs/agents-module/design.md`
3. `.kiro/specs/agents-module/tasks.md`

## Steering files obrigatórios

- `.kiro/steering/tech.md`
- `.kiro/steering/structure.md`
- `.kiro/steering/product.md`
- `.kiro/steering/opencode-workflow.md`

---

## Objetivo arquitetural

O módulo de agentes DEVE nascer como módulo raiz próprio em `modules/agents/`, com manifestos, contratos e estrutura por grupos/variantes/templates. O core/kernel DEVE consumir apenas contratos canônicos, manifests, discovery e registry, sem depender de detalhes internos de cada template.

---

## Arquivos previstos

### Módulo declarativo (`modules/agents/`)

| Arquivo | Ação |
|---|---|
| `modules/agents/module.manifest.yaml` | CRIAR |
| `modules/agents/README.md` | CRIAR |
| `modules/agents/contracts/agent-instance.contract.json` | CRIAR |
| `modules/agents/contracts/agent-template.contract.json` | CRIAR |
| `modules/agents/contracts/resolved-agent.contract.json` | CRIAR |
| `modules/agents/groups/default/group.manifest.yaml` | CRIAR |
| `modules/agents/groups/default/variants/base/variant.manifest.yaml` | CRIAR |
| `modules/agents/groups/default/variants/base/templates/*/template.manifest.yaml` | CRIAR |
| `modules/agents/groups/default/variants/base/templates/*/config.*` | CRIAR |
| `modules/agents/groups/default/variants/base/templates/*/metadata.*` | CRIAR |
| `modules/agents/groups/default/variants/base/templates/*/tests/*` | CRIAR |
| `modules/agents/groups/default/variants/base/templates/*/scenarios/*` | CRIAR |

### Kernel (`core/kernel/src/`)

| Arquivo | Ação |
|---|---|
| `contracts/agentModule.schema.ts` | CRIAR |
| `contracts/agentTemplate.schema.ts` | CRIAR |
| `contracts/resolvedAgent.schema.ts` | CRIAR |
| `modules/agents/domain/entities/agent.entity.ts` | CRIAR |
| `modules/agents/domain/repositories/agent.repository.ts` | CRIAR |
| `modules/agents/domain/services/agentConfigResolver.ts` | CRIAR |
| `modules/agents/domain/services/agentTemplateDiscovery.ts` | CRIAR |
| `modules/agents/infrastructure/repositories/agent.repository.memory.ts` | CRIAR |
| `modules/agents/infrastructure/repositories/agent.repository.postgres.ts` | CRIAR |
| `modules/agents/infrastructure/repositories/agent.repository.factory.ts` | CRIAR |
| `modules/agents/services/agentApplicationService.ts` | CRIAR |
| `modules/agents/routes/agentRoutes.ts` | CRIAR |
| `modules/agents/__tests__/...` | CRIAR |

---

## Pontos críticos

### Resolução determinística

A configuração final do agente DEVE seguir ordem fixa de precedência, sem defaults ocultos fora desta cadeia:

1. template base;
2. parâmetros padrão do template;
3. overrides do agente;
4. parâmetros operacionais explícitos da operação;
5. bindings válidos para provider/model/channel quando aplicável.

### Campos explícitos do runtime

O runtime DEVE refletir exatamente os campos resolvidos, incluindo no mínimo:

1. `name`;
2. `slug` ou `id`;
3. `description`;
4. `role`;
5. `goal`;
6. `personality`;
7. `tone`;
8. `responseStyle`;
9. `systemInstructions`;
10. `restrictions`;
11. `securityRules`;
12. `defaultLanguage`;
13. `tags` ou `categories`;
14. `status`;
15. `visibility`;
16. `sourceTemplateId`;
17. `preferredModel` ou `compatibleModelStrategy`;
18. `allowedChannels`;
19. `enabledCapabilities`.

### Carga estrita do agente

O runtime NÃO DEVE executar um agente com configuração parcial. Toda carga deve passar pela resolução e validação do `ResolvedAgentConfig`.

### Templates adicionáveis por pasta

Adicionar um novo template DEVE significar adicionar nova pasta em `templates/<template-id>/`, sem alterar código do kernel. Cada template DEVE conter pelo menos:

1. `template.manifest.yaml`;
2. arquivo de configuração;
3. metadata;
4. tests;
5. scenarios.

Instanciar um agente por template DEVE materializar uma configuração inicial editável, manter vínculo com o template de origem para rastreabilidade e NÃO DEVE sobrescrever automaticamente agentes já criados quando o template mudar.
