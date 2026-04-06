import { getApiBaseUrl } from './runtime-config';
import { apiFetch } from './api-auth';

export interface AgentSummary {
  id: string;
  name: string;
  role: string;
  category: string;
  teamId: string;
  status: 'active' | 'archived';
  type: string;
  defaultModel: string;
  profileVersion: string;
  identityActive: boolean;
  recentConformanceScore?: number;
  lastExecutionAt?: string;
}

export interface CreateAgentInput {
  id?: string;
  name: string;
  role: string;
  description: string;
  teamId?: string;
  category?: string;
  type?: string;
  defaultModel?: string;
  isDefault?: boolean;
  specializations?: string[];
}

export interface AgentBehaviorConfig {
  formality: number;
  warmth: number;
  objectivity: number;
  detailLevel: number;
  caution: number;
  autonomy: number;
  creativity: number;
  ambiguityTolerance: number;
  proactivity: number;
  delegationTendency: number;
  feedbackFrequency: number;
  playbookStrictness: number;
  complianceStrictness: number;
  selfReviewIntensity: number;
  evidenceRequirements: number;
}

export interface AgentSafeguardConfig {
  mode: 'strict' | 'balanced' | 'flexible';
  minOverallConformance: number;
  requireAuditOnCriticalTasks: boolean;
  alwaysProvideIntermediateFeedback: boolean;
  preferSpecialistDelegation: boolean;
  blockOutOfRoleResponses: boolean;
  runSelfReview: boolean;
  prioritizeSkillFirst: boolean;
  alwaysSuggestNextSteps: boolean;
  correctiveAction: 'allow_with_notice' | 'rewrite' | 'fallback' | 'block';
  fallbackAgentId?: string;
  activePolicies: string[];
}

export interface AgentMarkdownSections {
  identity: string;
  soul: string;
  rules: string;
  playbook: string;
  context: string;
}

export interface AgentProfileDocument {
  id: string;
  version: string;
  status: 'active' | 'archived';
  description: string;
  teamId: string;
  category: string;
  type: string;
  defaultModel: string;
  isDefault: boolean;
  identity: {
    name: string;
    role: string;
    mission: string;
    scope: string;
    communicationStyle: string;
    ecosystemRole: string;
    agentType: string;
    specializations: string[];
  };
  markdown: AgentMarkdownSections;
  persona: AgentBehaviorConfig;
  safeguards: AgentSafeguardConfig;
  createdAt: string;
  updatedAt: string;
}

export interface AgentProfileHistoryEntry {
  version: string;
  updatedAt: string;
  summary: string;
  restoredFromVersion?: string;
}

export interface AgentStoredVersionEntry {
  versionNumber: number;
  sourceVersionLabel?: string;
  changeSummary: string;
  restoredFromVersionNumber?: number;
  createdBy?: string;
  createdAt: string;
}

