# Plano de Implementação: agents-module

## Visão Geral

Implementação do módulo de agentes como subsistema modular do Andromeda SO, com contratos canônicos, estrutura declarativa em `modules/agents/`, criação/edição/soft delete/duplicação/ativação/desativação de instâncias, catálogo de templates por pasta, resolução determinística da configuração final e carga estrita para execução.

O plano desta spec refere-se exclusivamente ao módulo `agents` em `.kiro/specs/agents-module/` e substitui qualquer referência operacional anterior a `specs/001-core-kernel-integration`.

### Escopo explícito deste plano

1. Implementar a estrutura modular `modules/agents/...` com organização por `groups` e `variants`.
2. Materializar explicitamente os contratos e entidades centrais: `Agent`, `AgentTemplate`, `AgentResolvedConfig`, `AgentBehaviorProfile`, `AgentExecutionPolicy`, `AgentChannelPolicy`, `AgentModelPolicy`, `AgentAuditRecord`.
3. Integrar o módulo ao core por manifests, registry, discovery e contratos canônicos.
4. Adotar persistência recomendada com PostgreSQL como principal e memória como fallback, sem quebrar determinismo.
5. Expor superfície de uso por serviço de aplicação e API HTTP.
6. Executar a implementação em ordem TDD, começando por contratos e testes de resolução/discovery.

## Tarefas

- [x] 1. Criar a raiz declarativa `modules/agents/`
  - Criar `modules/agents/module.manifest.yaml` e `modules/agents/README.md`
  - Criar `modules/agents/contracts/agent-instance.contract.json`, `agent-template.contract.json` e `resolved-agent.contract.json`
  - Criar a estrutura inicial `groups/default/variants/base/templates/` com responsabilidade explícita de `group` e `variant`
  - Adicionar ao menos dois templates iniciais (`assistant` e `reviewer`) com `template.manifest.yaml`, `config`, `metadata`, `tests` e `scenarios`
  - _Requisitos: 1.1, 1.2, 1.3, 7.1_

- [x] 2. Definir contratos canônicos no kernel
  - Criar `core/kernel/src/contracts/agentModule.schema.ts` com `agentInstanceSchema`
  - Criar `core/kernel/src/contracts/agentTemplate.schema.ts` com `agentTemplateManifestSchema`
  - Criar `core/kernel/src/contracts/resolvedAgent.schema.ts` com `resolvedAgentSchema`
  - Incluir campos explícitos de identidade, papel e objetivo, personalidade, instruções, modelo/execução, capacidades, canais/integração e governança
  - Derivar contratos de entrada para `create`, `update`, `duplicate`, `activate`, `deactivate` e `load` sem duplicar validações fora dos schemas canônicos
  - Garantir export de tipos TypeScript inferidos via Zod
  - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Criar entidades e interface de repositório do módulo de agentes
  - Criar `core/kernel/src/modules/agents/domain/entities/agent.entity.ts`
  - Criar `core/kernel/src/modules/agents/domain/repositories/agent.repository.ts`
  - Declarar explicitamente os blocos de domínio `AgentBehaviorProfile`, `AgentExecutionPolicy`, `AgentChannelPolicy` e `AgentModelPolicy` como subestruturas tipadas do agente
  - Declarar contratos `list`, `getById`, `create`, `update`, `softDelete` e operações necessárias para duplicação e troca de status
  - Definir o contrato mínimo de `AgentAuditRecord` para rastreabilidade de operações críticas
  - _Requisitos: 3.1, 4.1, 5.1, 6.1, 6.3, 10.1, 10.7_

- [x] 4. Implementar repositório em memória
  - Criar `core/kernel/src/modules/agents/infrastructure/repositories/agent.repository.memory.ts`
  - Implementar persistência em `Map` com erros determinísticos para `not found`
  - Preservar semântica de versão, timestamps e `deletedAt` na atualização e exclusão lógica
  - _Requisitos: 3.5, 4.2, 4.5, 5.2, 5.3, 6.1, 6.3, 10.2_

- [x] 5. Implementar persistência PostgreSQL e factory do repositório
  - Adicionar tabela `agent_instances` ao schema Drizzle do kernel
  - Criar `agent.repository.postgres.ts`
  - Criar `agent.repository.factory.ts` seguindo o padrão de fallback do kernel
  - Incluir colunas necessárias para `sourceTemplateId`, status, visibilidade e `deletedAt`
  - Preservar os blocos de política e overrides em formato compatível com resolução determinística
  - Preparar persistência recomendada de auditoria e/ou snapshot apenas como complemento, sem transformar snapshot em fonte de verdade
  - Garantir que a camada de aplicação dependa apenas de `AgentRepository`
  - _Requisitos: 5.1, 10.1, 10.3, 10.4, 10.7_

- [x] 6. Checkpoint — validar compilação após a base de persistência
  - Executar `npx tsc --noEmit` em `core/kernel/`
  - Corrigir erros antes de avançar

