# Andromeda OS — Relatório Completo de Parâmetros da Interface

> Documento de referência extraído das capturas de tela do sistema MVP03.
> Objetivo: garantir que a reimplementação cubra todos os parâmetros, formas de edição e divisão organizacional sem omissões.

---

## Estrutura Geral de Navegação

O agente é organizado em **duas camadas de abas**:

### Camada 1 — Abas principais (nível do agente)
| Aba | Finalidade |
|---|---|
| `Identity` | Visão geral + edição da identidade do agente |
| `History` | Histórico de execuções e versões |
| `Performance` | Métricas de desempenho do agente |
| `Suggestions` | Sugestões automáticas de melhoria |
| `Behavior` | Configuração de comportamento (tem sub-abas) |
| `Safeguards` | Políticas de conformidade e segurança comportamental |
| `Sandbox` | Ambiente de execução isolado do agente |
| `Memory` | Configuração de memória conversacional |
| `Chat` | Interface de teste e conversa direta |

### Camada 2 — Sub-abas de Behavior
| Sub-aba | Finalidade |
|---|---|
| `Identity` | Bloco de identidade estruturada |
| `Soul` | Bloco de alma/essência livre (texto) |
| `Rules` | Regras obrigatórias, proibições e condicionais |
| `Playbook` | Fluxo de execução passo a passo |
| `Context` | Contexto técnico e ambiental do agente |
| `Voice` | Definição de voz e presença comunicativa |
| `Response Style` | Estilo e formato de resposta |

---

## SEÇÃO 1 — Cabeçalho do Agente (Listagem)

Visível na tela de lista de agentes.

| Campo | Tipo de exibição | Notas |
|---|---|---|
| Nome do agente | Texto em destaque | Ex.: "Execution Specialist" |
| Short description | Texto secundário | Ex.: "Technical executor" |
| Team/grupo | Tag colorida | Ex.: "team-core" |
| Versão | Badge | Ex.: "v1.0.1" |

### Cards no topo da tela de detalhe
| Campo | Tipo | Notas |
|---|---|---|
| CONFORMANCE | Valor numérico ou "n/a" | Indicador de conformidade |
| VERSION | Badge de versão semântica | Ex.: "v1.0.8" |
| MODEL | Nome do modelo ativo | Ex.: "minimax-m2.7:cloud", "automatic-router" |

---

## SEÇÃO 2 — Behavior > Identity (Bloco de Identidade)

**Descrição do bloco:** Define quem o agente é, como deve se apresentar e qual papel desempenha.
**Quando usar:** Para definir a função principal do agente.
**Exemplo sugerido:** "You are an operations analyst who explains steps clearly."

| Campo | Tipo de input | Obrigatório | Exemplo |
|---|---|---|---|
| `Name` | Text input | Sim | Maya |
| `Role` | Text input | Sim | Expressive Conversation and Brainstorm Assistant |
| `Mission` | Textarea multilinha | Sim | Create warm, lively, and highly engaging conversations... |
| `Scope` | Textarea multilinha | Sim | Operate in casual conversation, brainstorming... |
| `Communication Style` | Text input | Não | Cheerful, expressive, sweet, lively, charming... |
| `Ecosystem Role` | Text input | Não | Front-facing conversation and brainstorming agent... |
| `Agent Type` | Dropdown | Sim | Generalist / Specialist / Orchestrator |
| `Specializations` | Tag chips + input + botão Adicionar | Não | conversation, brainstorming, ideation, naming... |

---

## SEÇÃO 3 — Behavior > Soul (Bloco de Alma)

**Descrição do bloco:** Campo de texto livre para definir a essência do agente com profundidade qualitativa.
**Tipo de edição:** Editor de texto livre (markdown).
**Sem estrutura fixa** — o usuário escreve livremente descrevendo personalidade, origem, valores.

---

## SEÇÃO 4 — Behavior > Rules (Bloco de Regras)

**Descrição do bloco:** Lista de regras que o agente não pode quebrar, mesmo que o usuário insista.
**Quando usar:** Para hard limits, ações proibidas e comportamentos obrigatórios.

O bloco é dividido em **6 sub-seções**, cada uma com lista de itens removíveis (×) e campo de adição:

