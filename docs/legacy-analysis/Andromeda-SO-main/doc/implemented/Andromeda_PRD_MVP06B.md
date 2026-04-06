# Andromeda — Especificação Técnica do Subsistema de Sandbox

## Objetivo

Este documento define a implementação completa do subsistema de sandbox do Andromeda como fundação de segurança, governança e execução operacional de agentes. A sandbox deve atuar como a camada responsável por aplicar isolamento, limites, políticas, auditoria e aprovação humana quando necessário.

A sandbox não é apenas um executor. Ela é um mecanismo de enforcement entre a decisão do agente e a ação efetiva no sistema.

---

## Escopo funcional

O subsistema de sandbox cobre:

* perfis reutilizáveis de sandbox
* configuração de sandbox por agente
* resolução de política efetiva
* validação de políticas
* enforcement por capability
* execução segura via runners
* controle de arquivos, rede, recursos e comandos
* auditoria de execuções
* gestão de artefatos
* aprovações humanas para ações sensíveis
* endpoints REST
* interface web para configuração e observabilidade

---

## Princípios

### Deny by default

Tudo deve iniciar bloqueado até que exista permissão explícita.

### Capability-first

A existência de uma tool não implica autorização para uso. Toda ação operacional deve ser autorizada pela policy do agente.

### Sandbox-first

Capabilities operacionais devem exigir sandbox obrigatória.

### Most restrictive wins

Na consolidação de política, a regra mais restritiva prevalece.

### Auditability by default

Toda execução operacional deve gerar registro auditável.

---

## Capabilities que exigem sandbox

Devem exigir sandbox obrigatória:

* `exec`
* `process`
* `write`
* `edit` quando alterar arquivos reais
* `cron`
* `gateway` quando alterar estado
* plugins operacionais
* automações persistentes

Podem operar sem sandbox, mas ainda sob policy:

* `read`
* `memory_search`
* `memory_get`
* `sessions_list`
* `agents_list`

Dependem da policy:

* `web_search`
* `web_fetch`
* `browser`

---

## Arquitetura lógica

```text
User Request
   ↓
Agent Runtime
   ↓
Planner / Skill Selector
   ↓
Capability Policy Engine
   ↓
Sandbox Policy Resolver
   ↓
Sandbox Validator
   ↓
Approval Gate (quando necessário)
   ↓
Execution Orchestrator
   ↓
Sandbox Runner
   ↓
Artifact Manager + Audit Logger
   ↓
Result
```

---

## Componentes do subsistema

### CapabilityPolicyEngine

Decide se o agente pode solicitar determinada capability.

Responsabilidades:

* verificar capability habilitada
* verificar requisitos de sandbox
* verificar escopo de uso
* verificar necessidade de aprovação

### SandboxPolicyResolver

Resolve a política final de execução a partir de múltiplas fontes.

Fontes de resolução:

1. política global do sistema
2. perfil de sandbox
3. configuração do agente
4. requisitos da skill
5. override temporário permitido
6. restrições impostas pelo ambiente

### SandboxValidator

Valida a política efetiva antes da execução.

Exemplos:

* impedir paths inválidos
* impedir binários bloqueados
* impedir rede full sem autorização especial
* impedir escrita fora do workspace

### ApprovalGate

Bloqueia execuções que exijam aprovação humana.

### ExecutionOrchestrator

Prepara o ambiente e delega a execução ao runner.

### SandboxRunner

Executor concreto. Implementações previstas:

* `ProcessSandboxRunner`
* `ContainerSandboxRunner`
* `RemoteSandboxRunner`

### ArtifactManager

Controla input, output, retenção, hash, persistência e limpeza.

### AuditLogger

Registra política efetiva, contexto, logs, artefatos, recursos e status.

---

## Modos de isolamento

### `none`

Apenas desenvolvimento. Não permitido em produção.

### `process`

Execução como processo isolado com limites básicos.

### `container`

Execução em container efêmero. Deve ser o padrão recomendado.

### `remote`

Execução em executor remoto dedicado.

---

## Modelo de domínio

### Entidade: SandboxProfile

Perfil reutilizável de sandbox.

Campos:

* `id`
* `name`
* `description`
* `version`
* `isSystem`
* `mode`
* `riskLevel`
* `config`
* `createdAt`
* `updatedAt`

### Entidade: AgentSandboxConfig

Configuração de sandbox atribuída ao agente.

Campos:

* `agentId`
* `enabled`
* `profileId`
* `overrides`
* `enforcement`
* `createdAt`
* `updatedAt`

### Entidade: SandboxExecution

Registro de uma execução.

Campos:

* `id`
* `agentId`
* `taskId`
* `skillId`
* `capability`
* `status`
* `mode`
* `command`
* `policySnapshot`
* `startedAt`
* `finishedAt`
* `durationMs`
* `exitCode`
* `resourceUsage`
* `errorMessage`

### Entidade: SandboxArtifact

Artefato gerado ou preservado na execução.

Campos:

* `id`
* `executionId`
* `name`
* `path`
* `sizeBytes`
* `sha256`
* `mimeType`
* `retainedUntil`
* `metadata`

### Entidade: ApprovalRequest

Pedido de aprovação humana.

Campos:

* `id`
* `agentId`
* `taskId`
* `executionId`
* `reason`
* `requestedAction`
* `status`
* `approvedBy`
* `approvedAt`
* `rejectedAt`

---

## Value Objects

### FilesystemPolicy

* `readOnlyRoot`
* `workingDirectory`
* `allowedReadPaths`
* `allowedWritePaths`
* `tempDirectory`
* `persistArtifacts`
* `maxArtifactSizeMb`
* `maxTotalArtifactSizeMb`

### NetworkPolicy

* `mode`
* `allowedDomains`
* `allowedIps`
* `allowedPorts`
* `blockPrivateNetworks`
* `allowDns`
* `httpOnly`

### ResourceLimits

* `timeoutSeconds`
* `cpuLimit`
* `memoryMb`
* `diskMb`
* `maxProcesses`
* `maxThreads`
* `maxStdoutKb`
* `maxStderrKb`

### ExecutionPolicy

* `allowShell`
* `allowedBinaries`
* `blockedBinaries`
* `allowedInterpreters`
* `allowSubprocessSpawn`
* `allowPackageInstall`

### EnvironmentPolicy

* `runtime`
* `runtimeVersion`
* `envVars`
* `inheritHostEnv`
* `secretInjection`
* `timezone`
* `locale`

### SecurityPolicy

* `runAsNonRoot`
* `noNewPrivileges`
* `disableDeviceAccess`
* `disablePrivilegedMode`
* `disableHostNamespaces`

### IOPolicy

* `maxInputSizeKb`
* `maxOutputSizeKb`
* `allowedOutputTypes`
* `stripSensitiveOutput`
* `contentScan`
* `retention`

### AuditPolicy

* `enabled`
* `captureCommand`
* `captureStdout`
* `captureStderr`
* `captureExitCode`
* `captureArtifacts`
* `captureTiming`
* `captureHashes`
* `capturePolicySnapshot`
* `captureNetworkEvents`

### ApprovalPolicy

* `requireApprovalForExec`
* `requireApprovalForWriteOutsideWorkspace`
* `requireApprovalForNetwork`
* `requireApprovalForLargeArtifacts`

---