- [x] 7. Implementar discovery declarativo de templates
  - Criar `core/kernel/src/modules/agents/domain/services/agentTemplateDiscovery.ts`
  - Descobrir arquivos em `modules/agents/groups/*/variants/*/templates/*/template.manifest.yaml`
  - Validar manifests com `agentTemplateManifestSchema`
  - Validar presença e contrato de `config`, `metadata`, `tests` e `scenarios`
  - Rejeitar duplicidade de `templateId`
  - Ordenar catálogo de forma determinística
  - Expor ao catálogo `group`, `variant`, metadata, config e defaults necessários para composição do domínio
  - _Requisitos: 1.4, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 8. Implementar resolução determinística da configuração final
  - Criar `core/kernel/src/modules/agents/domain/services/agentConfigResolver.ts`
  - Implementar ordem de precedência `template base -> defaults do template -> overrides do agente -> parâmetros operacionais explícitos -> bindings válidos`
  - Garantir ausência de defaults implícitos fora dessa cadeia
  - Implementar regras explícitas de merge para objetos, listas, escalares, restrições e regras de segurança
  - Resolver explicitamente os blocos `AgentBehaviorProfile`, `AgentExecutionPolicy`, `AgentChannelPolicy` e `AgentModelPolicy`
  - Gerar `resolutionTrace` e `configHash`
  - Validar o resultado com `resolvedAgentSchema`
  - _Requisitos: 2.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.6_

- [x] 9. Implementar serviço de aplicação do módulo de agentes
  - Criar `core/kernel/src/modules/agents/services/agentApplicationService.ts`
  - Implementar `listTemplates`, `listAgents`, `createAgent`, `updateAgent`, `duplicateAgent`, `activateAgent`, `deactivateAgent`, `deleteAgent` e `loadAgent`
  - Validar referências a templates antes de persistir alterações
  - Materializar configuração inicial editável na criação por template
  - Incrementar versão lógica em updates bem-sucedidos
  - Executar soft delete por padrão
  - Bloquear carga quando a resolução final falhar
  - Registrar `AgentAuditRecord` ou logger estruturado equivalente para operações críticas
  - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 6.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 10. Expor rotas HTTP do módulo de agentes
  - Criar `core/kernel/src/modules/agents/routes/agentRoutes.ts`
  - Registrar endpoints `GET /api/agents/templates`, `GET /api/agents`, `GET /api/agents/:id`, `POST /api/agents`, `PUT /api/agents/:id`, `DELETE /api/agents/:id`, `POST /api/agents/:id/duplicate`, `POST /api/agents/:id/activate`, `POST /api/agents/:id/deactivate`, `POST /api/agents/:id/load`
  - Mapear erros de validação para respostas HTTP descritivas
  - Integrar as rotas ao servidor Fastify do kernel sem quebrar contratos existentes
  - Manter explícitos os contratos de entrada e saída da superfície de uso/API
  - _Requisitos: 5.1, 5.3, 6.1, 6.3, 9.1, 9.5, 11.1, 11.2, 11.3_

- [x] 11. Escrever testes unitários para discovery e resolução
  - Criar primeiro os testes antes da implementação final do discovery e do resolver, seguindo TDD
  - Criar testes para templates válidos, inválidos e duplicados
  - Criar teste para rejeição de template sem `config`, `metadata`, `tests` ou `scenarios`
  - Criar teste para resolução determinística com mesmo `configHash` para mesma entrada
  - Criar teste para ausência de defaults implícitos fora da cadeia permitida
  - Criar teste para bindings válidos alterando `resolutionTrace` apenas quando aplicáveis
  - _Requisitos: 7.2, 7.4, 7.5, 8.2, 8.3, 8.4, 8.5, 11.4_

- [x] 12. Escrever testes unitários para repositório e serviço de aplicação
  - Criar primeiro os testes de repositório em memória e da aplicação antes de fechar a implementação do serviço
  - Cobrir `AgentRepositoryMemory` em create, update, soft delete e not found
  - Cobrir `AgentApplicationService.createAgent`, `updateAgent`, `duplicateAgent`, `activateAgent`, `deactivateAgent`, `deleteAgent` e `loadAgent`
  - Cobrir rastreabilidade mínima por `AgentAuditRecord` ou logger equivalente
  - Verificar bloqueio de carga quando o config final for inválido
  - _Requisitos: 3.5, 4.3, 4.4, 5.2, 5.3, 6.1, 6.3, 6.4, 9.4, 9.5, 11.5_

- [x] 13. Escrever testes de integração HTTP do módulo
  - Executar os cenários HTTP sobre a superfície pública real do módulo `agents`
  - Testar `GET /api/agents/templates`
  - Testar `POST /api/agents`
  - Testar `PUT /api/agents/:id`
  - Testar `DELETE /api/agents/:id`
  - Testar `POST /api/agents/:id/duplicate`
  - Testar `POST /api/agents/:id/activate` e `POST /api/agents/:id/deactivate`
  - Testar `POST /api/agents/:id/load`
  - _Requisitos: 11.1, 11.6_

- [x] 14. Checkpoint final — validar compilação e suíte de testes
  - Executar `npx tsc --noEmit` em `core/kernel/`
  - Executar `npm run test` em `core/kernel/`
  - Garantir que CRUD, discovery, resolução e carga funcionam sem regressão dos contratos existentes
  - _Requisitos: 11.7_

## Notas

- Tasks marcadas com `*` não foram definidas neste spec; todo o escopo listado acima é obrigatório.
- A implementação deve seguir imports ESM com extensão `.js` no backend.
- O módulo de agentes deve manter o desacoplamento entre core/kernel e templates concretos durante toda a implementação.