| Sub-seção | Cor indicativa | Tipo de edição | Descrição |
|---|---|---|---|
| `Must` (Obrigações) | Vermelho | Lista de texto + input + Adicionar | O que o agente DEVE sempre fazer |
| `Must Not` (Proibições) | Vermelho | Lista de texto + input + Adicionar | O que o agente NUNCA pode fazer |
| `Delegate When` | Amarelo/dourado | Lista de texto + input + Adicionar | Quando deve delegar para outro agente |
| `Review When` | Amarelo/dourado | Lista de texto + input + Adicionar | Quando deve pausar e revisar antes de responder |
| `Feedback When` | Amarelo/dourado | Lista de texto + input + Adicionar | Quando deve pedir ou oferecer feedback intermediário |
| `Interrupt When` | Vermelho-laranja | Lista de texto + input + Adicionar | Quando deve interromper o fluxo atual |
| `Evidence When` | Amarelo/dourado | Lista de texto + input + Adicionar | Quando deve buscar ou exigir evidências antes de prosseguir |

---

## SEÇÃO 5 — Behavior > Playbook (Bloco de Playbook)

**Descrição do bloco:** Descreve o método passo a passo preferencial que o agente deve seguir.
**Quando usar:** Para garantir que o agente siga um workflow consistente.

Dividido em **4 fases sequenciais**, cada uma com lista de passos removíveis e campo de adição:

| Fase | Cor indicativa | Tipo de edição | Descrição |
|---|---|---|---|
| `Start` (Início) | Verde/ciano | Lista de passos + input + Adicionar | Passos iniciais ao começar uma tarefa |
| `Execute` (Execução) | Verde/ciano | Lista de passos + input + Adicionar | Passos principais de execução |
| `Review` (Revisão) | Amarelo/dourado | Lista de passos + input + Adicionar | Passos de revisão após execução |
| `Report` (Relatório) | Amarelo/dourado | Lista de passos + input + Adicionar | Passos para reportar resultados |

---

## SEÇÃO 6 — Behavior > Context (Bloco de Contexto)

**Descrição do bloco:** Armazena informações estáveis de background sobre o ambiente onde o agente trabalha.
**Quando usar:** Para contexto de projeto, restrições de equipe, objetivos e suposições.

Dividido em **6 sub-seções**, cada uma com tag chips removíveis e campo de adição:

| Sub-seção | Tipo de edição | Descrição |
|---|---|---|
| `Stack` | Tag chips + input + Adicionar | Tecnologias e ferramentas utilizadas |
| `Architecture` | Tag chips + input + Adicionar | Padrões arquiteturais seguidos |
| `Objectives` | Tag chips + input + Adicionar | Objetivos do projeto |
| `Decisions` | Tag chips + input + Adicionar | Decisões técnicas importantes já tomadas |
| `Constraints` | Tag chips + input + Adicionar | Restrições e limitações conhecidas |
| `Patterns` | Tag chips + input + Adicionar | Padrões de design utilizados |

---

## SEÇÃO 7 — Behavior > Voice (Bloco de Voz)

**Descrição do bloco:** Define como o agente soa quando fala: tom, ritmo, presença emocional e estilo comunicativo.
**Quando usar:** Para diferenciar a voz percebida do agente sem misturar com regras ou identidade.
**Tipo de edição:** Editor de texto livre (markdown).

Exemplo de estrutura interna do bloco (livre):
- Tone
- Rhythm
- Emotional color
- Presence
- Clarity
- Humor
- Brainstorm mode
- Support mode

---

## SEÇÃO 8 — Behavior > Response Style (Bloco de Estilo de Resposta)

**Descrição do bloco:** Define como o agente organiza e entrega respostas: fluidez, estrutura, uso de listas, expansão de opções e apresentação geral.
**Quando usar:** Para guiar o formato de resposta sem alterar a personalidade central.
**Tipo de edição:** Editor de texto livre (markdown).

---

## SEÇÃO 9 — Behavior (Aba Behavior — Sliders)

Tela de sliders de perfil comportamental quantitativo.
Todos os campos são **sliders numéricos de 0 a 100** com valor exibido à direita.
Botão: **Save Behavior**

