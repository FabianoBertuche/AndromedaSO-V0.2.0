# Andromeda Agents — Canonical Fields

A lista abaixo consolida os campos canônicos do agente no Andromeda, derivada das decisões já registradas sobre criação, edição, exclusão lógica, templates modulares, resolução determinística de configuração e execução fiel à personalidade/parâmetros declarados.

## Convenções

- `Obrigatório`: significa obrigatório na entidade Agent persistida, não necessariamente em todo payload de operação.
- `Default`: comportamento explícito e seguro; a arquitetura evita defaults ocultos fora da cadeia declarada.
- Tipos sugeridos são canônicos para a v1 do contrato.

## Identidade

| Campo | Tipo | Obrigatório | Default | Descrição |
|---|---|---:|---|---|
| `id` | `string` | Sim | — | Identificador único estável do agente. |
| `name` | `string` | Sim | — | Nome humano principal do agente. |
| `slug` | `string` | Sim | derivado de `name` se não informado na criação | Identificador legível e amigável para rotas, manifests e referência interna. |
| `shortDescription` | `string` | Não | `""` | Resumo curto do agente para listagens e seleção rápida. |
| `longDescription` | `string` | Não | `""` | Descrição detalhada da finalidade, uso e contexto do agente. |
| `owner` | `string` | Não | `"system"` | Dono lógico do agente, como sistema, workspace, usuário ou módulo. |
| `source` | `string` | Não | `"manual"` | Origem de criação, por exemplo `manual`, `template`, `import`. |
| `version` | `string` | Sim | `"1.0.0"` | Versão lógica do registro do agente. |
| `status` | `enum("draft","active","inactive","archived","deleted")` | Sim | `"draft"` | Estado de vida e disponibilidade do agente. |

## Origem e template

| Campo | Tipo | Obrigatório | Default | Descrição |
|---|---|---:|---|---|
| `templateId` | `string \| null` | Não | `null` | Identificador do template de origem, quando o agente nasce de template. |
| `isTemplateDerived` | `boolean` | Sim | `false` | Indica se o agente foi instanciado a partir de um template. |
| `templateSource` | `string \| null` | Não | `null` | Origem lógica do template, como grupo, variante ou pacote. |
| `templateVariant` | `string \| null` | Não | `null` | Variante concreta do template dentro da estrutura modular. |
| `templateManifestRef` | `string \| null` | Não | `null` | Referência ao manifesto do template usado para rastreabilidade. |
| `originTemplateVersion` | `string \| null` | Não | `null` | Versão do template no momento da instanciação. |
| `templateDefaultsSnapshot` | `object \| null` | Não | `null` | Snapshot dos defaults herdados do template para auditoria e reprodutibilidade. |
| `templateInheritanceMode` | `enum("copy-on-create","linked-metadata")` | Não | `"copy-on-create"` | Define como o agente preserva o vínculo com o template após ser criado. |
| `templateLockPolicy` | `enum("none","future","strict")` | Não | `"none"` | Política reservada para controlar campos travados por template. |

## Papel e objetivo

| Campo | Tipo | Obrigatório | Default | Descrição |
|---|---|---:|---|---|
| `role` | `string` | Sim | — | Papel principal do agente no sistema. |
| `mission` | `string` | Não | `""` | Missão resumida e permanente do agente. |
| `domain` | `string` | Não | `"general"` | Domínio principal de atuação, como suporte, vendas, análise ou operação. |
| `objective` | `string` | Sim | — | Objetivo funcional primário que o agente deve perseguir. |
| `successCriteria` | `string[]` | Não | `[]` | Critérios declarados que definem sucesso da atuação do agente. |

## Personalidade e interação

| Campo | Tipo | Obrigatório | Default | Descrição |
|---|---|---:|---|---|
| `persona` | `string` | Sim | — | Descrição principal da persona do agente. |
| `tone` | `string` | Sim | `"neutro"` | Tom de voz predominante, como técnico, cordial, formal ou direto. |
| `style` | `string` | Sim | `"claro-e-objetivo"` | Estilo esperado de resposta e estrutura textual. |
| `behaviorProfile` | `string` | Não | `"default"` | Nome do perfil comportamental aplicado ao agente. |
| `interactionMode` | `enum("reactive","proactive","guided","strict")` | Não | `"guided"` | Modo principal de interação com usuário e sistema. |
| `defaultLanguage` | `string` | Não | `"pt-BR"` | Idioma padrão em que o agente deve responder. |
| `tags` | `string[]` | Não | `[]` | Etiquetas para categorização, filtragem e descoberta. |
| `categories` | `string[]` | Não | `[]` | Classificações funcionais ou organizacionais do agente. |

