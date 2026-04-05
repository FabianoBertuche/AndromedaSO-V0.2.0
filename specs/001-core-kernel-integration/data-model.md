# Data Model: Core Kernel Integration

## Entity: Module

Representa um módulo descoberto pelo kernel a partir do filesystem.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Identificador único e estável do módulo. |
| `name` | string | Nome legível para operadores e logs. |
| `group` | string | Grupo funcional, como `providers` ou `channels`. |
| `variant` | string | Implementação concreta dentro do grupo. |
| `version` | string | Semver obrigatório. |
| `entrypoint` | string | Caminho do adapter carregável pelo kernel. |
| `rootPath` | string | Diretório raiz em que o manifesto foi descoberto. |
| `contracts` | object | Referências para contrato de entrada e saída. |
| `capabilities` | string[] | Capacidades declaradas pelo módulo. |
| `dependencies` | string[] | IDs de módulos necessários para validação/carga. |
| `critical` | boolean | Se `true`, falhas bloqueiam o subsistema dependente. |
| `enabled` | boolean | Controla auto-registro no discovery. |
| `status` | `active \| disabled \| deprecated` | Status declarado no manifesto. |
| `state` | LifecycleState | Estado atual no runtime. |
| `lastSeenAt` | datetime | Última descoberta confirmada. |

## Entity: ModuleContract

Representa o contrato canônico usado na integração entre módulo e core.

| Field | Type | Notes |
|---|---|---|
| `moduleId` | string | Referência ao módulo dono do contrato. |
| `input` | string | Caminho ou identificador do schema de entrada. |
| `output` | string | Caminho ou identificador do schema de saída. |
| `version` | string | Versão do contrato usada na compatibilidade. |
| `compatibilityRule` | string | Regra inicial: compatibilidade por major de semver. |

## Entity: RegistryEntry

Representa a visão persistida e em memória de um módulo já aceito pelo core.

| Field | Type | Notes |
|---|---|---|
| `moduleId` | string | Chave principal lógica do registro. |
| `group` | string | Permite filtragem operacional por domínio. |
| `variant` | string | Permite distinguir implementações compatíveis. |
| `currentState` | LifecycleState | Estado operacional sincronizado. |
| `validationStatus` | `pending \| passed \| failed` | Resultado da última validação. |
| `metadata` | json | Snapshot operacional para auditoria. |
| `registeredAt` | datetime | Quando o módulo entrou no registry. |
| `updatedAt` | datetime | Última atualização persistida. |

## Entity: LifecycleEvent

Representa cada transição relevante da máquina de estados.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Identificador do evento. |
| `moduleId` | string | Módulo afetado. |
| `fromState` | LifecycleState | Estado anterior. |
| `toState` | LifecycleState | Estado de destino. |
| `reason` | string | Motivo operacional ou erro. |
| `context` | json | Dados adicionais para debug/auditoria. |
| `createdAt` | datetime | Momento da transição. |

## Entity: Group

Agrupamento lógico usado no discovery e nas políticas de validação.

| Field | Type | Notes |
|---|---|---|
| `name` | string | Nome canônico do grupo. |
| `description` | string | Finalidade operacional do grupo. |
| `contractsRoot` | string | Local base dos contratos canônicos do grupo. |
| `policies` | json | Regras de compatibilidade, criticidade ou bloqueio. |

## Entity: Variant

Representa uma implementação concreta de módulo dentro de um grupo.

| Field | Type | Notes |
|---|---|---|
| `moduleId` | string | Módulo-pai da variante. |
| `name` | string | Nome da variante. |
| `version` | string | Versão da implementação concreta. |
| `compatibility` | json | Regras adicionais além do major semver. |
| `contractOverrides` | json | Overrides permitidos sem quebrar o contrato canônico. |

## State Transitions

`discovered -> registered -> validated -> loaded -> initialized -> running -> stopped`

Qualquer falha de validação, carregamento ou inicialização pode redirecionar para `failed`, com registro persistido em `LifecycleEvent`.