| Parâmetro | Valor padrão observado | Descrição funcional |
|---|---|---|
| `Formality` | 60 | Nível de formalidade da comunicação |
| `Warmth` | 58 | Calor e proximidade emocional |
| `Objectivity` | 78 | Objetividade vs. subjetividade |
| `Detail` | 72 | Nível de detalhe nas respostas |
| `Caution` | 74 | Cautela antes de agir ou afirmar |
| `Autonomy` | 68 | Autonomia de decisão do agente |
| `Creativity` | 52 | Grau de criatividade permitida |
| `Ambiguity` | 46 | Tolerância a ambiguidade |
| `Proactivity` | 82 | Iniciativa proativa do agente |
| `Delegation` | 56 | Propensão a delegar tarefas |
| `Feedback` | 74 | Frequência de feedback intermediário |
| `Playbook` | 70 | Adesão ao playbook definido |
| `Compliance` | 84 | Conformidade com regras e guardrails |
| `Self Review` | 72 | Revisão automática antes de responder |
| `Evidence` | 68 | Exigência de evidência antes de afirmar |

---

## SEÇÃO 10 — Safeguards

Configuração de políticas de conformidade e segurança comportamental.
Botão: **Save Safeguards**

| Campo | Tipo | Valor observado | Descrição |
|---|---|---|---|
| `Mode` | Dropdown | Balanced | Modo geral de operação dos safeguards |
| `Minimum Conformance` | Slider (0–100) | 70 | Conformidade mínima aceita por resposta |
| `Corrective Action` | Dropdown | Rewrite | Ação ao detectar violação |
| `Require audit on critical tasks` | Checkbox | ☐ | Auditoria obrigatória em tarefas críticas |
| `Always provide intermediate feedback` | Checkbox | ☐ | Sempre dar feedback parcial |
| `Prefer specialist delegation` | Checkbox | ☐ | Preferir delegação a especialistas |
| `Block out-of-role responses` | Checkbox | ☐ | Bloquear respostas fora do papel |
| `Run self-review automatically` | Checkbox | ✓ | Executar auto-revisão automaticamente |
| `Prioritize skill-first routing` | Checkbox | ☐ | Roteamento por habilidade primeiro |
| `Always suggest next steps` | Checkbox | ✓ | Sempre sugerir próximos passos |

### Sub-seção: Recent Violations
- Exibição em lista de violações recentes (read-only)
- Estado vazio: "No recent violations recorded."

---

## SEÇÃO 11 — Sandbox

Ambiente de execução isolado e configurável. Dividido em **8 sub-seções**.

### 11.1 General
| Campo | Tipo | Valor padrão | Descrição |
|---|---|---|---|
| `Effective mode` | Dropdown | Process | Modo de execução efetivo |
| `Persist artifacts` | Checkbox | ✓ | Persistir artefatos gerados |

### 11.2 Filesystem
| Campo | Tipo | Valor padrão | Descrição |
|---|---|---|---|
| `Working directory` | Text input | /workspace | Diretório de trabalho |
| `Read only root` | Checkbox | ✓ | Raiz em modo somente leitura |
| `Allowed read paths` | Text input | /workspace | Caminhos com permissão de leitura |
| `Allowed write paths` | Text input | /workspace/output | Caminhos com permissão de escrita |
| `Temp directory` | Text input | /workspace/tmp | Diretório temporário |
| `Max artifact size (MB)` | Number input | 25 | Tamanho máximo por artefato |
| `Max total artifacts (MB)` | Number input | 100 | Limite total de artefatos |

### 11.3 Network
| Campo | Tipo | Valor padrão | Descrição |
|---|---|---|---|
| `Network mode` | Dropdown | Off | Modo de rede |
| `Block private networks` | Checkbox | ✓ | Bloquear redes privadas |
| `Allow DNS` | Checkbox | ☐ | Permitir resolução DNS |
| `HTTP only` | Checkbox | ✓ | Restringir a HTTP apenas |
| `Allowed domains` | Text input | — | Domínios permitidos |
| `Allowed ports` | Text input | — | Portas permitidas |