## Instruções e políticas

| Campo | Tipo | Obrigatório | Default | Descrição |
|---|---|---:|---|---|
| `systemPrompt` | `string` | Sim | — | Instrução-base principal que define o comportamento operacional do agente. |
| `operatingInstructions` | `string[]` | Não | `[]` | Instruções operacionais complementares aplicadas ao runtime do agente. |
| `doRules` | `string[]` | Não | `[]` | Regras explícitas do que o agente deve fazer ou priorizar. |
| `dontRules` | `string[]` | Não | `[]` | Regras explícitas do que o agente não pode fazer. |
| `guardrails` | `string[]` | Não | `[]` | Restrições e salvaguardas de segurança, conformidade e comportamento. |
| `escalationRules` | `string[]` | Não | `[]` | Regras para escalonamento a humano, handoff ou exceções. |

## Modelo e execução

| Campo | Tipo | Obrigatório | Default | Descrição |
|---|---|---:|---|---|
| `preferredModel` | `string \| null` | Não | `null` | Modelo preferencial para execução quando compatível. |
| `allowedModels` | `string[]` | Não | `[]` | Lista branca de modelos permitidos para o agente. |
| `providerConstraints` | `string[]` | Não | `[]` | Restrições declaradas sobre providers utilizáveis. |
| `channelConstraints` | `string[]` | Não | `[]` | Restrições declaradas sobre canais em que o agente pode operar. |
| `temperature` | `number` | Não | `0.7` | Grau de criatividade/variação permitido na geração. |
| `topP` | `number` | Não | `1.0` | Parâmetro de nucleus sampling, quando suportado. |
| `maxTokens` | `number \| null` | Não | `null` | Limite máximo de tokens por resposta, quando aplicável. |
| `responseFormat` | `enum("text","markdown","json","structured")` | Não | `"markdown"` | Formato de saída preferencial do agente. |
| `reasoningMode` | `enum("default","light","standard","deep") \| null` | Não | `null` | Modo lógico de raciocínio, se existir no runtime. |
| `timeoutMs` | `number` | Não | `30000` | Tempo máximo de execução antes de timeout. |
| `retryPolicy` | `object` | Não | `{ "maxRetries": 0 }` | Política explícita de retentativas para falhas recuperáveis. |

## Capacidades

| Campo | Tipo | Obrigatório | Default | Descrição |
|---|---|---:|---|---|
| `toolsEnabled` | `boolean` | Sim | `false` | Define se o agente pode usar ferramentas. |
| `knowledgeEnabled` | `boolean` | Sim | `false` | Define se o agente pode acessar conhecimento externo ou indexado. |
| `memoryEnabled` | `boolean` | Sim | `false` | Define se o agente usa memória conversacional ou contextual. |
| `routingEnabled` | `boolean` | Sim | `false` | Define se o agente participa de roteamento ou seleção dinâmica. |
| `handoffEnabled` | `boolean` | Sim | `false` | Define se o agente pode transferir fluxo para outro agente ou módulo. |
| `humanEscalationEnabled` | `boolean` | Sim | `false` | Define se o agente pode escalar para intervenção humana. |
| `capabilities` | `string[]` | Não | `[]` | Lista declarativa de capacidades habilitadas além dos toggles básicos. |

## Canais

| Campo | Tipo | Obrigatório | Default | Descrição |
|---|---|---:|---|---|
| `allowedChannels` | `string[]` | Não | `[]` | Lista branca de canais onde o agente pode ser exposto. |
| `defaultChannelBehavior` | `object` | Não | `{}` | Comportamento padrão por canal quando não houver override específico. |
| `channelOverrides` | `object` | Não | `{}` | Configurações específicas por canal, respeitando o contrato comum. |

## Governança e edição

| Campo | Tipo | Obrigatório | Default | Descrição |
|---|---|---:|---|---|
| `isActive` | `boolean` | Sim | `false` | Indica se o agente está apto a operar. |
| `isEditable` | `boolean` | Sim | `true` | Indica se o agente pode ser alterado por operações normais de edição. |
| `visibility` | `enum("private","internal","public")` | Não | `"internal"` | Nível de visibilidade do agente no sistema. |
| `auditMetadata` | `object` | Não | `{}` | Metadados de auditoria e origem de alteração. |