## Schema JSON oficial

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://andromeda.local/schemas/sandbox-config.schema.json",
  "title": "SandboxConfig",
  "type": "object",
  "required": [
    "enabled",
    "mode",
    "filesystem",
    "network",
    "resources",
    "execution",
    "environment",
    "security",
    "ioPolicy",
    "audit",
    "approvals"
  ],
  "properties": {
    "enabled": { "type": "boolean" },
    "mode": {
      "type": "string",
      "enum": ["none", "process", "container", "remote"]
    },
    "filesystem": {
      "type": "object",
      "required": [
        "readOnlyRoot",
        "workingDirectory",
        "allowedReadPaths",
        "allowedWritePaths",
        "tempDirectory",
        "persistArtifacts"
      ],
      "properties": {
        "readOnlyRoot": { "type": "boolean" },
        "workingDirectory": { "type": "string", "minLength": 1 },
        "allowedReadPaths": {
          "type": "array",
          "items": { "type": "string", "minLength": 1 }
        },
        "allowedWritePaths": {
          "type": "array",
          "items": { "type": "string", "minLength": 1 }
        },
        "tempDirectory": { "type": "string", "minLength": 1 },
        "persistArtifacts": { "type": "boolean" },
        "maxArtifactSizeMb": { "type": "integer", "minimum": 1 },
        "maxTotalArtifactSizeMb": { "type": "integer", "minimum": 1 }
      },
      "additionalProperties": false
    },
    "network": {
      "type": "object",
      "required": ["mode", "blockPrivateNetworks", "allowDns", "httpOnly"],
      "properties": {
        "mode": {
          "type": "string",
          "enum": ["off", "restricted", "tool_only", "full"]
        },
        "allowedDomains": {
          "type": "array",
          "items": { "type": "string", "minLength": 1 }
        },
        "allowedIps": {
          "type": "array",
          "items": { "type": "string", "minLength": 1 }
        },
        "allowedPorts": {
          "type": "array",
          "items": { "type": "integer", "minimum": 1, "maximum": 65535 }
        },
        "blockPrivateNetworks": { "type": "boolean" },
        "allowDns": { "type": "boolean" },
        "httpOnly": { "type": "boolean" }
      },
      "additionalProperties": false
    },
    "resources": {
      "type": "object",
      "required": [
        "timeoutSeconds",
        "cpuLimit",
        "memoryMb",
        "diskMb",
        "maxProcesses",
        "maxThreads",
        "maxStdoutKb",
        "maxStderrKb"
      ],
      "properties": {
        "timeoutSeconds": { "type": "integer", "minimum": 1 },
        "cpuLimit": { "type": "number", "exclusiveMinimum": 0 },
        "memoryMb": { "type": "integer", "minimum": 64 },
        "diskMb": { "type": "integer", "minimum": 32 },
        "maxProcesses": { "type": "integer", "minimum": 1 },
        "maxThreads": { "type": "integer", "minimum": 1 },
        "maxStdoutKb": { "type": "integer", "minimum": 1 },
        "maxStderrKb": { "type": "integer", "minimum": 1 }
      },
      "additionalProperties": false
    },
    "execution": {
      "type": "object",
      "required": [
        "allowShell",
        "allowedBinaries",
        "blockedBinaries",
        "allowedInterpreters",
        "allowSubprocessSpawn",
        "allowPackageInstall"
      ],
      "properties": {
        "allowShell": { "type": "boolean" },
        "allowedBinaries": {
          "type": "array",
          "items": { "type": "string", "minLength": 1 }
        },
        "blockedBinaries": {
          "type": "array",
          "items": { "type": "string", "minLength": 1 }
        },
        "allowedInterpreters": {
          "type": "array",
          "items": { "type": "string", "minLength": 1 }
        },
        "allowSubprocessSpawn": { "type": "boolean" },
        "allowPackageInstall": { "type": "boolean" }
      },
      "additionalProperties": false
    },
    "environment": {
      "type": "object",
      "required": [
        "runtime",
        "runtimeVersion",
        "envVars",
        "inheritHostEnv",
        "secretInjection",
        "timezone",
        "locale"
      ],
      "properties": {
        "runtime": { "type": "string", "minLength": 1 },
        "runtimeVersion": { "type": "string", "minLength": 1 },
        "envVars": {
          "type": "object",
          "additionalProperties": { "type": "string" }
        },
        "inheritHostEnv": { "type": "boolean" },
        "secretInjection": { "type": "boolean" },
        "timezone": { "type": "string", "minLength": 1 },
        "locale": { "type": "string", "minLength": 1 }
      },
      "additionalProperties": false
    },
    "security": {
      "type": "object",
      "required": [
        "runAsNonRoot",
        "noNewPrivileges",
        "disableDeviceAccess",
        "disablePrivilegedMode",
        "disableHostNamespaces"
      ],
      "properties": {
        "runAsNonRoot": { "type": "boolean" },
        "noNewPrivileges": { "type": "boolean" },
        "disableDeviceAccess": { "type": "boolean" },
        "disablePrivilegedMode": { "type": "boolean" },
        "disableHostNamespaces": { "type": "boolean" }
      },
      "additionalProperties": false
    },
    "ioPolicy": {
      "type": "object",
      "required": [
        "maxInputSizeKb",
        "maxOutputSizeKb",
        "allowedOutputTypes",
        "stripSensitiveOutput",
        "contentScan",
        "retention"
      ],
      "properties": {
        "maxInputSizeKb": { "type": "integer", "minimum": 1 },
        "maxOutputSizeKb": { "type": "integer", "minimum": 1 },
        "allowedOutputTypes": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["text", "json", "file", "binary"]
          }
        },
        "stripSensitiveOutput": { "type": "boolean" },
        "contentScan": { "type": "boolean" },
        "retention": {
          "type": "string",
          "enum": ["none", "request", "session", "task", "persistent"]
        }
      },
      "additionalProperties": false
    },
    "audit": {
      "type": "object",
      "required": [
        "enabled",
        "captureCommand",
        "captureStdout",
        "captureStderr",
        "captureExitCode",
        "captureArtifacts",
        "captureTiming",
        "captureHashes",
        "capturePolicySnapshot",
        "captureNetworkEvents"
      ],
      "properties": {
        "enabled": { "type": "boolean" },
        "captureCommand": { "type": "boolean" },
        "captureStdout": { "type": "boolean" },
        "captureStderr": { "type": "boolean" },
        "captureExitCode": { "type": "boolean" },
        "captureArtifacts": { "type": "boolean" },
        "captureTiming": { "type": "boolean" },
        "captureHashes": { "type": "boolean" },
        "capturePolicySnapshot": { "type": "boolean" },
        "captureNetworkEvents": { "type": "boolean" }
      },
      "additionalProperties": false
    },
    "approvals": {
      "type": "object",
      "required": [
        "requireApprovalForExec",
        "requireApprovalForWriteOutsideWorkspace",
        "requireApprovalForNetwork",
        "requireApprovalForLargeArtifacts"
      ],
      "properties": {
        "requireApprovalForExec": { "type": "boolean" },
        "requireApprovalForWriteOutsideWorkspace": { "type": "boolean" },
        "requireApprovalForNetwork": { "type": "boolean" },
        "requireApprovalForLargeArtifacts": { "type": "boolean" }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false
}
```

---

## Tipos TypeScript

```ts
export type SandboxMode = 'none' | 'process' | 'container' | 'remote';
export type NetworkMode = 'off' | 'restricted' | 'tool_only' | 'full';
export type OutputType = 'text' | 'json' | 'file' | 'binary';
export type RetentionMode = 'none' | 'request' | 'session' | 'task' | 'persistent';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
export type SandboxExecutionStatus =
  | 'queued'
  | 'awaiting_approval'
  | 'provisioning'
  | 'running'
  | 'completed'
  | 'failed'
  | 'timed_out'
  | 'blocked_by_policy'
  | 'cancelled';

export interface FilesystemPolicy {
  readOnlyRoot: boolean;
  workingDirectory: string;
  allowedReadPaths: string[];
  allowedWritePaths: string[];
  tempDirectory: string;
  persistArtifacts: boolean;
  maxArtifactSizeMb?: number;
  maxTotalArtifactSizeMb?: number;
}

export interface NetworkPolicy {
  mode: NetworkMode;
  allowedDomains?: string[];
  allowedIps?: string[];
  allowedPorts?: number[];
  blockPrivateNetworks: boolean;
  allowDns: boolean;
  httpOnly: boolean;
}

export interface ResourceLimits {
  timeoutSeconds: number;
  cpuLimit: number;
  memoryMb: number;
  diskMb: number;
  maxProcesses: number;
  maxThreads: number;
  maxStdoutKb: number;
  maxStderrKb: number;
}

export interface ExecutionPolicy {
  allowShell: boolean;
  allowedBinaries: string[];
  blockedBinaries: string[];
  allowedInterpreters: string[];
  allowSubprocessSpawn: boolean;
  allowPackageInstall: boolean;
}

export interface EnvironmentPolicy {
  runtime: string;
  runtimeVersion: string;
  envVars: Record<string, string>;
  inheritHostEnv: boolean;
  secretInjection: boolean;
  timezone: string;
  locale: string;
}

export interface SecurityPolicy {
  runAsNonRoot: boolean;
  noNewPrivileges: boolean;
  disableDeviceAccess: boolean;
  disablePrivilegedMode: boolean;
  disableHostNamespaces: boolean;
}

export interface IOPolicy {
  maxInputSizeKb: number;
  maxOutputSizeKb: number;
  allowedOutputTypes: OutputType[];
  stripSensitiveOutput: boolean;
  contentScan: boolean;
  retention: RetentionMode;
}

export interface AuditPolicy {
  enabled: boolean;
  captureCommand: boolean;
  captureStdout: boolean;
  captureStderr: boolean;
  captureExitCode: boolean;
  captureArtifacts: boolean;
  captureTiming: boolean;
  captureHashes: boolean;
  capturePolicySnapshot: boolean;
  captureNetworkEvents: boolean;
}

export interface ApprovalPolicy {
  requireApprovalForExec: boolean;
  requireApprovalForWriteOutsideWorkspace: boolean;
  requireApprovalForNetwork: boolean;
  requireApprovalForLargeArtifacts: boolean;
}

export interface SandboxConfig {
  enabled: boolean;
  mode: SandboxMode;
  filesystem: FilesystemPolicy;
  network: NetworkPolicy;
  resources: ResourceLimits;
  execution: ExecutionPolicy;
  environment: EnvironmentPolicy;
  security: SecurityPolicy;
  ioPolicy: IOPolicy;
  audit: AuditPolicy;
  approvals: ApprovalPolicy;
}

export interface SandboxProfile {
  id: string;
  name: string;
  description: string;
  version: number;
  isSystem: boolean;
  mode: SandboxMode;
  riskLevel: RiskLevel;
  config: SandboxConfig;
  createdAt: string;
  updatedAt: string;
}

export interface AgentSandboxConfig {
  agentId: string;
  enabled: boolean;
  profileId: string | null;
  overrides: Partial<SandboxConfig>;
  enforcement: {
    mandatoryForCapabilities: string[];
    fallbackBehavior: 'deny' | 'allow';
  };
  createdAt: string;
  updatedAt: string;
}

export interface SandboxExecution {
  id: string;
  agentId: string;
  taskId?: string | null;
  skillId?: string | null;
  capability: string;
  status: SandboxExecutionStatus;
  mode: SandboxMode;
  command: string[];
  policySnapshot: SandboxConfig;
  startedAt?: string | null;
  finishedAt?: string | null;
  durationMs?: number | null;
  exitCode?: number | null;
  resourceUsage?: {
    cpuMs?: number;
    memoryPeakMb?: number;
    diskWrittenMb?: number;
    stdoutKb?: number;
    stderrKb?: number;
  };
  errorMessage?: string | null;
}

export interface SandboxArtifact {
  id: string;
  executionId: string;
  name: string;
  path: string;
  sizeBytes: number;
  sha256: string;
  mimeType?: string | null;
  retainedUntil?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ApprovalRequest {
  id: string;
  agentId: string;
  taskId?: string | null;
  executionId?: string | null;
  reason: string;
  requestedAction: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
}
```

---

## Regras de negócio obrigatórias

### Regras de bloqueio absoluto

* nunca executar como root
* nunca habilitar modo privilegiado
* nunca herdar segredos do host por padrão
* nunca permitir escrita fora do escopo sem policy explícita
* nunca permitir binários bloqueados
* nunca permitir acesso à rede privada se `blockPrivateNetworks=true`

### Regras de validação

* `workingDirectory` deve estar sob área controlada pelo sistema
* `allowedWritePaths` deve ser não vazio quando a capability exigir escrita
* `mode=none` não permitido em produção
* `network.mode=full` exige autorização administrativa
* `allowShell=true` eleva nível de risco
* binário não pode estar simultaneamente em `allowedBinaries` e `blockedBinaries`
* `memoryMb`, `diskMb`, `timeoutSeconds` devem respeitar limites globais

### Regra de consolidação

Na fusão de políticas, o resultado final deve sempre escolher a configuração mais restritiva.

---

## Presets oficiais

### Safe Readonly

Uso: agentes consultivos.

### Research

Uso: agentes de pesquisa e coleta web controlada.

### Code Runner

Uso: transformação de arquivos, scripts controlados e geração de artefatos.

### Automation Restricted

Uso: automações recorrentes com forte limitação.

### Operator Elevated

Uso: agentes especiais, ainda auditados e com barreiras extras.

---

## Endpoints REST

### Perfis de sandbox

#### `GET /sandbox/profiles`

Lista perfis.

#### `POST /sandbox/profiles`

Cria perfil customizado.

#### `GET /sandbox/profiles/:id`

Obtém detalhes de um perfil.

#### `PUT /sandbox/profiles/:id`

Atualiza perfil.

#### `DELETE /sandbox/profiles/:id`

Remove perfil customizado.

### Configuração por agente

#### `GET /agents/:id/sandbox`

Retorna a configuração atribuída ao agente.

#### `PUT /agents/:id/sandbox`

Atualiza a configuração do agente.

Body sugerido:

```json
{
  "enabled": true,
  "profileId": "sbx_profile_code_runner",
  "overrides": {
    "resources": {
      "timeoutSeconds": 45
    }
  },
  "enforcement": {
    "mandatoryForCapabilities": ["exec", "process", "write"],
    "fallbackBehavior": "deny"
  }
}
```

### Validação e simulação

#### `POST /sandbox/validate`

Valida uma configuração completa.

#### `POST /sandbox/dry-run`

Resolve a policy efetiva sem executar.

Body sugerido:

```json
{
  "agentId": "agent_coder",
  "capability": "exec",
  "command": ["python3", "script.py"],
  "requestedPaths": ["/workspace/input/data.csv"]
}
```

### Execuções

#### `GET /sandbox/executions`

Lista execuções.

#### `GET /sandbox/executions/:id`

Retorna detalhes da execução.

#### `GET /sandbox/executions/:id/logs`

Retorna logs.

#### `GET /sandbox/executions/:id/artifacts`

Lista artefatos.

#### `POST /sandbox/executions/:id/cancel`

Cancela execução em andamento.

### Aprovações

#### `GET /approvals`

Lista aprovações pendentes.

#### `POST /approvals/:id/approve`

Aprova ação.

#### `POST /approvals/:id/reject`

Rejeita ação.

---

## Contratos de resposta

### Resposta de execução

```json
{
  "id": "sbx_exec_123",
  "status": "completed",
  "exitCode": 0,
  "startedAt": "2026-03-18T18:00:00Z",
  "finishedAt": "2026-03-18T18:00:06Z",
  "durationMs": 6000,
  "stdoutPreview": "Arquivo processado com sucesso",
  "stderrPreview": "",
  "artifacts": [
    {
      "name": "normalized.csv",
      "path": "/workspace/output/normalized.csv",
      "sizeBytes": 15234,
      "sha256": "..."
    }
  ],
  "resourceUsage": {
    "memoryPeakMb": 218,
    "cpuMs": 1900
  },
  "policySnapshot": {}
}
```

---

## Estrutura de pastas sugerida

### Backend

```text
packages/backend/
  src/
    domain/
      sandbox/
        entities/
          SandboxProfile.ts
          AgentSandboxConfig.ts
          SandboxExecution.ts
          SandboxArtifact.ts
          ApprovalRequest.ts
        value-objects/
          FilesystemPolicy.ts
          NetworkPolicy.ts
          ResourceLimits.ts
          ExecutionPolicy.ts
          EnvironmentPolicy.ts
          SecurityPolicy.ts
          IOPolicy.ts
          AuditPolicy.ts
          ApprovalPolicy.ts
        services/
          CapabilityPolicyEngine.ts
          SandboxPolicyResolver.ts
          SandboxValidator.ts
          RiskLevelCalculator.ts
        repositories/
          SandboxProfileRepository.ts
          AgentSandboxConfigRepository.ts
          SandboxExecutionRepository.ts
          SandboxArtifactRepository.ts
          ApprovalRequestRepository.ts
    application/
      sandbox/
        use-cases/
          CreateSandboxProfile.ts
          UpdateSandboxProfile.ts
          DeleteSandboxProfile.ts
          GetSandboxProfile.ts
          ListSandboxProfiles.ts
          GetAgentSandboxConfig.ts
          UpdateAgentSandboxConfig.ts
          ValidateSandboxConfig.ts
          DryRunSandboxPolicy.ts
          StartSandboxExecution.ts
          CancelSandboxExecution.ts
          ListSandboxExecutions.ts
          GetSandboxExecution.ts
          GetSandboxExecutionLogs.ts
          ListSandboxArtifacts.ts
          ApproveSandboxAction.ts
          RejectSandboxAction.ts
    infrastructure/
      sandbox/
        runners/
          ProcessSandboxRunner.ts
          ContainerSandboxRunner.ts
          RemoteSandboxRunner.ts
        repositories/
          PrismaSandboxProfileRepository.ts
          PrismaAgentSandboxConfigRepository.ts
          PrismaSandboxExecutionRepository.ts
          PrismaSandboxArtifactRepository.ts
          PrismaApprovalRequestRepository.ts
        services/
          LocalArtifactManager.ts
          FileAuditLogger.ts
          PolicyMergeService.ts
    interfaces/
      http/
        controllers/
          sandbox/
            SandboxProfilesController.ts
            AgentSandboxController.ts
            SandboxValidationController.ts
            SandboxExecutionsController.ts
            SandboxApprovalsController.ts
        routes/
          sandbox.routes.ts
```

### Frontend

```text
apps/web/
  src/
    features/
      sandbox/
        api/
          getSandboxProfiles.ts
          getAgentSandbox.ts
          updateAgentSandbox.ts
          validateSandboxConfig.ts
          dryRunSandbox.ts
          listSandboxExecutions.ts
          getSandboxExecution.ts
          approveSandboxAction.ts
          rejectSandboxAction.ts
        components/
          SandboxTab.tsx
          SandboxGeneralSection.tsx
          SandboxFilesystemSection.tsx
          SandboxNetworkSection.tsx
          SandboxResourcesSection.tsx
          SandboxExecutionSection.tsx
          SandboxSecuritySection.tsx
          SandboxAuditSection.tsx
          SandboxApprovalsSection.tsx
          SandboxPolicyViewer.tsx
          SandboxRiskBadge.tsx
          SandboxExecutionTable.tsx
          SandboxExecutionDrawer.tsx
        hooks/
          useSandboxProfiles.ts
          useAgentSandbox.ts
          useSandboxValidation.ts
          useSandboxExecutions.ts
        types/
          sandbox.ts
```

---

## Banco de dados

### `sandbox_profiles`

* `id`
* `name`
* `description`
* `version`
* `is_system`
* `mode`
* `risk_level`
* `config_json`
* `created_at`
* `updated_at`

### `agent_sandbox_configs`

* `agent_id`
* `enabled`
* `profile_id`
* `overrides_json`
* `enforcement_json`
* `created_at`
* `updated_at`

### `sandbox_executions`

* `id`
* `agent_id`
* `task_id`
* `skill_id`
* `capability`
* `status`
* `mode`
* `command_json`
* `policy_snapshot_json`
* `started_at`
* `finished_at`
* `duration_ms`
* `exit_code`
* `usage_json`
* `error_message`

### `sandbox_artifacts`

* `id`
* `execution_id`
* `name`
* `path`
* `size_bytes`
* `sha256`
* `mime_type`
* `retained_until`
* `metadata_json`

### `approval_requests`

* `id`
* `agent_id`
* `task_id`
* `execution_id`
* `reason`
* `requested_action_json`
* `status`
* `approved_by`
* `approved_at`
* `rejected_at`

---

## Fluxo completo de execução

1. agente decide usar uma capability ou skill
2. `CapabilityPolicyEngine` verifica autorização
3. `SandboxPolicyResolver` monta política efetiva
4. `SandboxValidator` valida a política
5. `ApprovalGate` bloqueia se houver necessidade de aprovação
6. `ExecutionOrchestrator` prepara workspace, mounts e limites
7. `SandboxRunner` executa
8. `ArtifactManager` coleta artefatos
9. `AuditLogger` persiste logs e metadados
10. resultado retorna para o runtime do agente

---

## Interface web sugerida

A configuração deve ficar na aba de agente em um bloco chamado `Sandbox`.

### Seções

* Geral
* Filesystem
* Rede
* Recursos
* Execução
* Segurança
* Auditoria
* Aprovações
* Simulação de policy
* Histórico de execuções

### Recursos de UX importantes

* badge de risco
* warnings para configurações perigosas
* diff visual entre preset e override
* visualização da policy efetiva consolidada
* botão de validação antes de salvar
* botão de dry-run

---

## Roadmap de implementação

### Fase 1

* tipos e schema
* entidades de domínio
* profiles
* config por agente
* policy resolver
* validator
* process runner
* audit básico
* endpoints REST
* UI inicial

### Fase 2

* container runner
* approvals
* artifact manager completo
* effective policy viewer
* risk calculator

### Fase 3

* remote runner
* eventos em tempo real
* métricas avançadas
* diffs de policy
* templates por categoria de agente

---

## Defaults oficiais recomendados

### Sistema

* rede desligada por padrão
* execução como não-root sempre
* auditoria sempre ligada
* segredos nunca herdados por padrão
* container como modo recomendado
* process como fallback para desenvolvimento

### Capability enforcement

* `exec` exige sandbox
* `process` exige sandbox
* `write` exige sandbox
* `cron` exige sandbox
* `gateway` exige sandbox quando alterar estado

---

## Definição oficial

A sandbox do Andromeda é o subsistema de execução segura responsável por aplicar isolamento, limites, políticas e auditoria às ações operacionais dos agentes, garantindo que capacidades autorizadas sejam executadas de forma previsível, rastreável e controlada.