### 11.4 Resources
| Campo | Tipo | Valor padrão | Descrição |
|---|---|---|---|
| `Timeout (seconds)` | Number input | 60 | Timeout de execução |
| `CPU limit` | Number input | 1 | Limite de CPUs |
| `Memory (MB)` | Number input | 512 | Limite de memória RAM |
| `Disk (MB)` | Number input | 512 | Limite de disco |
| `Max processes` | Number input | 8 | Máximo de processos simultâneos |
| `Max threads` | Number input | 8 | Máximo de threads |
| `Max stdout (KB)` | Number input | 256 | Limite de saída padrão |
| `Max stderr (KB)` | Number input | 256 | Limite de saída de erro |

### 11.5 Execution
| Campo | Tipo | Valor padrão | Descrição |
|---|---|---|---|
| `Allow shell` | Checkbox | ☐ | Permitir acesso ao shell |
| `Allow subprocess` | Checkbox | ☐ | Permitir subprocessos |
| `Allow package install` | Checkbox | ☐ | Permitir instalação de pacotes |
| `Allowed interpreters` | Text input | node, python, python3 | Interpretadores permitidos |
| `Allowed binaries` | Text input | node, python, python3, bash | Binários permitidos |
| `Blocked binaries` | Text input | sudo, su, ssh, scp, docker, kubectl, chmod, chown | Binários bloqueados |

### 11.6 Security
| Campo | Tipo | Valor padrão | Descrição |
|---|---|---|---|
| `Run as non-root` | Checkbox | ✓ | Executar sem privilégios root |
| `No new privileges` | Checkbox | ✓ | Impedir escalada de privilégios |
| `Disable privileged mode` | Checkbox | ✓ | Desabilitar modo privilegiado |
| `Disable host namespaces` | Checkbox | ✓ | Isolar namespaces do host |
| `Disable device access` | Checkbox | ✓ | Bloquear acesso a dispositivos |

### 11.7 IO Policy
| Campo | Tipo | Valor padrão | Descrição |
|---|---|---|---|
| `Max input (KB)` | Number input | 256 | Tamanho máximo de entrada |
| `Max output (KB)` | Number input | 512 | Tamanho máximo de saída |
| `Allowed output types` | Text input | text, json, file | Tipos de saída permitidos |
| `Retention` | Dropdown | Task | Política de retenção de output |
| `Strip sensitive output` | Checkbox | ✓ | Remover dados sensíveis da saída |
| `Content scan` | Checkbox | ✓ | Escanear conteúdo gerado |

### 11.8 Audit
| Campo | Tipo | Valor padrão | Descrição |
|---|---|---|---|
| `Audit enabled` | Checkbox | ✓ | Habilitar auditoria |
| `Capture artifacts` | Checkbox | ✓ | Capturar artefatos gerados |
| `Capture timing` | Checkbox | ✓ | Capturar timing de execução |
| `Capture network events` | Checkbox | ☐ | Capturar eventos de rede |

### 11.9 Approvals
| Campo | Tipo | Valor padrão | Descrição |
|---|---|---|---|
| `Require approval for exec` | Checkbox | ✓ | Exigir aprovação para execuções |
| `Require approval outside workspace` | Checkbox | ✓ | Aprovação para operações fora do workspace |
| `Require approval for network` | Checkbox | ✓ | Aprovação para acesso à rede |
| `Require approval for large artifacts` | Checkbox | ☐ | Aprovação para artefatos grandes |

### 11.10 Capability & Command
| Campo | Tipo | Valor padrão | Descrição |
|---|---|---|---|
| `Capability` | Text input | exec | Capacidade declarada do sandbox |
| `Command` | Text input | node -v | Comando de verificação/teste |
| `Preset` | Dropdown | Code Runner | Preset de configuração do sandbox |
| `Enabled` | Checkbox | ✓ | Sandbox habilitado |
| `Fallback behavior` | Dropdown | Deny | Comportamento ao falhar |
| `Mandatory capabilities` | Text input | exec, process, write, edit, cron, gateway | Capacidades obrigatórias |

### 11.11 Environment
| Campo | Tipo | Valor padrão | Descrição |
|---|---|---|---|
| `Runtime` | Text input | node | Runtime de execução |
| `Runtime version` | Text input | 20 | Versão do runtime |
| `Timezone` | Text input | UTC | Fuso horário do ambiente |
| `Locale` | Text input | en-US | Localização do ambiente |
| `Inherit host env` | Checkbox | ☐ | Herdar variáveis do host |
| `Secret injection` | Checkbox | ☐ | Injetar secrets no ambiente |