export interface PlaybookSuggestionItem {
  id: string;
  agentId: string;
  title: string;
  summary: string;
  suggestion: string;
  confidence: number;
  status: string;
  sourceEpisodeIds: string[];
  sourceEpisodes: Array<{
    id: string;
    summary: string;
    createdAt: string;
    importanceScore: number;
  }>;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface AgentConformanceExecution {
  overallConformanceScore: number;
  status: string;
  selectedModel: string;
  createdAt: string;
  violations: string[];
}

export interface AgentConformanceView {
  agentId: string;
  averageOverallConformanceScore?: number;
  lastExecutionAt?: string;
  recentExecutions: AgentConformanceExecution[];
  recentViolations: string[];
}

export interface AgentPerformanceRecord {
  agentId: string;
  periodType: string;
  periodStart: string;
  periodEnd: string;
  tasksTotal: number;
  tasksSucceeded: number;
  tasksFailed: number;
  successRate: number;
  avgConformance: number | null;
  feedbackScore: number | null;
  avgLatencyMs: number | null;
  totalTokensUsed: number;
  totalCostUsd: number;
  reputationScores: Record<string, number>;
  reputationUpdatedAt: string | null;
  metricsSnapshot: Record<string, unknown> | null;
}

export interface AgentPerformanceView {
  agentId: string;
  period: string;
  items: AgentPerformanceRecord[];
}

export interface AgentPerformanceTrendPoint {
  weekStart: string;
  avgSuccessRate: number;
  avgConformanceScore: number;
  totalCostUsd: number;
}

export interface AgentPerformanceTrendView {
  agentId: string;
  items: AgentPerformanceTrendPoint[];
}

export interface AgentHistoryItem {
  taskId: string;
  sessionId?: string;
  prompt: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  model?: string;
  audit?: {
    overallConformanceScore: number;
    status: string;
  };
}

export interface AgentChatResponse {
  taskId: string;
  status: string;
  sessionId?: string;
  result?: {
    content?: string;
    model?: string;
    agent?: {
      id: string;
      name: string;
      role: string;
      version: string;
    };
    audit?: {
      overallConformanceScore: number;
      status: string;
      violations: string[];
    };
  };
  audit?: {
    overallConformanceScore: number;
    status: string;
    violations: string[];
  };
}

export type SandboxMode = 'none' | 'process' | 'container' | 'remote';
export type NetworkMode = 'off' | 'restricted' | 'tool_only' | 'full';
export type OutputType = 'text' | 'json' | 'file' | 'binary';
export type RetentionMode = 'none' | 'request' | 'session' | 'task' | 'persistent';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

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

export interface SandboxConfig {
  enabled: boolean;
  mode: SandboxMode;
  filesystem: {
    readOnlyRoot: boolean;
    workingDirectory: string;
    allowedReadPaths: string[];
    allowedWritePaths: string[];
    tempDirectory: string;
    persistArtifacts: boolean;
    maxArtifactSizeMb?: number;
    maxTotalArtifactSizeMb?: number;
  };
  network: {
    mode: NetworkMode;
    allowedDomains?: string[];
    allowedIps?: string[];
    allowedPorts?: number[];
    blockPrivateNetworks: boolean;
    allowDns: boolean;
    httpOnly: boolean;
  };
  resources: {
    timeoutSeconds: number;
    cpuLimit: number;
    memoryMb: number;
    diskMb: number;
    maxProcesses: number;
    maxThreads: number;
    maxStdoutKb: number;
    maxStderrKb: number;
  };
  execution: {
    allowShell: boolean;
    allowedBinaries: string[];
    blockedBinaries: string[];
    allowedInterpreters: string[];
    allowSubprocessSpawn: boolean;
    allowPackageInstall: boolean;
  };
  environment: {
    runtime: string;
    runtimeVersion: string;
    envVars: Record<string, string>;
    inheritHostEnv: boolean;
    secretInjection: boolean;
    timezone: string;
    locale: string;
  };
  security: {
    runAsNonRoot: boolean;
    noNewPrivileges: boolean;
    disableDeviceAccess: boolean;
    disablePrivilegedMode: boolean;
    disableHostNamespaces: boolean;
  };
  ioPolicy: {
    maxInputSizeKb: number;
    maxOutputSizeKb: number;
    allowedOutputTypes: OutputType[];
    stripSensitiveOutput: boolean;
    contentScan: boolean;
    retention: RetentionMode;
  };
  audit: {
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
  };
  approvals: {
    requireApprovalForExec: boolean;
    requireApprovalForWriteOutsideWorkspace: boolean;
    requireApprovalForNetwork: boolean;
    requireApprovalForLargeArtifacts: boolean;
  };
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

export interface SandboxValidationResult {
  valid: boolean;
  issues: Array<{ field: string; message: string; severity: 'error' | 'warning' }>;
}

export interface SandboxDryRunResult {
  allowed: boolean;
  requiresApproval: boolean;
  riskLevel: RiskLevel;
  validation: SandboxValidationResult;
  effectivePolicy: SandboxConfig;
  reasons: string[];
}

export interface SandboxExecutionItem {
  id: string;
  agentId: string;
  taskId?: string | null;
  skillId?: string | null;
  capability: string;
  status: string;
  mode: SandboxMode;
  command: string[];
  policySnapshot: SandboxConfig;
  startedAt?: string | null;
  finishedAt?: string | null;
  durationMs?: number | null;
  exitCode?: number | null;
  errorMessage?: string | null;
  stdout?: string;
  stderr?: string;
}

export interface ApprovalRequestItem {
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

export async function listAgents(): Promise<AgentSummary[]> {
  const response = await apiFetch(`${getApiBaseUrl()}/agents`);
  ensureOk(response, 'Falha ao listar agentes.');
  return response.json() as Promise<AgentSummary[]>;
}

export async function createAgent(input: CreateAgentInput): Promise<AgentProfileDocument> {
  const response = await apiFetch(`${getApiBaseUrl()}/agents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  ensureOk(response, 'Falha ao criar agente.');
  return response.json() as Promise<AgentProfileDocument>;
}

export async function getAgentProfile(id: string): Promise<AgentProfileDocument> {
  const response = await apiFetch(`${getApiBaseUrl()}/agents/${id}/profile`);
  ensureOk(response, 'Falha ao carregar o perfil do agente.');
  return response.json() as Promise<AgentProfileDocument>;
}

export async function updateAgentProfile(id: string, payload: Partial<AgentProfileDocument>): Promise<AgentProfileDocument> {
  const response = await apiFetch(`${getApiBaseUrl()}/agents/${id}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  ensureOk(response, 'Falha ao salvar o perfil do agente.');
  return response.json() as Promise<AgentProfileDocument>;
}

export async function getAgentProfileHistory(id: string): Promise<AgentProfileHistoryEntry[]> {
  const response = await apiFetch(`${getApiBaseUrl()}/agents/${id}/profile/history`);
  ensureOk(response, 'Falha ao carregar o historico do perfil.');
  return response.json() as Promise<AgentProfileHistoryEntry[]>;
}

export async function restoreAgentProfileVersion(id: string, version: string): Promise<AgentProfileDocument> {
  const response = await apiFetch(`${getApiBaseUrl()}/agents/${id}/profile/restore/${version}`, {
    method: 'POST',
  });
  ensureOk(response, 'Falha ao restaurar a versao do perfil.');
  return response.json() as Promise<AgentProfileDocument>;
}

export async function getAgentVersions(id: string): Promise<AgentStoredVersionEntry[]> {
  const response = await apiFetch(`${getApiBaseUrl()}/agents/${id}/versions`);
  ensureOk(response, 'Falha ao carregar as versoes do agente.');
  const payload = await response.json() as { items?: AgentStoredVersionEntry[] };
  return payload.items || [];
}

export async function restoreAgentStoredVersion(id: string, versionNumber: number): Promise<{
  agentId: string;
  restoredVersionNumber: number;
  currentVersionNumber: number;
  profileVersionLabel: string;
  updatedAt: string;
}> {
  const response = await apiFetch(`${getApiBaseUrl()}/agents/${id}/versions/${versionNumber}/restore`, {
    method: 'POST',
  });
  ensureOk(response, 'Falha ao restaurar a versao persistida do agente.');
  return response.json() as Promise<{
    agentId: string;
    restoredVersionNumber: number;
    currentVersionNumber: number;
    profileVersionLabel: string;
    updatedAt: string;
  }>;
}

export async function listPlaybookSuggestions(id: string): Promise<PlaybookSuggestionItem[]> {
  const response = await apiFetch(`${getApiBaseUrl()}/agents/${id}/playbook-suggestions`);
  ensureOk(response, 'Falha ao carregar as sugestoes de playbook.');
  const payload = await response.json() as { items?: PlaybookSuggestionItem[] };
  return payload.items || [];
}

export async function approvePlaybookSuggestion(id: string, suggestionId: string): Promise<PlaybookSuggestionItem> {
  const response = await apiFetch(`${getApiBaseUrl()}/agents/${id}/playbook-suggestions/${suggestionId}/approve`, {
    method: 'POST',
  });
  ensureOk(response, 'Falha ao aprovar a sugestao de playbook.');
  return response.json() as Promise<PlaybookSuggestionItem>;
}

export async function rejectPlaybookSuggestion(id: string, suggestionId: string, reason?: string): Promise<PlaybookSuggestionItem> {
  const response = await apiFetch(`${getApiBaseUrl()}/agents/${id}/playbook-suggestions/${suggestionId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });
  ensureOk(response, 'Falha ao rejeitar a sugestao de playbook.');
  return response.json() as Promise<PlaybookSuggestionItem>;
}

export async function getAgentBehavior(id: string): Promise<AgentBehaviorConfig> {
  const response = await apiFetch(`${getApiBaseUrl()}/agents/${id}/behavior`);
  ensureOk(response, 'Falha ao carregar os parametros comportamentais.');
  return response.json() as Promise<AgentBehaviorConfig>;
}

export async function updateAgentBehavior(id: string, payload: Partial<AgentBehaviorConfig>): Promise<AgentBehaviorConfig> {
  const response = await apiFetch(`${getApiBaseUrl()}/agents/${id}/behavior`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  ensureOk(response, 'Falha ao salvar os parametros comportamentais.');
  return response.json() as Promise<AgentBehaviorConfig>;
}

export async function getAgentSafeguards(id: string): Promise<AgentSafeguardConfig> {
  const response = await apiFetch(`${getApiBaseUrl()}/agents/${id}/safeguards`);
  ensureOk(response, 'Falha ao carregar as safeguards.');
  return response.json() as Promise<AgentSafeguardConfig>;
}

export async function updateAgentSafeguards(id: string, payload: Partial<AgentSafeguardConfig>): Promise<AgentSafeguardConfig> {
  const response = await apiFetch(`${getApiBaseUrl()}/agents/${id}/safeguards`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  ensureOk(response, 'Falha ao salvar as safeguards.');
  return response.json() as Promise<AgentSafeguardConfig>;
}

export async function getAgentConformance(id: string): Promise<AgentConformanceView> {
  const response = await apiFetch(`${getApiBaseUrl()}/agents/${id}/conformance`);
  ensureOk(response, 'Falha ao carregar a conformidade do agente.');
  return response.json() as Promise<AgentConformanceView>;
}

export async function getAgentHistory(id: string): Promise<AgentHistoryItem[]> {
  const response = await apiFetch(`${getApiBaseUrl()}/agents/${id}/history`);
  ensureOk(response, 'Falha ao carregar o historico do agente.');
  return response.json() as Promise<AgentHistoryItem[]>;
}

export async function getAgentPerformance(id: string, period = '30d'): Promise<AgentPerformanceView> {
  const response = await apiFetch(`${getApiBaseUrl()}/agents/${id}/performance?period=${encodeURIComponent(period)}`);
  ensureOk(response, 'Falha ao carregar o historico de performance do agente.');
  return response.json() as Promise<AgentPerformanceView>;
}

export async function getAgentPerformanceTrend(id: string): Promise<AgentPerformanceTrendView> {
  const response = await apiFetch(`${getApiBaseUrl()}/agents/${id}/performance/trend`);
  ensureOk(response, 'Falha ao carregar a tendencia de performance do agente.');
  return response.json() as Promise<AgentPerformanceTrendView>;
}

export async function chatWithAgent(id: string, payload: { prompt: string; sessionId?: string; modelId?: string; interactionMode?: string; }): Promise<AgentChatResponse> {
  const response = await apiFetch(`${getApiBaseUrl()}/agents/${id}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  ensureOk(response, 'Falha ao conversar com o agente.');
  return response.json() as Promise<AgentChatResponse>;
}

export async function listSandboxProfiles(): Promise<SandboxProfile[]> {
  const response = await apiFetch(`${getApiBaseUrl()}/sandbox/profiles`);
  ensureOk(response, 'Falha ao listar os perfis de sandbox.');
  return response.json() as Promise<SandboxProfile[]>;
}

export async function getAgentSandbox(id: string): Promise<AgentSandboxConfig> {
  const response = await apiFetch(`${getApiBaseUrl()}/sandbox/agents/${id}/sandbox`);
  ensureOk(response, 'Falha ao carregar a configuracao de sandbox do agente.');
  return response.json() as Promise<AgentSandboxConfig>;
}

export async function updateAgentSandbox(id: string, payload: Partial<AgentSandboxConfig>): Promise<AgentSandboxConfig> {
  const response = await apiFetch(`${getApiBaseUrl()}/sandbox/agents/${id}/sandbox`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  ensureOk(response, 'Falha ao salvar a configuracao de sandbox.');
  return response.json() as Promise<AgentSandboxConfig>;
}

export async function validateSandboxConfig(payload: SandboxConfig): Promise<SandboxValidationResult> {
  const response = await apiFetch(`${getApiBaseUrl()}/sandbox/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  ensureOk(response, 'Falha ao validar a configuracao de sandbox.');
  return response.json() as Promise<SandboxValidationResult>;
}

export async function dryRunSandbox(payload: {
  agentId: string;
  capability: string;
  command: string[];
  requestedPaths?: string[];
  taskId?: string;
  skillId?: string;
  skillRequirements?: Partial<SandboxConfig>;
  temporaryOverrides?: Partial<SandboxConfig>;
}): Promise<SandboxDryRunResult> {
  const response = await apiFetch(`${getApiBaseUrl()}/sandbox/dry-run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  ensureOk(response, 'Falha ao executar dry-run de sandbox.');
  return response.json() as Promise<SandboxDryRunResult>;
}

export async function listSandboxExecutions(): Promise<SandboxExecutionItem[]> {
  const response = await apiFetch(`${getApiBaseUrl()}/sandbox/executions`);
  ensureOk(response, 'Falha ao listar execucoes de sandbox.');
  return response.json() as Promise<SandboxExecutionItem[]>;
}

export async function startSandboxExecution(payload: {
  agentId: string;
  capability: string;
  command: string[];
  taskId?: string;
  skillId?: string;
  requestedPaths?: string[];
  skillRequirements?: Partial<SandboxConfig>;
  temporaryOverrides?: Partial<SandboxConfig>;
}): Promise<{ execution: SandboxExecutionItem; approvalRequest?: ApprovalRequestItem }> {
  const response = await apiFetch(`${getApiBaseUrl()}/sandbox/executions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  ensureOk(response, 'Falha ao iniciar a execucao de sandbox.');
  return response.json() as Promise<{ execution: SandboxExecutionItem; approvalRequest?: ApprovalRequestItem }>;
}

function ensureOk(response: Response, fallbackMessage: string) {
  if (response.ok) {
    return;
  }

  throw new Error(fallbackMessage);
}