## Ciclo de vida

| Campo | Tipo | Obrigatório | Default | Descrição |
|---|---|---:|---|---|
| `originType` | `enum("manual","template","import","clone")` | Sim | `"manual"` | Tipo de origem do agente. |
| `cloneOfAgentId` | `string \| null` | Não | `null` | Identificador do agente de origem quando houver duplicação. |
| `isDeleted` | `boolean` | Sim | `false` | Marca de exclusão lógica do agente. |
| `deletedAt` | `datetime \| null` | Não | `null` | Timestamp da exclusão lógica. |
| `activatedAt` | `datetime \| null` | Não | `null` | Timestamp de ativação. |
| `deactivatedAt` | `datetime \| null` | Não | `null` | Timestamp de desativação. |
| `createdAt` | `datetime` | Sim | timestamp atual | Data de criação do registro. |
| `updatedAt` | `datetime` | Sim | timestamp atual | Data da última atualização do registro. |

## Resolução de configuração

| Campo | Tipo | Obrigatório | Default | Descrição |
|---|---|---:|---|---|
| `overrides` | `object` | Não | `{}` | Overrides específicos do agente sobre template e defaults herdados. |
| `explicitParameters` | `object` | Não | `{}` | Parâmetros explicitamente definidos no agente fora da base herdada. |
| `resolvedConfig` | `object \| null` | Não | `null` | Configuração final consolidada pronta para execução. |
| `resolutionTrace` | `object \| null` | Não | `null` | Rastro de precedência e origem dos campos resolvidos. |
| `effectiveSystemPrompt` | `string \| null` | Não | `null` | Prompt final efetivo após merge e validação. |
| `effectiveBehaviorProfile` | `object \| null` | Não | `null` | Perfil comportamental efetivo após resolução. |
| `effectiveExecutionPolicy` | `object \| null` | Não | `null` | Política efetiva de execução após resolução. |
| `effectiveChannelPolicy` | `object \| null` | Não | `null` | Política efetiva de canais após resolução. |
| `effectiveModelPolicy` | `object \| null` | Não | `null` | Política efetiva de modelo/provider após resolução. |
| `configSnapshotVersion` | `number` | Não | `1` | Versão incremental do snapshot de configuração resolvida. |
| `lastResolvedAt` | `datetime \| null` | Não | `null` | Última data em que a configuração foi resolvida com sucesso. |
| `lastValidatedAt` | `datetime \| null` | Não | `null` | Última data em que a configuração foi validada com sucesso. |

## Objetos auxiliares canonizados

### `retryPolicy`
| Campo | Tipo | Obrigatório | Default | Descrição |
|---|---|---:|---|---|
| `maxRetries` | `number` | Sim | `0` | Número máximo de tentativas adicionais. |
| `backoffMs` | `number` | Não | `0` | Espera base entre tentativas. |
| `strategy` | `enum("none","fixed","exponential")` | Não | `"none"` | Estratégia de retentativa. |

### `auditMetadata`
| Campo | Tipo | Obrigatório | Default | Descrição |
|---|---|---:|---|---|
| `createdBy` | `string \| null` | Não | `null` | Quem criou o agente. |
| `updatedBy` | `string \| null` | Não | `null` | Quem atualizou por último. |
| `reason` | `string \| null` | Não | `null` | Motivo textual de criação/alteração relevante. |

## Regras canônicas

- Nenhum agente deve executar sem `resolvedConfig` válida quando o runtime exigir resolução prévia.
- A cadeia de precedência deve ser: `template.baseConfig` → `template.defaults` → `agent.overrides` → `agent.explicitParameters` → `runtimeBindings` permitidos.
- Campos críticos de comportamento, como `persona`, `systemPrompt`, `role` e `objective`, não devem ficar implícitos.
- Templates novos devem entrar por nova pasta/variante no módulo, e não por hardcode no core.

## Recorte mínimo obrigatório

Se você quiser separar o contrato em core fields mínimos e campos avançados, o mínimo obrigatório para criação consistente de um agente v1 seria: `id`, `name`, `slug`, `version`, `status`, `role`, `objective`, `persona`, `tone`, `style`, `systemPrompt`, `isActive`, `isEditable`, `originType`, `createdAt`, `updatedAt`.