### 11.12 Overrides & Preview
| Campo | Tipo | Descrição |
|---|---|---|
| `Overrides JSON` | Textarea JSON | Override manual de qualquer campo da policy |
| `Policy Preview` | JSON viewer (read-only) | Preview da policy efetiva compilada |
| `Validation` | Painel read-only | Resultado da última validação |
| `Dry-run Result` | Painel read-only | Resultado do último dry-run |
| `Recent Executions` | Lista read-only | Execuções recentes do sandbox |

**Ações disponíveis no Sandbox:**
- `Validate` — valida a configuração atual
- `Dry-run` — simula execução sem executar de fato
- `Save Sandbox` — salva as configurações
- `Run Test` — executa um teste real

---

## SEÇÃO 12 — Memory

Configuração do módulo de memória do agente.
Botão: **Save Memory Config**

### 12.1 Session Memory (toggle global, implícito)
- Quando habilitado, o agente lembra informações da conversa atual durante a sessão.

### 12.2 Escopo da Memória
| Campo | Tipo | Valor padrão | Descrição |
|---|---|---|---|
| `Tipo de escopo` | Dropdown | Sessao | Define se a memória é temporária (sessão) ou persiste entre sessões |

### 12.3 Limite de Memória
| Campo | Tipo | Valor padrão | Descrição |
|---|---|---|---|
| `Numero maximo de entradas` | Number input | 100 | Quantidade máxima de itens armazenados antes de pruning |

### 12.4 Memória Compartilhada
| Campo | Tipo | Valor padrão | Descrição |
|---|---|---|---|
| `Habilitar compartilhamento` | Checkbox | ☐ | Permite que o agente compartilhe memória com outros agentes especificados |

### 12.5 Retenção da Memória
| Campo | Tipo | Valor padrão | Descrição |
|---|---|---|---|
| `Periodo de retencao` | Dropdown | Ate fim da sessao | Por quanto tempo as memórias são mantidas antes de serem descartadas |

### 12.6 About Memory (glossário read-only)
- Session Memory, Memory Scope, Memory Limit, Shared Memory, Retention — descrições de cada conceito.

---

## SEÇÃO 13 — Resumo de Tipos de Input Utilizados

| Tipo de input | Onde aparece |
|---|---|
| **Text input** (linha única) | Name, Role, Communication Style, Working directory, Runtime, Command... |
| **Textarea** (multilinha) | Mission, Scope, Soul, Voice, Response Style, Overrides JSON |
| **Number input** | Max artifact size, Timeout, CPU, Memory, Max processes... |
| **Dropdown/Select** | Agent Type, Effective mode, Network mode, Preset, Mode (safeguards)... |
| **Checkbox** | Todas as flags booleanas (persist artifacts, run as non-root, audit enabled...) |
| **Slider (0–100)** | Formality, Warmth, Objectivity, Detail, Caution e demais Behavior sliders; Minimum Conformance |
| **Tag chips + input + Adicionar** | Specializations, Stack, Architecture, Objectives, Decisions, Constraints, Patterns |
| **Lista de itens + × remover + input + Adicionar** | Must, Must Not, Delegate When, Review When, Feedback When, Interrupt When, Evidence When, Playbook phases |
| **JSON viewer (read-only)** | Policy Preview |
| **Painel read-only** | Validation, Dry-run Result, Recent Executions, Recent Violations |

---

## SEÇÃO 14 — Divisão Proposta para o Novo Sistema

Com base na análise completa, a estrutura organizacional recomendada para o novo sistema é:

```
Agent
├── [Header] name, slug, version, conformance, model
│
├── Behavior/
│   ├── identity/       → name, role, mission, scope, communicationStyle,
│   │                     ecosystemRole, agentType, specializations[]
│   ├── soul/           → texto livre (markdown)
│   ├── rules/          → must[], mustNot[], delegateWhen[], reviewWhen[],
│   │                     feedbackWhen[], interruptWhen[], evidenceWhen[]
│   ├── playbook/       → start[], execute[], review[], report[]
│   ├── context/        → stack[], architecture[], objectives[],
│   │                     decisions[], constraints[], patterns[]
│   ├── voice/          → texto livre (markdown)
│   ├── responseStyle/  → texto livre (markdown)
│   └── behaviorSliders/→ formality, warmth, objectivity, detail, caution,
│                         autonomy, creativity, ambiguity, proactivity,
│                         delegation, feedback, playbook, compliance,
│                         selfReview, evidence (todos 0–100)
│
├── Safeguards/
│   ├── mode            → enum (Balanced | Strict | Permissive)
│   ├── minimumConformance → slider 0–100
│   ├── correctiveAction   → enum (Rewrite | Warn | Block)
│   ├── flags[]         → requireAuditOnCritical, alwaysIntermediateFeedback,
│   │                     preferSpecialistDelegation, blockOutOfRole,
│   │                     runSelfReviewAutomatically, prioritizeSkillFirstRouting,
│   │                     alwaysSuggestNextSteps
│   └── recentViolations[] → read-only
│
├── Sandbox/
│   ├── general/        → effectiveMode, persistArtifacts
│   ├── filesystem/     → workingDirectory, readOnlyRoot, allowedReadPaths,
│   │                     allowedWritePaths, tempDirectory,
│   │                     maxArtifactSizeMb, maxTotalArtifactsMb
│   ├── network/        → networkMode, blockPrivateNetworks, allowDns,
│   │                     httpOnly, allowedDomains[], allowedPorts[]
│   ├── resources/      → timeoutSeconds, cpuLimit, memoryMb, diskMb,
│   │                     maxProcesses, maxThreads, maxStdoutKb, maxStderrKb
│   ├── execution/      → allowShell, allowSubprocess, allowPackageInstall,
│   │                     allowedInterpreters[], allowedBinaries[], blockedBinaries[]
│   ├── security/       → runAsNonRoot, noNewPrivileges, disablePrivilegedMode,
│   │                     disableHostNamespaces, disableDeviceAccess
│   ├── ioPolicy/       → maxInputKb, maxOutputKb, allowedOutputTypes[],
│   │                     retention, stripSensitiveOutput, contentScan
│   ├── audit/          → auditEnabled, captureArtifacts, captureTiming,
│   │                     captureNetworkEvents
│   ├── approvals/      → requireApprovalForExec, requireApprovalOutsideWorkspace,
│   │                     requireApprovalForNetwork, requireApprovalForLargeArtifacts
│   ├── capability/     → capability, command, preset, enabled,
│   │                     fallbackBehavior, mandatoryCapabilities[]
│   ├── environment/    → runtime, runtimeVersion, timezone, locale,
│   │                     inheritHostEnv, secretInjection
│   └── overrides/      → overridesJson (raw), policyPreview (read-only),
│                         recentExecutions[] (read-only)
│
└── Memory/
    ├── sessionMemory   → boolean (toggle global)
    ├── scopeType       → enum (session | persistent)
    ├── maxEntries      → number
    ├── sharedMemory    → boolean
    └── retentionPeriod → enum (session-end | 24h | 7d | 30d | forever)
```

---

## SEÇÃO 15 — Contagem Final de Parâmetros

| Seção | Qtd. de parâmetros |
|---|---|
| Header do agente | 4 |
| Behavior > Identity | 8 |
| Behavior > Soul | 1 (texto livre) |
| Behavior > Rules | 7 sub-seções × n itens |
| Behavior > Playbook | 4 fases × n passos |
| Behavior > Context | 6 sub-seções × n tags |
| Behavior > Voice | 1 (texto livre) |
| Behavior > Response Style | 1 (texto livre) |
| Behavior > Sliders | 15 sliders |
| Safeguards | 10 |
| Sandbox > General | 2 |
| Sandbox > Filesystem | 7 |
| Sandbox > Network | 6 |
| Sandbox > Resources | 8 |
| Sandbox > Execution | 6 |
| Sandbox > Security | 5 |
| Sandbox > IO Policy | 6 |
| Sandbox > Audit | 4 |
| Sandbox > Approvals | 4 |
| Sandbox > Capability | 6 |
| Sandbox > Environment | 6 |
| Sandbox > Overrides/Preview | 3 |
| Memory | 5 |
| **TOTAL estimado** | **~124 parâmetros configuráveis** |
