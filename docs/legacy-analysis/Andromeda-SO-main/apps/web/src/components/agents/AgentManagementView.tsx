import React, { useEffect, useMemo, useState } from 'react';
import { Bot, History, Lightbulb, LineChart, MessageSquare, Plus, Save, Shield, SlidersHorizontal, Sparkles, Upload } from 'lucide-react';
import {
  dryRunSandbox,
  chatWithAgent,
  createAgent,
  getAgentSandbox,
  getAgentBehavior,
  getAgentConformance,
  getAgentHistory,
  getAgentPerformance,
  getAgentPerformanceTrend,
  getAgentProfile,
  getAgentProfileHistory,
  getAgentVersions,
  listPlaybookSuggestions,
  approvePlaybookSuggestion,
  rejectPlaybookSuggestion,
  getAgentSafeguards,
  listSandboxExecutions,
  listSandboxProfiles,
  restoreAgentProfileVersion,
  restoreAgentStoredVersion,
  startSandboxExecution,
  updateAgentSandbox,
  updateAgentBehavior,
  updateAgentProfile,
  updateAgentSafeguards,
  validateSandboxConfig,
} from '../../lib/agents';
import type {
  AgentBehaviorConfig,
  CreateAgentInput,
  AgentSandboxConfig,
  AgentConformanceView,
  AgentHistoryItem,
  AgentMarkdownSections,
  AgentPerformanceTrendView,
  AgentPerformanceView,
  PlaybookSuggestionItem,
  AgentProfileDocument,
  AgentProfileHistoryEntry,
  AgentStoredVersionEntry,
  AgentSafeguardConfig,
  AgentSummary,
  SandboxDryRunResult,
  SandboxExecutionItem,
  SandboxConfig,
  SandboxProfile,
  SandboxValidationResult,
} from '../../lib/agents';
import { useI18n, useTooltipEntry, useTooltipText } from '../../contexts/I18nContext';
import { RichTooltip, TooltipIcon } from '../ui/RichTooltip';
import type { TooltipEntry } from '../../lib/tooltip-messages';
import { AgentImportModal } from '../AgentImportModal';
import { AgentExportModal } from '../AgentExportModal';

type AgentTab = 'identity' | 'history' | 'performance' | 'suggestions' | 'behavior' | 'safeguards' | 'sandbox' | 'chat';
type MarkdownKey = keyof AgentMarkdownSections;

const markdownTabs: MarkdownKey[] = ['identity', 'soul', 'rules', 'playbook', 'context'];
const behaviorKeys: Array<{ key: keyof AgentBehaviorConfig; label: string }> = [
  { key: 'formality', label: 'Formality' },
  { key: 'warmth', label: 'Warmth' },
  { key: 'objectivity', label: 'Objectivity' },
  { key: 'detailLevel', label: 'Detail' },
  { key: 'caution', label: 'Caution' },
  { key: 'autonomy', label: 'Autonomy' },
  { key: 'creativity', label: 'Creativity' },
  { key: 'ambiguityTolerance', label: 'Ambiguity' },
  { key: 'proactivity', label: 'Proactivity' },
  { key: 'delegationTendency', label: 'Delegation' },
  { key: 'feedbackFrequency', label: 'Feedback' },
  { key: 'playbookStrictness', label: 'Playbook' },
  { key: 'complianceStrictness', label: 'Compliance' },
  { key: 'selfReviewIntensity', label: 'Self Review' },
  { key: 'evidenceRequirements', label: 'Evidence' },
];

const behaviorTooltipKeys: Record<keyof AgentBehaviorConfig, string> = {
  formality: 'agents.behavior.formality',
  warmth: 'agents.behavior.warmth',
  objectivity: 'agents.behavior.objectivity',
  detailLevel: 'agents.behavior.detailLevel',
  caution: 'agents.behavior.caution',
  autonomy: 'agents.behavior.autonomy',
  creativity: 'agents.behavior.creativity',
  ambiguityTolerance: 'agents.behavior.ambiguityTolerance',
  proactivity: 'agents.behavior.proactivity',
  delegationTendency: 'agents.behavior.delegationTendency',
  feedbackFrequency: 'agents.behavior.feedbackFrequency',
  playbookStrictness: 'agents.behavior.playbookStrictness',
  complianceStrictness: 'agents.behavior.complianceStrictness',
  selfReviewIntensity: 'agents.behavior.selfReviewIntensity',
  evidenceRequirements: 'agents.behavior.evidenceRequirements',
};

const safeguardToggles: Array<{ key: keyof AgentSafeguardConfig; label: string }> = [
  { key: 'requireAuditOnCriticalTasks', label: 'Require audit on critical tasks' },
  { key: 'alwaysProvideIntermediateFeedback', label: 'Always provide intermediate feedback' },
  { key: 'preferSpecialistDelegation', label: 'Prefer specialist delegation' },
  { key: 'blockOutOfRoleResponses', label: 'Block out-of-role responses' },
  { key: 'runSelfReview', label: 'Run self-review automatically' },
  { key: 'prioritizeSkillFirst', label: 'Prioritize skill-first routing' },
  { key: 'alwaysSuggestNextSteps', label: 'Always suggest next steps' },
];

const safeguardTooltipKeys: Partial<Record<keyof AgentSafeguardConfig, string>> = {
  mode: 'agents.safeguards.mode',
  minOverallConformance: 'agents.safeguards.minConformance',
  correctiveAction: 'agents.safeguards.correctiveAction',
  requireAuditOnCriticalTasks: 'agents.safeguards.requireAuditOnCriticalTasks',
  alwaysProvideIntermediateFeedback: 'agents.safeguards.alwaysProvideIntermediateFeedback',
  preferSpecialistDelegation: 'agents.safeguards.preferSpecialistDelegation',
  blockOutOfRoleResponses: 'agents.safeguards.blockOutOfRoleResponses',
  runSelfReview: 'agents.safeguards.runSelfReview',
  prioritizeSkillFirst: 'agents.safeguards.prioritizeSkillFirst',
  alwaysSuggestNextSteps: 'agents.safeguards.alwaysSuggestNextSteps',
};

const markdownTooltipKeys: Record<MarkdownKey, string> = {
  identity: 'agents.identity.section.identity',
  soul: 'agents.identity.section.soul',
  rules: 'agents.identity.section.rules',
  playbook: 'agents.identity.section.playbook',
  context: 'agents.identity.section.context',
};

interface Props {
  agents: AgentSummary[];
  selectedAgentId: string;
  sessionId?: string;
  onSelectAgent: (agentId: string) => void;
  onUseInConsole: (agentId: string) => void;
  refreshAgents: () => Promise<void>;
}

interface AgentTemplate {
  id: string;
  name: string;
  summary: string;
  defaults: Omit<CreateAgentInput, 'name'>;
}

const agentTemplates: AgentTemplate[] = [
  {
    id: 'generalist',
    name: 'General Assistant',
    summary: 'Um agente equilibrado para atendimento geral, coordenacao e suporte do dia a dia.',
    defaults: {
      role: 'Operations Assistant',
      description: 'Ajuda a organizar tarefas, responder perguntas e orientar proximos passos com clareza.',
      teamId: 'ops-core',
      category: 'operations',
      type: 'generalist',
      defaultModel: 'gpt-4.1-mini',
      specializations: ['general', 'coordination', 'support'],
    },
  },
  {
    id: 'analyst',
    name: 'Analyst',
    summary: 'Focado em diagnostico, investigacao, comparacao de cenarios e explicacoes mais objetivas.',
    defaults: {
      role: 'Technical Analyst',
      description: 'Investiga problemas, compara opcoes e explica conclusoes com foco em evidencias.',
      teamId: 'analysis',
      category: 'analysis',
      type: 'specialist',
      defaultModel: 'gpt-4.1',
      specializations: ['analysis', 'troubleshooting', 'reporting'],
    },
  },
  {
    id: 'builder',
    name: 'Builder',
    summary: 'Pensado para implementacao, execucao orientada a passos e tarefas mais praticas.',
    defaults: {
      role: 'Implementation Specialist',
      description: 'Traduz objetivos em acoes praticas, com foco em execucao guiada e entrega incremental.',
      teamId: 'delivery',
      category: 'implementation',
      type: 'specialist',
      defaultModel: 'gpt-4.1',
      specializations: ['implementation', 'automation', 'delivery'],
    },
  },
];

const sandboxCardTooltipKeys: Record<string, string> = {
  General: 'agents.sandbox.card.general',
  Filesystem: 'agents.sandbox.card.filesystem',
  Network: 'agents.sandbox.card.network',
  Resources: 'agents.sandbox.card.resources',
  Execution: 'agents.sandbox.card.execution',
  Environment: 'agents.sandbox.card.environment',
  Security: 'agents.sandbox.card.security',
  'IO Policy': 'agents.sandbox.card.ioPolicy',
  Audit: 'agents.sandbox.card.audit',
  Approvals: 'agents.sandbox.card.approvals',
};

const sandboxFieldTooltipKeys: Record<string, string> = {
  'Effective mode': 'agents.sandbox.field.effectiveMode',
  'Persist artifacts': 'agents.sandbox.field.persistArtifacts',
  'Working directory': 'agents.sandbox.field.workingDirectory',
  'Read only root': 'agents.sandbox.field.readOnlyRoot',
  'Allowed read paths': 'agents.sandbox.field.allowedReadPaths',
  'Allowed write paths': 'agents.sandbox.field.allowedWritePaths',
  'Temp directory': 'agents.sandbox.field.tempDirectory',
  'Max artifact size (MB)': 'agents.sandbox.field.maxArtifactSize',
  'Max total artifacts (MB)': 'agents.sandbox.field.maxTotalArtifacts',
  'Network mode': 'agents.sandbox.field.networkMode',
  'Block private networks': 'agents.sandbox.field.blockPrivateNetworks',
  'Allow DNS': 'agents.sandbox.field.allowDns',
  'HTTP only': 'agents.sandbox.field.httpOnly',
  'Allowed domains': 'agents.sandbox.field.allowedDomains',
  'Allowed ports': 'agents.sandbox.field.allowedPorts',
  'Timeout (seconds)': 'agents.sandbox.field.timeoutSeconds',
  'CPU limit': 'agents.sandbox.field.cpuLimit',
  'Memory (MB)': 'agents.sandbox.field.memoryMb',
  'Disk (MB)': 'agents.sandbox.field.diskMb',
  'Max processes': 'agents.sandbox.field.maxProcesses',
  'Max threads': 'agents.sandbox.field.maxThreads',
  'Max stdout (KB)': 'agents.sandbox.field.maxStdoutKb',
  'Max stderr (KB)': 'agents.sandbox.field.maxStderrKb',
  'Allow shell': 'agents.sandbox.field.allowShell',
  'Allow subprocess': 'agents.sandbox.field.allowSubprocess',
  'Allow package install': 'agents.sandbox.field.allowPackageInstall',
  'Allowed interpreters': 'agents.sandbox.field.allowedInterpreters',
  'Allowed binaries': 'agents.sandbox.field.allowedBinaries',
  'Blocked binaries': 'agents.sandbox.field.blockedBinaries',
  Runtime: 'agents.sandbox.field.runtime',
  'Runtime version': 'agents.sandbox.field.runtimeVersion',
  Timezone: 'agents.sandbox.field.timezone',
  Locale: 'agents.sandbox.field.locale',
  'Max input (KB)': 'agents.sandbox.field.maxInputKb',
  'Max output (KB)': 'agents.sandbox.field.maxOutputKb',
  'Allowed output types': 'agents.sandbox.field.allowedOutputTypes',
  Retention: 'agents.sandbox.field.retention',
  'Inherit host env': 'agents.sandbox.field.inheritHostEnv',
  'Secret injection': 'agents.sandbox.field.secretInjection',
  'Run as non-root': 'agents.sandbox.field.runAsNonRoot',
  'No new privileges': 'agents.sandbox.field.noNewPrivileges',
  'Disable privileged mode': 'agents.sandbox.field.disablePrivilegedMode',
  'Disable host namespaces': 'agents.sandbox.field.disableHostNamespaces',
  'Disable device access': 'agents.sandbox.field.disableDeviceAccess',
  'Strip sensitive output': 'agents.sandbox.field.stripSensitiveOutput',
  'Content scan': 'agents.sandbox.field.contentScan',
  'Audit enabled': 'agents.sandbox.field.auditEnabled',
  'Capture artifacts': 'agents.sandbox.field.captureArtifacts',
  'Capture timing': 'agents.sandbox.field.captureTiming',
  'Capture network events': 'agents.sandbox.field.captureNetworkEvents',
  'Require approval for exec': 'agents.sandbox.field.requireApprovalForExec',
  'Require approval outside workspace': 'agents.sandbox.field.requireApprovalOutsideWorkspace',
  'Require approval for network': 'agents.sandbox.field.requireApprovalForNetwork',
  'Require approval for large artifacts': 'agents.sandbox.field.requireApprovalForLargeArtifacts',
  Capability: 'agents.sandbox.test.capability',
  Command: 'agents.sandbox.test.command',
  Preset: 'agents.sandbox.test.preset',
  Enabled: 'agents.sandbox.test.enabled',
  'Fallback behavior': 'agents.sandbox.test.fallback',
  'Mandatory capabilities': 'agents.sandbox.test.mandatoryCapabilities',
  'Overrides JSON': 'agents.sandbox.test.overridesJson',
};

export function AgentManagementView({ agents, selectedAgentId, sessionId, onSelectAgent, onUseInConsole, refreshAgents }: Props) {
  const tooltip = useTooltipText();
  const tooltipEntry = useTooltipEntry();
  const tooltipFor = (key: string) => tooltipEntry(key);
  const sandboxFieldTooltip = (label: string) => tooltip(sandboxFieldTooltipKeys[label] || 'agents.sandbox.field');
  const [activeTab, setActiveTab] = useState<AgentTab>('identity');
  const [activeMarkdown, setActiveMarkdown] = useState<MarkdownKey>('identity');
  const [profile, setProfile] = useState<AgentProfileDocument | null>(null);
  const [behavior, setBehavior] = useState<AgentBehaviorConfig | null>(null);
  const [safeguards, setSafeguards] = useState<AgentSafeguardConfig | null>(null);
  const [profileHistory, setProfileHistory] = useState<AgentProfileHistoryEntry[]>([]);
  const [storedVersions, setStoredVersions] = useState<AgentStoredVersionEntry[]>([]);
  const [performance, setPerformance] = useState<AgentPerformanceView | null>(null);
  const [performanceTrend, setPerformanceTrend] = useState<AgentPerformanceTrendView | null>(null);
  const [suggestions, setSuggestions] = useState<PlaybookSuggestionItem[]>([]);
  const [history, setHistory] = useState<AgentHistoryItem[]>([]);
  const [conformance, setConformance] = useState<AgentConformanceView | null>(null);
  const [sandboxProfiles, setSandboxProfiles] = useState<SandboxProfile[]>([]);
  const [sandboxConfig, setSandboxConfig] = useState<AgentSandboxConfig | null>(null);
  const [sandboxValidation, setSandboxValidation] = useState<SandboxValidationResult | null>(null);
  const [sandboxDryRun, setSandboxDryRun] = useState<SandboxDryRunResult | null>(null);
  const [sandboxExecutions, setSandboxExecutions] = useState<SandboxExecutionItem[]>([]);
  const [sandboxCapability, setSandboxCapability] = useState('exec');
  const [sandboxCommand, setSandboxCommand] = useState('node -v');
  const [sandboxOverridesText, setSandboxOverridesText] = useState('{}');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; meta?: string }>>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(agentTemplates[0].id);
  const [createForm, setCreateForm] = useState<CreateAgentInput>(() => buildCreateForm(agentTemplates[0]));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const selectedAgent = useMemo(() => agents.find((agent) => agent.id === selectedAgentId) || null, [agents, selectedAgentId]);
  const selectedSandboxProfile = useMemo(
    () => sandboxProfiles.find((profile) => profile.id === sandboxConfig?.profileId) || null,
    [sandboxProfiles, sandboxConfig?.profileId],
  );
  const sandboxPolicyPreview = useMemo(
    () => sandboxDryRun?.effectivePolicy
      || (sandboxConfig
        ? buildSandboxPreviewConfig(
          sandboxConfig,
          selectedSandboxProfile?.config || null,
          parseSandboxOverrides(sandboxOverridesText),
        )
        : null),
    [sandboxDryRun?.effectivePolicy, sandboxConfig, selectedSandboxProfile, sandboxOverridesText],
  );

  function updateSandboxOverride(path: string[], value: unknown) {
    setSandboxOverridesText((current) => {
      const next = setNestedValue(parseSandboxOverrides(current), path, value);
      return JSON.stringify(next, null, 2);
    });
  }

  useEffect(() => {
    if (!selectedAgentId) return;
    setBehavior(null);
    setSafeguards(null);
    setProfileHistory([]);
    setStoredVersions([]);
    setPerformance(null);
    setPerformanceTrend(null);
    setSuggestions([]);
    setHistory([]);
    setSandboxConfig(null);
    setSandboxProfiles([]);
    setSandboxExecutions([]);
    setSandboxValidation(null);
    setSandboxDryRun(null);
    setSandboxOverridesText('{}');
    setChatMessages([]);
    void loadAgentShell(selectedAgentId);
  }, [selectedAgentId]);

  useEffect(() => {
    if (!selectedAgentId) return;
    void loadAgentTab(selectedAgentId, activeTab);
  }, [activeTab, selectedAgentId]);

  async function safeLoad<T>(label: string, loader: Promise<T>, loadErrors: string[] = []): Promise<T | null> {
    try {
      return await loader;
    } catch (nextError) {
      console.error(`Erro ao carregar ${label} do agente:`, nextError);
      loadErrors.push(label);
      return null;
    }
  }

  async function loadAgentShell(agentId: string) {
    setLoading(true);
    setError('');
    try {
      const loadErrors: string[] = [];
      const [nextProfile, nextConformance] = await Promise.all([
        safeLoad('perfil', getAgentProfile(agentId), loadErrors),
        safeLoad('conformance', getAgentConformance(agentId), loadErrors),
      ]);

      setProfile(nextProfile);
      setConformance(nextConformance);
      if (loadErrors.length > 0) {
        setError(`Algumas seções do agente nao puderam ser carregadas: ${loadErrors.join(', ')}.`);
      }
    } catch (nextError) {
      console.error('Erro ao carregar agente:', nextError);
      setError('Nao foi possivel carregar o agente.');
    } finally {
      setLoading(false);
    }
  }

  async function loadAgentTab(agentId: string, tab: AgentTab) {
    const loadErrors: string[] = [];

    try {
      if (tab === 'identity') {
        const nextProfileHistory = await safeLoad('historico do perfil', getAgentProfileHistory(agentId), loadErrors);
        if (nextProfileHistory) {
          setProfileHistory(nextProfileHistory);
        }
      }

      if (tab === 'history') {
        const [nextStoredVersions, nextProfileHistory] = await Promise.all([
          safeLoad('versoes persistidas', getAgentVersions(agentId), loadErrors),
          safeLoad('historico do perfil', getAgentProfileHistory(agentId), loadErrors),
        ]);
        if (nextStoredVersions) {
          setStoredVersions(nextStoredVersions);
        }
        if (nextProfileHistory) {
          setProfileHistory(nextProfileHistory);
        }
      }

      if (tab === 'performance') {
        const [nextPerformance, nextTrend] = await Promise.all([
          safeLoad('performance', getAgentPerformance(agentId), loadErrors),
          safeLoad('tendencia de performance', getAgentPerformanceTrend(agentId), loadErrors),
        ]);
        setPerformance(nextPerformance);
        setPerformanceTrend(nextTrend);
      }

      if (tab === 'suggestions') {
        const nextSuggestions = await safeLoad('sugestoes de playbook', listPlaybookSuggestions(agentId), loadErrors);
        setSuggestions(nextSuggestions || []);
      }

      if (tab === 'behavior') {
        const nextBehavior = await safeLoad('behavior', getAgentBehavior(agentId), loadErrors);
        if (nextBehavior) {
          setBehavior(nextBehavior);
        }
      }

      if (tab === 'safeguards') {
        const nextSafeguards = await safeLoad('safeguards', getAgentSafeguards(agentId), loadErrors);
        if (nextSafeguards) {
          setSafeguards(nextSafeguards);
        }
      }

      if (tab === 'sandbox') {
        const [nextSandboxConfig, nextSandboxProfiles, nextSandboxExecutions] = await Promise.all([
          safeLoad('sandbox', getAgentSandbox(agentId), loadErrors),
          safeLoad('sandbox profiles', listSandboxProfiles(), loadErrors),
          safeLoad('sandbox executions', listSandboxExecutions(), loadErrors),
        ]);

        setSandboxConfig(nextSandboxConfig);
        setSandboxProfiles(nextSandboxProfiles || []);
        setSandboxExecutions((nextSandboxExecutions || []).filter((execution) => execution.agentId === agentId));
        setSandboxOverridesText(JSON.stringify(nextSandboxConfig?.overrides || {}, null, 2));
      }

      if (tab === 'chat') {
        const nextHistory = await safeLoad('historico', getAgentHistory(agentId), loadErrors);
        setHistory(nextHistory || []);
      }

      if (loadErrors.length > 0) {
        setError(`Algumas seções do agente nao puderam ser carregadas: ${loadErrors.join(', ')}.`);
      }
    } catch (nextError) {
      console.error('Erro ao carregar detalhes do agente:', nextError);
      setError('Nao foi possivel carregar os detalhes do agente.');
    }
  }

  async function saveIdentity() {
    if (!profile) return;
    setSaving(true);
    try {
      await updateAgentProfile(profile.id, { markdown: profile.markdown });
      await refreshAgents();
      await loadAgentShell(profile.id);
      await loadAgentTab(profile.id, 'identity');
    } catch (nextError) {
      console.error(nextError);
      setError('Falha ao salvar o texto do perfil.');
    } finally {
      setSaving(false);
    }
  }

  async function saveBehavior() {
    if (!behavior || !selectedAgentId) return;
    setSaving(true);
    try {
      await updateAgentBehavior(selectedAgentId, behavior);
      await refreshAgents();
      await loadAgentShell(selectedAgentId);
      await loadAgentTab(selectedAgentId, 'behavior');
    } catch (nextError) {
      console.error(nextError);
      setError('Falha ao salvar o comportamento.');
    } finally {
      setSaving(false);
    }
  }

  async function saveSafeguards() {
    if (!safeguards || !selectedAgentId) return;
    setSaving(true);
    try {
      await updateAgentSafeguards(selectedAgentId, safeguards);
      await refreshAgents();
      await loadAgentShell(selectedAgentId);
      await loadAgentTab(selectedAgentId, 'safeguards');
    } catch (nextError) {
      console.error(nextError);
      setError('Falha ao salvar as safeguards.');
    } finally {
      setSaving(false);
    }
  }

  async function saveSandboxConfig() {
    if (!sandboxConfig || !selectedAgentId) return;
    setSaving(true);
    setError('');
    try {
      const overrides = parseSandboxOverrides(sandboxOverridesText);
      const updated = await updateAgentSandbox(selectedAgentId, {
        ...sandboxConfig,
        overrides,
      });
      setSandboxConfig(updated);
      await refreshAgents();
      await loadAgentShell(selectedAgentId);
      await loadAgentTab(selectedAgentId, 'sandbox');
    } catch (nextError) {
      console.error(nextError);
      setError('Falha ao salvar a sandbox.');
    } finally {
      setSaving(false);
    }
  }

  async function validateSandboxConfigNow() {
    if (!sandboxConfig) return;
    try {
      const validation = await validateSandboxConfig(
        buildSandboxPreviewConfig(
          sandboxConfig,
          selectedSandboxProfile?.config || null,
          parseSandboxOverrides(sandboxOverridesText),
        ),
      );
      setSandboxValidation(validation);
    } catch (nextError) {
      console.error(nextError);
      setError('Falha ao validar a sandbox.');
    }
  }

  async function runSandboxDryRun() {
    if (!selectedAgentId) return;
    try {
      const payload = buildSandboxExecutionPayload(
        selectedAgentId,
        sandboxCapability,
        sandboxCommand,
        sandboxConfig,
        sandboxProfiles,
        parseSandboxOverrides(sandboxOverridesText),
      );
      const result = await dryRunSandbox(payload);
      setSandboxDryRun(result);
      setSandboxValidation(result.validation);
    } catch (nextError) {
      console.error(nextError);
      setError('Falha ao executar o dry-run da sandbox.');
    }
  }

  async function runSandboxExecution() {
    if (!selectedAgentId) return;
    setSaving(true);
    try {
      const payload = buildSandboxExecutionPayload(
        selectedAgentId,
        sandboxCapability,
        sandboxCommand,
        sandboxConfig,
        sandboxProfiles,
        parseSandboxOverrides(sandboxOverridesText),
      );
      await startSandboxExecution(payload);
      await loadAgentShell(selectedAgentId);
      await loadAgentTab(selectedAgentId, 'sandbox');
    } catch (nextError) {
      console.error(nextError);
      setError('Falha ao iniciar a execucao de sandbox.');
    } finally {
      setSaving(false);
    }
  }

  async function restoreVersion(version: string) {
    if (!selectedAgentId) return;
    setSaving(true);
    try {
      await restoreAgentProfileVersion(selectedAgentId, version);
      await refreshAgents();
      await loadAgentShell(selectedAgentId);
      await loadAgentTab(selectedAgentId, 'identity');
    } catch (nextError) {
      console.error(nextError);
      setError('Falha ao restaurar a versao.');
    } finally {
      setSaving(false);
    }
  }

  async function restoreStoredVersion(versionNumber: number) {
    if (!selectedAgentId) return;
    setSaving(true);
    try {
      await restoreAgentStoredVersion(selectedAgentId, versionNumber);
      await refreshAgents();
      await loadAgentShell(selectedAgentId);
      await loadAgentTab(selectedAgentId, 'history');
      await loadAgentTab(selectedAgentId, 'identity');
    } catch (nextError) {
      console.error(nextError);
      setError('Falha ao restaurar a versao persistida.');
    } finally {
      setSaving(false);
    }
  }

  async function approveSuggestion(suggestionId: string) {
    if (!selectedAgentId) return;
    setSaving(true);
    try {
      await approvePlaybookSuggestion(selectedAgentId, suggestionId);
      await refreshAgents();
      await loadAgentShell(selectedAgentId);
      await loadAgentTab(selectedAgentId, 'suggestions');
      await loadAgentTab(selectedAgentId, 'history');
    } catch (nextError) {
      console.error(nextError);
      setError('Falha ao aprovar a sugestao.');
    } finally {
      setSaving(false);
    }
  }

  async function rejectSuggestion(suggestionId: string) {
    if (!selectedAgentId) return;
    setSaving(true);
    try {
      await rejectPlaybookSuggestion(selectedAgentId, suggestionId);
      await loadAgentTab(selectedAgentId, 'suggestions');
    } catch (nextError) {
      console.error(nextError);
      setError('Falha ao rejeitar a sugestao.');
    } finally {
      setSaving(false);
    }
  }

  async function sendChat(event: React.FormEvent) {
    event.preventDefault();
    const prompt = chatInput.trim();
    if (!prompt || !selectedAgentId) return;

    setChatMessages((previous) => [...previous, { role: 'user', content: prompt }]);
    setChatInput('');

    try {
      const response = await chatWithAgent(selectedAgentId, { prompt, sessionId, interactionMode: 'chat' });
      const score = response.audit?.overallConformanceScore ?? response.result?.audit?.overallConformanceScore;
      setChatMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: response.result?.content || 'Sem resposta do agente.',
          meta: score !== undefined ? `Conformance ${score}` : response.result?.model,
        },
      ]);
      await refreshAgents();
      await loadAgentShell(selectedAgentId);
      await loadAgentTab(selectedAgentId, 'chat');
    } catch (nextError) {
      console.error(nextError);
      setError('Falha ao conversar com o agente.');
    }
  }

  function applyTemplate(templateId: string) {
    const template = agentTemplates.find((item) => item.id === templateId) || agentTemplates[0];
    setSelectedTemplateId(template.id);
    setCreateForm((current) => ({
      ...buildCreateForm(template),
      name: current.name,
    }));
  }

  async function handleCreateAgent(event: React.FormEvent) {
    event.preventDefault();
    if (!createForm.name.trim()) {
      setError('Defina um nome para o novo agente.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const created = await createAgent({
        ...createForm,
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        role: createForm.role.trim(),
        specializations: createForm.specializations || [],
      });
      await refreshAgents();
      onSelectAgent(created.id);
      setSelectedTemplateId(agentTemplates[0].id);
      setCreateForm(buildCreateForm(agentTemplates[0]));
      setIsCreateOpen(false);
    } catch (nextError) {
      console.error(nextError);
      setError(nextError instanceof Error ? nextError.message : 'Falha ao criar o agente.');
    } finally {
      setSaving(false);
    }
  }

  if (agents.length === 0) {
    return <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">Nenhum agente disponivel.</div>;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Agents</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700/50"
            >
              <Upload className="h-4 w-4" />
              Import
            </button>
            <button
              type="button"
              onClick={() => setIsCreateOpen((current) => !current)}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-400/50 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-100 transition hover:bg-indigo-500/20"
            >
              <Plus className="h-4 w-4" />
              New Agent
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {agents.map((agent) => (
            <RichTooltip key={agent.id} entry={tooltipFor('agents.card.select')}>
              <button
                type="button"
                onClick={() => onSelectAgent(agent.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${agent.id === selectedAgentId ? 'border-indigo-400 bg-indigo-500/10' : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                  }`}
              >
                <div className="text-sm font-semibold text-white">{agent.name}</div>
                <div className="mt-1 text-xs text-slate-400">{agent.role}</div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{agent.teamId}</span>
                  <span>{agent.profileVersion}</span>
                </div>
              </button>
            </RichTooltip>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        {isCreateOpen ? (
          <div className="mb-6 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-indigo-500/10 p-2 text-indigo-200">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Criar novo agente</h3>
                <p className="mt-1 text-sm text-slate-300">Escolha um layout inicial e preencha as informacoes basicas para gerar um novo agente pronto para edicao.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {agentTemplates.map((template) => {
                const active = template.id === selectedTemplateId;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template.id)}
                    className={`rounded-2xl border p-4 text-left transition ${active ? 'border-indigo-400 bg-indigo-500/10' : 'border-slate-800 bg-slate-950/50 hover:border-slate-600'}`}
                  >
                    <div className="text-sm font-semibold text-white">{template.name}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-400">{template.summary}</div>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleCreateAgent} className="mt-5 grid gap-4 lg:grid-cols-2">
              <label className="block text-sm text-slate-200">
                <div className="mb-2">Nome do agente</div>
                <input value={createForm.name} onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none" placeholder="Ex.: Analista de Incidentes" />
              </label>
              <label className="block text-sm text-slate-200">
                <div className="mb-2">Papel principal</div>
                <input value={createForm.role} onChange={(event) => setCreateForm((current) => ({ ...current, role: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none" placeholder="Ex.: Incident Analyst" />
              </label>
              <label className="block text-sm text-slate-200 lg:col-span-2">
                <div className="mb-2">Descricao inicial</div>
                <textarea value={createForm.description} onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))} className="min-h-[110px] w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none" placeholder="Explique para que este agente existe e como ele deve ajudar." />
              </label>
              <label className="block text-sm text-slate-200">
                <div className="mb-2">Time</div>
                <input value={createForm.teamId || ''} onChange={(event) => setCreateForm((current) => ({ ...current, teamId: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none" placeholder="Ex.: ops-core" />
              </label>
              <label className="block text-sm text-slate-200">
                <div className="mb-2">Categoria</div>
                <input value={createForm.category || ''} onChange={(event) => setCreateForm((current) => ({ ...current, category: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none" placeholder="Ex.: operations" />
              </label>
              <label className="block text-sm text-slate-200">
                <div className="mb-2">Tipo</div>
                <select value={createForm.type || 'specialist'} onChange={(event) => setCreateForm((current) => ({ ...current, type: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none">
                  <option value="generalist">Generalist</option>
                  <option value="specialist">Specialist</option>
                  <option value="orchestrator">Orchestrator</option>
                </select>
              </label>
              <label className="block text-sm text-slate-200">
                <div className="mb-2">Modelo padrao</div>
                <input value={createForm.defaultModel || ''} onChange={(event) => setCreateForm((current) => ({ ...current, defaultModel: event.target.value }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none" placeholder="Ex.: gpt-4.1-mini" />
              </label>
              <label className="block text-sm text-slate-200 lg:col-span-2">
                <div className="mb-2">Especializacoes</div>
                <input value={(createForm.specializations || []).join(', ')} onChange={(event) => setCreateForm((current) => ({ ...current, specializations: splitCommaList(event.target.value) }))} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none" placeholder="Ex.: support, diagnostics, automation" />
              </label>
              <div className="lg:col-span-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancelar</button>
                <button type="submit" disabled={saving} className="rounded-full border border-indigo-400/50 bg-indigo-500/10 px-5 py-2 text-sm font-semibold text-indigo-100 disabled:opacity-50">{saving ? 'Criando...' : 'Criar agente'}</button>
              </div>
            </form>
          </div>
        ) : null}
        {selectedAgent ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-indigo-300">{selectedAgent.teamId}</div>
                <h2 className="mt-2 text-3xl font-semibold text-white">{selectedAgent.name}</h2>
                <p className="mt-2 text-sm text-slate-400">{profile?.description || 'Carregando configuracoes do agente...'}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                  {(profile?.identity.specializations || []).map((tag) => (
                    <span key={tag} className="rounded-full border border-slate-700 px-3 py-1">{tag}</span>
                  ))}
                </div>
              </div>
              <RichTooltip entry={tooltipFor('agents.useInConsole')}>
                <button
                  type="button"
                  onClick={() => onUseInConsole(selectedAgent.id)}
                  disabled={!profile}
                  className="rounded-full border border-indigo-400/60 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-100 transition hover:bg-indigo-500/20"
                >
                  Use in Console
                </button>
              </RichTooltip>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <MiniStat icon={<Shield className="h-4 w-4" />} label="Conformance" value={conformance?.averageOverallConformanceScore?.toString() || 'n/a'} />
              <MiniStat icon={<History className="h-4 w-4" />} label="Version" value={profile?.version || 'n/a'} />
              <MiniStat icon={<Bot className="h-4 w-4" />} label="Model" value={profile?.defaultModel || 'n/a'} />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <TabButton active={activeTab === 'identity'} onClick={() => setActiveTab('identity')} icon={<MessageSquare className="h-4 w-4" />} label="Identity" tooltipEntry={tooltipFor('agents.tab.identity')} />
              <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History className="h-4 w-4" />} label="History" tooltipEntry={tooltipFor('agents.tab.history')} />
              <TabButton active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} icon={<LineChart className="h-4 w-4" />} label="Performance" tooltipEntry={tooltipFor('agents.tab.performance')} />
              <TabButton active={activeTab === 'suggestions'} onClick={() => setActiveTab('suggestions')} icon={<Lightbulb className="h-4 w-4" />} label="Suggestions" tooltipEntry={tooltipFor('agents.tab.suggestions')} />
              <TabButton active={activeTab === 'behavior'} onClick={() => setActiveTab('behavior')} icon={<SlidersHorizontal className="h-4 w-4" />} label="Behavior" tooltipEntry={tooltipFor('agents.tab.behavior')} />
              <TabButton active={activeTab === 'safeguards'} onClick={() => setActiveTab('safeguards')} icon={<Shield className="h-4 w-4" />} label="Safeguards" tooltipEntry={tooltipFor('agents.tab.safeguards')} />
              <TabButton active={activeTab === 'sandbox'} onClick={() => setActiveTab('sandbox')} icon={<Shield className="h-4 w-4" />} label="Sandbox" tooltipEntry={tooltipFor('agents.tab.sandbox')} />
              <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<Bot className="h-4 w-4" />} label="Chat" tooltipEntry={tooltipFor('agents.tab.chat')} />
            </div>

            {error && <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
            {loading ? <div className="mt-6 text-sm text-slate-400">Carregando...</div> : null}

            {!loading && activeTab === 'identity' && profile && (
              <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {markdownTabs.map((tab) => (
                      <RichTooltip key={tab} entry={tooltipFor(markdownTooltipKeys[tab])}>
                        <button
                          type="button"
                          onClick={() => setActiveMarkdown(tab)}
                          className={`rounded-full px-3 py-1 text-xs transition ${activeMarkdown === tab ? 'bg-white text-slate-950' : 'border border-slate-700 text-slate-300'}`}
                        >
                          {tab}
                        </button>
                      </RichTooltip>
                    ))}
                    <RichTooltip entry={tooltipFor('agents.identity.saveText')}>
                      <button
                        type="button"
                        onClick={() => void saveIdentity()}
                        disabled={saving}
                        className="ml-auto inline-flex items-center gap-2 rounded-full border border-indigo-400/60 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-100 disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        Save Text
                      </button>
                    </RichTooltip>
                  </div>
                  <FieldIntro tooltipKey={markdownTooltipKeys[activeMarkdown]} />
                  <textarea
                    value={profile.markdown[activeMarkdown]}
                    onChange={(event) =>
                      setProfile((current) =>
                        current
                          ? {
                            ...current,
                            markdown: {
                              ...current.markdown,
                              [activeMarkdown]: event.target.value,
                            },
                          }
                          : current,
                      )
                    }
                    className="min-h-[420px] w-full rounded-3xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-100 outline-none"
                  />
                </div>

                <div className="space-y-4">
                  <pre className="min-h-[220px] whitespace-pre-wrap rounded-3xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-300">
                    {profile.markdown[activeMarkdown]}
                  </pre>
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400">
                    Use a aba History para navegar e restaurar versoes persistidas do agente.
                  </div>
                </div>
              </div>
            )}
            {!loading && activeTab === 'identity' && !profile && (
              <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-400">
                O perfil ainda nao foi carregado.
              </div>
            )}

            {!loading && activeTab === 'history' && (
              <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="mb-3 text-sm font-semibold text-slate-200">Stored Versions</div>
                  <div className="space-y-2">
                    {storedVersions.map((entry) => (
                      <div key={entry.versionNumber} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm text-white">Version #{entry.versionNumber}</div>
                            <div className="text-xs text-slate-400">{entry.sourceVersionLabel || 'sem label'}</div>
                            <div className="mt-1 text-xs text-slate-500">{entry.changeSummary}</div>
                            {entry.restoredFromVersionNumber !== undefined && (
                              <div className="mt-1 text-[11px] text-indigo-300">Restored from #{entry.restoredFromVersionNumber}</div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => void restoreStoredVersion(entry.versionNumber)}
                            disabled={saving}
                            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 disabled:opacity-40"
                          >
                            Restore
                          </button>
                        </div>
                      </div>
                    ))}
                    {storedVersions.length === 0 && (
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-500">
                        Nenhuma versao persistida encontrada.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="mb-3 text-sm font-semibold text-slate-200">Legacy File History</div>
                  <div className="space-y-2">
                    {profileHistory.map((entry) => (
                      <div key={`${entry.version}-${entry.updatedAt}`} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm text-white">{entry.version}</div>
                            <div className="text-xs text-slate-500">{entry.summary}</div>
                          </div>
                          <RichTooltip entry={tooltipFor('agents.identity.restore')}>
                            <button
                              type="button"
                              onClick={() => void restoreVersion(entry.version)}
                              disabled={saving || entry.version === profile?.version}
                              className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 disabled:opacity-40"
                            >
                              Restore
                            </button>
                          </RichTooltip>
                        </div>
                      </div>
                    ))}
                    {profileHistory.length === 0 && (
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-500">
                        Nenhum snapshot legado encontrado.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!loading && activeTab === 'performance' && (
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <MiniStat icon={<LineChart className="h-4 w-4" />} label="Success Rate" value={formatPct(performance?.items[0]?.successRate)} />
                  <MiniStat icon={<Shield className="h-4 w-4" />} label="Feedback" value={formatPct(performance?.items[0]?.feedbackScore)} />
                  <MiniStat icon={<Bot className="h-4 w-4" />} label="Cost" value={formatCurrency(performance?.items[0]?.totalCostUsd)} />
                  <MiniStat icon={<History className="h-4 w-4" />} label="Updated" value={performance?.items[0]?.reputationUpdatedAt ? new Date(performance.items[0].reputationUpdatedAt).toLocaleDateString() : 'n/a'} />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="mb-3 text-sm font-semibold text-slate-200">Reputacao por Capability</div>
                    <div className="space-y-3">
                      {Object.entries(performance?.items[0]?.reputationScores || {}).map(([capability, score]) => (
                        <div key={capability}>
                          <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                            <span className="uppercase tracking-[0.2em]">{capability}</span>
                            <span>{score.toFixed(3)}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-800">
                            <div className="h-2 rounded-full bg-indigo-400" style={{ width: `${Math.max(6, Math.min(100, score * 100))}%` }} />
                          </div>
                        </div>
                      ))}
                      {Object.keys(performance?.items[0]?.reputationScores || {}).length === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-500">
                          Nenhum score de reputacao disponivel ainda.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="mb-3 text-sm font-semibold text-slate-200">Trend (90 dias)</div>
                    <div className="space-y-2">
                      {(performanceTrend?.items || []).slice(0, 8).map((item) => (
                        <div key={item.weekStart} className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
                          <div className="flex items-center justify-between gap-3">
                            <span>{new Date(item.weekStart).toLocaleDateString()}</span>
                            <span className="text-xs text-slate-500">Cost {formatCurrency(item.totalCostUsd)}</span>
                          </div>
                          <div className="mt-2 flex gap-4 text-xs text-slate-400">
                            <span>Success {formatPct(item.avgSuccessRate)}</span>
                            <span>Conformance {formatPct(item.avgConformanceScore)}</span>
                          </div>
                        </div>
                      ))}
                      {(performanceTrend?.items || []).length === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-500">
                          Nenhuma tendencia agregada encontrada.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="mb-3 text-sm font-semibold text-slate-200">Daily Performance</div>
                  <div className="space-y-2">
                    {(performance?.items || []).map((item) => (
                      <div key={item.periodStart} className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-white">{new Date(item.periodStart).toLocaleDateString()}</div>
                            <div className="text-xs text-slate-500">{item.tasksSucceeded}/{item.tasksTotal} successful tasks</div>
                          </div>
                          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                            <span>Success {formatPct(item.successRate)}</span>
                            <span>Conformance {formatPct(item.avgConformance)}</span>
                            <span>Feedback {formatPct(item.feedbackScore)}</span>
                            <span>Cost {formatCurrency(item.totalCostUsd)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(performance?.items || []).length === 0 && (
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-500">
                        Nenhum registro de performance consolidado ainda.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!loading && activeTab === 'suggestions' && (
              <div className="mt-6 grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="mb-3 text-sm font-semibold text-slate-200">Pending Suggestions</div>
                  <div className="space-y-3">
                    {suggestions.filter((item) => item.status === 'pending').map((item) => (
                      <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm text-white">{item.title}</div>
                            <div className="mt-1 text-xs text-slate-400">Confidence {item.confidence.toFixed(2)}</div>
                            <div className="mt-2 text-sm text-slate-300">{item.summary}</div>
                            <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">{item.suggestion}</div>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => void approveSuggestion(item.id)} disabled={saving} className="rounded-full border border-emerald-500/50 px-3 py-1 text-xs text-emerald-200 disabled:opacity-40">Approve</button>
                            <button type="button" onClick={() => void rejectSuggestion(item.id)} disabled={saving} className="rounded-full border border-rose-500/50 px-3 py-1 text-xs text-rose-200 disabled:opacity-40">Reject</button>
                          </div>
                        </div>
                        <div className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">Source Episodes</div>
                        <div className="mt-2 space-y-2">
                          {item.sourceEpisodes.map((episode) => (
                            <div key={episode.id} className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                              <div className="flex items-center justify-between gap-2">
                                <span>{episode.summary}</span>
                                <span className="text-slate-500">{new Date(episode.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="mt-1 text-[11px] text-slate-500">Importance {episode.importanceScore}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {suggestions.filter((item) => item.status === 'pending').length === 0 && (
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-500">Nenhuma sugestao pendente encontrada.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="mb-3 text-sm font-semibold text-slate-200">Suggestion History</div>
                  <div className="space-y-3">
                    {suggestions.filter((item) => item.status !== 'pending').map((item) => (
                      <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm text-white">{item.title}</div>
                            <div className="text-xs text-slate-400">{item.summary}</div>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs ${item.status === 'approved' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'}`}>{item.status}</span>
                        </div>
                        {item.rejectionReason && <div className="mt-2 text-xs text-rose-300">{item.rejectionReason}</div>}
                        {item.reviewedAt && <div className="mt-2 text-[11px] text-slate-500">Reviewed {new Date(item.reviewedAt).toLocaleString()}</div>}
                      </div>
                    ))}
                    {suggestions.filter((item) => item.status !== 'pending').length === 0 && (
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-500">Nenhuma sugestao revisada ainda.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!loading && activeTab === 'behavior' && behavior && (
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {behaviorKeys.map((item) => (
                    <label key={item.key} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
                      <div className="mb-2 flex items-center justify-between">
                        <FieldTitle label={item.label} tooltipKey={behaviorTooltipKeys[item.key]} />
                        <span className="font-mono text-indigo-300">{behavior[item.key]}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={behavior[item.key]}
                        onChange={(event) =>
                          setBehavior((current) =>
                            current
                              ? {
                                ...current,
                                [item.key]: Number(event.target.value),
                              }
                              : current,
                          )
                        }
                        className="w-full accent-indigo-400"
                      />
                    </label>
                  ))}
                </div>
                <div className="flex justify-end">
                  <RichTooltip entry={tooltipFor('agents.behavior.save')}>
                    <button
                      type="button"
                      onClick={() => void saveBehavior()}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-full border border-indigo-400/60 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-100 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      Save Behavior
                    </button>
                  </RichTooltip>
                </div>
              </div>
            )}
            {!loading && activeTab === 'behavior' && !behavior && (
              <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-400">
                Os parametros de comportamento ainda nao foram carregados.
              </div>
            )}

            {!loading && activeTab === 'safeguards' && safeguards && (
              <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
                <div className="space-y-4">
                  <label className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
                    <FieldTitle label="Mode" tooltipKey="agents.safeguards.mode" className="mb-2" />
                    <select
                      value={safeguards.mode}
                      onChange={(event) =>
                        setSafeguards((current) =>
                          current
                            ? { ...current, mode: event.target.value as AgentSafeguardConfig['mode'] }
                            : current,
                        )
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                    >
                      <option value="strict">Strict</option>
                      <option value="balanced">Balanced</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </label>
                  <label className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
                    <div className="mb-2 flex items-center justify-between">
                      <FieldTitle label="Minimum Conformance" tooltipKey="agents.safeguards.minConformance" />
                      <span className="font-mono text-indigo-300">{safeguards.minOverallConformance}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={safeguards.minOverallConformance}
                      onChange={(event) =>
                        setSafeguards((current) =>
                          current
                            ? { ...current, minOverallConformance: Number(event.target.value) }
                            : current,
                        )
                      }
                      className="w-full accent-indigo-400"
                    />
                  </label>
                  <label className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
                    <FieldTitle label="Corrective Action" tooltipKey="agents.safeguards.correctiveAction" className="mb-2" />
                    <select
                      value={safeguards.correctiveAction}
                      onChange={(event) =>
                        setSafeguards((current) =>
                          current
                            ? { ...current, correctiveAction: event.target.value as AgentSafeguardConfig['correctiveAction'] }
                            : current,
                        )
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                    >
                      <option value="allow_with_notice">Allow With Notice</option>
                      <option value="rewrite">Rewrite</option>
                      <option value="fallback">Fallback</option>
                      <option value="block">Block</option>
                    </select>
                  </label>
                  {safeguardToggles.map((toggle) => (
                    <label key={toggle.key} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
                      <FieldTitle label={toggle.label} tooltipKey={safeguardTooltipKeys[toggle.key] || 'agents.safeguards.mode'} />
                      <input
                        type="checkbox"
                        checked={Boolean(safeguards[toggle.key])}
                        onChange={(event) =>
                          setSafeguards((current) =>
                            current
                              ? { ...current, [toggle.key]: event.target.checked }
                              : current,
                          )
                        }
                        className="h-4 w-4 accent-indigo-400"
                      />
                    </label>
                  ))}
                  <div className="flex justify-end">
                    <RichTooltip entry={tooltipFor('agents.safeguards.save')}>
                      <button
                        type="button"
                        onClick={() => void saveSafeguards()}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-full border border-indigo-400/60 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-100 disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        Save Safeguards
                      </button>
                    </RichTooltip>
                  </div>
                </div>

                <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="text-sm font-semibold text-slate-200">Recent Violations</div>
                  {(conformance?.recentViolations || []).slice(0, 6).map((violation) => (
                    <div key={violation} className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
                      {violation}
                    </div>
                  ))}
                  {(!conformance?.recentViolations || conformance.recentViolations.length === 0) && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-500">
                      No recent violations recorded.
                    </div>
                  )}
                </div>
              </div>
            )}
            {!loading && activeTab === 'safeguards' && !safeguards && (
              <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-400">
                As safeguards ainda nao foram carregadas.
              </div>
            )}

            {!loading && activeTab === 'sandbox' && sandboxConfig && (
              <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
                <div className="space-y-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <SandboxEditorCard title="General">
                      <label title={sandboxFieldTooltip('Effective mode')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Effective mode" />
                        <select
                          value={sandboxPolicyPreview?.mode || 'process'}
                          onChange={(event) => updateSandboxOverride(['mode'], event.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        >
                          <option value="none">None</option>
                          <option value="process">Process</option>
                          <option value="container">Container</option>
                          <option value="remote">Remote</option>
                        </select>
                      </label>
                      <label title={sandboxFieldTooltip('Persist artifacts')} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                        <FieldTitle label="Persist artifacts" tooltipKey={sandboxFieldTooltipKeys['Persist artifacts']} />
                        <input
                          type="checkbox"
                          checked={Boolean(sandboxPolicyPreview?.filesystem?.persistArtifacts)}
                          onChange={(event) => updateSandboxOverride(['filesystem', 'persistArtifacts'], event.target.checked)}
                          className="h-4 w-4 accent-indigo-400"
                        />
                      </label>
                    </SandboxEditorCard>

                    <SandboxEditorCard title="Filesystem">
                      <label title={sandboxFieldTooltip('Working directory')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Working directory" />
                        <input
                          type="text"
                          value={sandboxPolicyPreview?.filesystem?.workingDirectory || ''}
                          onChange={(event) => updateSandboxOverride(['filesystem', 'workingDirectory'], event.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Read only root')} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                        <FieldTitle label="Read only root" tooltipKey={sandboxFieldTooltipKeys['Read only root']} />
                        <input
                          type="checkbox"
                          checked={Boolean(sandboxPolicyPreview?.filesystem?.readOnlyRoot)}
                          onChange={(event) => updateSandboxOverride(['filesystem', 'readOnlyRoot'], event.target.checked)}
                          className="h-4 w-4 accent-indigo-400"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Allowed read paths')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Allowed read paths" />
                        <input
                          type="text"
                          value={(sandboxPolicyPreview?.filesystem?.allowedReadPaths || []).join(', ')}
                          onChange={(event) => updateSandboxOverride(['filesystem', 'allowedReadPaths'], splitCommaList(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Allowed write paths')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Allowed write paths" />
                        <input
                          type="text"
                          value={(sandboxPolicyPreview?.filesystem?.allowedWritePaths || []).join(', ')}
                          onChange={(event) => updateSandboxOverride(['filesystem', 'allowedWritePaths'], splitCommaList(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Temp directory')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Temp directory" />
                        <input
                          type="text"
                          value={sandboxPolicyPreview?.filesystem?.tempDirectory || ''}
                          onChange={(event) => updateSandboxOverride(['filesystem', 'tempDirectory'], event.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Max artifact size (MB)')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Max artifact size (MB)" />
                        <input
                          type="number"
                          min={1}
                          value={sandboxPolicyPreview?.filesystem?.maxArtifactSizeMb ?? 25}
                          onChange={(event) => updateSandboxOverride(['filesystem', 'maxArtifactSizeMb'], Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Max total artifacts (MB)')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Max total artifacts (MB)" />
                        <input
                          type="number"
                          min={1}
                          value={sandboxPolicyPreview?.filesystem?.maxTotalArtifactSizeMb ?? 100}
                          onChange={(event) => updateSandboxOverride(['filesystem', 'maxTotalArtifactSizeMb'], Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                    </SandboxEditorCard>

                    <SandboxEditorCard title="Network">
                      <label title={sandboxFieldTooltip('Network mode')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Network mode" />
                        <select
                          value={sandboxPolicyPreview?.network?.mode || 'off'}
                          onChange={(event) => updateSandboxOverride(['network', 'mode'], event.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        >
                          <option value="off">Off</option>
                          <option value="restricted">Restricted</option>
                          <option value="tool_only">Tool only</option>
                          <option value="full">Full</option>
                        </select>
                      </label>
                      <label title={sandboxFieldTooltip('Block private networks')} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                        <FieldTitle label="Block private networks" tooltipKey={sandboxFieldTooltipKeys['Block private networks']} />
                        <input
                          type="checkbox"
                          checked={Boolean(sandboxPolicyPreview?.network?.blockPrivateNetworks)}
                          onChange={(event) => updateSandboxOverride(['network', 'blockPrivateNetworks'], event.target.checked)}
                          className="h-4 w-4 accent-indigo-400"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Allow DNS')} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                        <FieldTitle label="Allow DNS" tooltipKey={sandboxFieldTooltipKeys['Allow DNS']} />
                        <input
                          type="checkbox"
                          checked={Boolean(sandboxPolicyPreview?.network?.allowDns)}
                          onChange={(event) => updateSandboxOverride(['network', 'allowDns'], event.target.checked)}
                          className="h-4 w-4 accent-indigo-400"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('HTTP only')} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                        <FieldTitle label="HTTP only" tooltipKey={sandboxFieldTooltipKeys['HTTP only']} />
                        <input
                          type="checkbox"
                          checked={Boolean(sandboxPolicyPreview?.network?.httpOnly)}
                          onChange={(event) => updateSandboxOverride(['network', 'httpOnly'], event.target.checked)}
                          className="h-4 w-4 accent-indigo-400"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Allowed domains')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Allowed domains" />
                        <input
                          type="text"
                          value={(sandboxPolicyPreview?.network?.allowedDomains || []).join(', ')}
                          onChange={(event) => updateSandboxOverride(['network', 'allowedDomains'], splitCommaList(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Allowed ports')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Allowed ports" />
                        <input
                          type="text"
                          value={(sandboxPolicyPreview?.network?.allowedPorts || []).join(', ')}
                          onChange={(event) => updateSandboxOverride(['network', 'allowedPorts'], splitCommaNumberList(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                    </SandboxEditorCard>

                    <SandboxEditorCard title="Resources">
                      <label title={sandboxFieldTooltip('Timeout (seconds)')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Timeout (seconds)" />
                        <input
                          type="number"
                          min={1}
                          value={sandboxPolicyPreview?.resources?.timeoutSeconds ?? 60}
                          onChange={(event) => updateSandboxOverride(['resources', 'timeoutSeconds'], Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('CPU limit')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="CPU limit" />
                        <input
                          type="number"
                          min={1}
                          value={sandboxPolicyPreview?.resources?.cpuLimit ?? 1}
                          onChange={(event) => updateSandboxOverride(['resources', 'cpuLimit'], Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Memory (MB)')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Memory (MB)" />
                        <input
                          type="number"
                          min={64}
                          value={sandboxPolicyPreview?.resources?.memoryMb ?? 512}
                          onChange={(event) => updateSandboxOverride(['resources', 'memoryMb'], Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Disk (MB)')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Disk (MB)" />
                        <input
                          type="number"
                          min={64}
                          value={sandboxPolicyPreview?.resources?.diskMb ?? 512}
                          onChange={(event) => updateSandboxOverride(['resources', 'diskMb'], Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Max processes')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Max processes" />
                        <input
                          type="number"
                          min={1}
                          value={sandboxPolicyPreview?.resources?.maxProcesses ?? 8}
                          onChange={(event) => updateSandboxOverride(['resources', 'maxProcesses'], Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Max threads')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Max threads" />
                        <input
                          type="number"
                          min={1}
                          value={sandboxPolicyPreview?.resources?.maxThreads ?? 8}
                          onChange={(event) => updateSandboxOverride(['resources', 'maxThreads'], Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Max stdout (KB)')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Max stdout (KB)" />
                        <input
                          type="number"
                          min={1}
                          value={sandboxPolicyPreview?.resources?.maxStdoutKb ?? 256}
                          onChange={(event) => updateSandboxOverride(['resources', 'maxStdoutKb'], Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Max stderr (KB)')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Max stderr (KB)" />
                        <input
                          type="number"
                          min={1}
                          value={sandboxPolicyPreview?.resources?.maxStderrKb ?? 256}
                          onChange={(event) => updateSandboxOverride(['resources', 'maxStderrKb'], Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                    </SandboxEditorCard>

                    <SandboxEditorCard title="Execution">
                      <label title={sandboxFieldTooltip('Allow shell')} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                        <FieldTitle label="Allow shell" tooltipKey={sandboxFieldTooltipKeys['Allow shell']} />
                        <input
                          type="checkbox"
                          checked={Boolean(sandboxPolicyPreview?.execution?.allowShell)}
                          onChange={(event) => updateSandboxOverride(['execution', 'allowShell'], event.target.checked)}
                          className="h-4 w-4 accent-indigo-400"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Allow subprocess')} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                        <FieldTitle label="Allow subprocess" tooltipKey={sandboxFieldTooltipKeys['Allow subprocess']} />
                        <input
                          type="checkbox"
                          checked={Boolean(sandboxPolicyPreview?.execution?.allowSubprocessSpawn)}
                          onChange={(event) => updateSandboxOverride(['execution', 'allowSubprocessSpawn'], event.target.checked)}
                          className="h-4 w-4 accent-indigo-400"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Allow package install')} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                        <FieldTitle label="Allow package install" tooltipKey={sandboxFieldTooltipKeys['Allow package install']} />
                        <input
                          type="checkbox"
                          checked={Boolean(sandboxPolicyPreview?.execution?.allowPackageInstall)}
                          onChange={(event) => updateSandboxOverride(['execution', 'allowPackageInstall'], event.target.checked)}
                          className="h-4 w-4 accent-indigo-400"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Allowed interpreters')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Allowed interpreters" />
                        <input
                          type="text"
                          value={(sandboxPolicyPreview?.execution?.allowedInterpreters || []).join(', ')}
                          onChange={(event) => updateSandboxOverride(['execution', 'allowedInterpreters'], splitCommaList(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Allowed binaries')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Allowed binaries" />
                        <input
                          type="text"
                          value={(sandboxPolicyPreview?.execution?.allowedBinaries || []).join(', ')}
                          onChange={(event) => updateSandboxOverride(['execution', 'allowedBinaries'], splitCommaList(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Blocked binaries')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Blocked binaries" />
                        <input
                          type="text"
                          value={(sandboxPolicyPreview?.execution?.blockedBinaries || []).join(', ')}
                          onChange={(event) => updateSandboxOverride(['execution', 'blockedBinaries'], splitCommaList(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                    </SandboxEditorCard>

                    <SandboxEditorCard title="Environment">
                      <label title={sandboxFieldTooltip('Runtime')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Runtime" />
                        <input
                          type="text"
                          value={sandboxPolicyPreview?.environment?.runtime || ''}
                          onChange={(event) => updateSandboxOverride(['environment', 'runtime'], event.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Runtime version')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Runtime version" />
                        <input
                          type="text"
                          value={sandboxPolicyPreview?.environment?.runtimeVersion || ''}
                          onChange={(event) => updateSandboxOverride(['environment', 'runtimeVersion'], event.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Timezone')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Timezone" />
                        <input
                          type="text"
                          value={sandboxPolicyPreview?.environment?.timezone || ''}
                          onChange={(event) => updateSandboxOverride(['environment', 'timezone'], event.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Locale')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Locale" />
                        <input
                          type="text"
                          value={sandboxPolicyPreview?.environment?.locale || ''}
                          onChange={(event) => updateSandboxOverride(['environment', 'locale'], event.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <SandboxToggleRow
                        label="Inherit host env"
                        checked={Boolean(sandboxPolicyPreview?.environment?.inheritHostEnv)}
                        onChange={(checked) => updateSandboxOverride(['environment', 'inheritHostEnv'], checked)}
                      />
                      <SandboxToggleRow
                        label="Secret injection"
                        checked={Boolean(sandboxPolicyPreview?.environment?.secretInjection)}
                        onChange={(checked) => updateSandboxOverride(['environment', 'secretInjection'], checked)}
                      />
                    </SandboxEditorCard>

                    <SandboxEditorCard title="Security">
                      <SandboxToggleRow
                        label="Run as non-root"
                        checked={Boolean(sandboxPolicyPreview?.security?.runAsNonRoot)}
                        onChange={(checked) => updateSandboxOverride(['security', 'runAsNonRoot'], checked)}
                      />
                      <SandboxToggleRow
                        label="No new privileges"
                        checked={Boolean(sandboxPolicyPreview?.security?.noNewPrivileges)}
                        onChange={(checked) => updateSandboxOverride(['security', 'noNewPrivileges'], checked)}
                      />
                      <SandboxToggleRow
                        label="Disable privileged mode"
                        checked={Boolean(sandboxPolicyPreview?.security?.disablePrivilegedMode)}
                        onChange={(checked) => updateSandboxOverride(['security', 'disablePrivilegedMode'], checked)}
                      />
                      <SandboxToggleRow
                        label="Disable host namespaces"
                        checked={Boolean(sandboxPolicyPreview?.security?.disableHostNamespaces)}
                        onChange={(checked) => updateSandboxOverride(['security', 'disableHostNamespaces'], checked)}
                      />
                      <SandboxToggleRow
                        label="Disable device access"
                        checked={Boolean(sandboxPolicyPreview?.security?.disableDeviceAccess)}
                        onChange={(checked) => updateSandboxOverride(['security', 'disableDeviceAccess'], checked)}
                      />
                    </SandboxEditorCard>

                    <SandboxEditorCard title="IO Policy">
                      <label title={sandboxFieldTooltip('Max input (KB)')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Max input (KB)" />
                        <input
                          type="number"
                          min={1}
                          value={sandboxPolicyPreview?.ioPolicy?.maxInputSizeKb ?? 256}
                          onChange={(event) => updateSandboxOverride(['ioPolicy', 'maxInputSizeKb'], Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Max output (KB)')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Max output (KB)" />
                        <input
                          type="number"
                          min={1}
                          value={sandboxPolicyPreview?.ioPolicy?.maxOutputSizeKb ?? 512}
                          onChange={(event) => updateSandboxOverride(['ioPolicy', 'maxOutputSizeKb'], Number(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Allowed output types')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Allowed output types" />
                        <input
                          type="text"
                          value={(sandboxPolicyPreview?.ioPolicy?.allowedOutputTypes || []).join(', ')}
                          onChange={(event) => updateSandboxOverride(['ioPolicy', 'allowedOutputTypes'], splitCommaList(event.target.value))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        />
                      </label>
                      <label title={sandboxFieldTooltip('Retention')} className="block text-sm text-slate-200">
                        <SandboxFieldLabel label="Retention" />
                        <select
                          value={sandboxPolicyPreview?.ioPolicy?.retention || 'task'}
                          onChange={(event) => updateSandboxOverride(['ioPolicy', 'retention'], event.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        >
                          <option value="none">None</option>
                          <option value="request">Request</option>
                          <option value="session">Session</option>
                          <option value="task">Task</option>
                          <option value="persistent">Persistent</option>
                        </select>
                      </label>
                      <SandboxToggleRow
                        label="Strip sensitive output"
                        checked={Boolean(sandboxPolicyPreview?.ioPolicy?.stripSensitiveOutput)}
                        onChange={(checked) => updateSandboxOverride(['ioPolicy', 'stripSensitiveOutput'], checked)}
                      />
                      <SandboxToggleRow
                        label="Content scan"
                        checked={Boolean(sandboxPolicyPreview?.ioPolicy?.contentScan)}
                        onChange={(checked) => updateSandboxOverride(['ioPolicy', 'contentScan'], checked)}
                      />
                    </SandboxEditorCard>

                    <SandboxEditorCard title="Audit">
                      <SandboxToggleRow
                        label="Audit enabled"
                        checked={Boolean(sandboxPolicyPreview?.audit?.enabled)}
                        onChange={(checked) => updateSandboxOverride(['audit', 'enabled'], checked)}
                      />
                      <SandboxToggleRow
                        label="Capture artifacts"
                        checked={Boolean(sandboxPolicyPreview?.audit?.captureArtifacts)}
                        onChange={(checked) => updateSandboxOverride(['audit', 'captureArtifacts'], checked)}
                      />
                      <SandboxToggleRow
                        label="Capture timing"
                        checked={Boolean(sandboxPolicyPreview?.audit?.captureTiming)}
                        onChange={(checked) => updateSandboxOverride(['audit', 'captureTiming'], checked)}
                      />
                      <SandboxToggleRow
                        label="Capture network events"
                        checked={Boolean(sandboxPolicyPreview?.audit?.captureNetworkEvents)}
                        onChange={(checked) => updateSandboxOverride(['audit', 'captureNetworkEvents'], checked)}
                      />
                    </SandboxEditorCard>

                    <SandboxEditorCard title="Approvals">
                      <SandboxToggleRow
                        label="Require approval for exec"
                        checked={Boolean(sandboxPolicyPreview?.approvals?.requireApprovalForExec)}
                        onChange={(checked) => updateSandboxOverride(['approvals', 'requireApprovalForExec'], checked)}
                      />
                      <SandboxToggleRow
                        label="Require approval outside workspace"
                        checked={Boolean(sandboxPolicyPreview?.approvals?.requireApprovalForWriteOutsideWorkspace)}
                        onChange={(checked) => updateSandboxOverride(['approvals', 'requireApprovalForWriteOutsideWorkspace'], checked)}
                      />
                      <SandboxToggleRow
                        label="Require approval for network"
                        checked={Boolean(sandboxPolicyPreview?.approvals?.requireApprovalForNetwork)}
                        onChange={(checked) => updateSandboxOverride(['approvals', 'requireApprovalForNetwork'], checked)}
                      />
                      <SandboxToggleRow
                        label="Require approval for large artifacts"
                        checked={Boolean(sandboxPolicyPreview?.approvals?.requireApprovalForLargeArtifacts)}
                        onChange={(checked) => updateSandboxOverride(['approvals', 'requireApprovalForLargeArtifacts'], checked)}
                      />
                    </SandboxEditorCard>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
                      <SandboxFieldLabel label="Capability" />
                      <input
                        type="text"
                        aria-label="Capability"
                        value={sandboxCapability}
                        onChange={(event) => setSandboxCapability(event.target.value)}
                        title={tooltip('agents.sandbox.test.capability')}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                      />
                    </label>
                    <label className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
                      <SandboxFieldLabel label="Command" />
                      <input
                        type="text"
                        aria-label="Command"
                        value={sandboxCommand}
                        onChange={(event) => setSandboxCommand(event.target.value)}
                        title={tooltip('agents.sandbox.test.command')}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                      />
                    </label>
                    <label className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
                      <SandboxFieldLabel label="Preset" />
                      <select
                        aria-label="Preset"
                        value={sandboxConfig.profileId || ''}
                        onChange={(event) =>
                          setSandboxConfig((current) =>
                            current
                              ? { ...current, profileId: event.target.value || null }
                              : current,
                          )
                        }
                        title={tooltip('agents.sandbox.test.preset')}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                      >
                        <option value="">None</option>
                        {sandboxProfiles.map((profile) => (
                          <option key={profile.id} value={profile.id}>
                            {profile.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label title={tooltip('agents.sandbox.test.enabled')} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
                      <FieldTitle label="Enabled" tooltipKey={sandboxFieldTooltipKeys.Enabled} />
                      <input
                        type="checkbox"
                        checked={sandboxConfig.enabled}
                        onChange={(event) =>
                          setSandboxConfig((current) =>
                            current ? { ...current, enabled: event.target.checked } : current,
                          )
                        }
                        className="h-4 w-4 accent-indigo-400"
                      />
                    </label>
                    <label className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
                      <SandboxFieldLabel label="Fallback behavior" />
                      <select
                        value={sandboxConfig.enforcement.fallbackBehavior}
                        onChange={(event) =>
                          setSandboxConfig((current) =>
                            current
                              ? {
                                ...current,
                                enforcement: {
                                  ...current.enforcement,
                                  fallbackBehavior: event.target.value as AgentSandboxConfig['enforcement']['fallbackBehavior'],
                                },
                              }
                              : current,
                          )
                        }
                        title={tooltip('agents.sandbox.test.fallback')}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                      >
                        <option value="deny">Deny</option>
                        <option value="allow">Allow</option>
                      </select>
                    </label>
                    <label className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
                      <SandboxFieldLabel label="Mandatory capabilities" />
                      <input
                        type="text"
                        value={sandboxConfig.enforcement.mandatoryForCapabilities.join(', ')}
                        onChange={(event) =>
                          setSandboxConfig((current) =>
                            current
                              ? {
                                ...current,
                                enforcement: {
                                  ...current.enforcement,
                                  mandatoryForCapabilities: event.target.value
                                    .split(',')
                                    .map((value) => value.trim())
                                    .filter(Boolean),
                                },
                              }
                              : current,
                          )
                        }
                        placeholder="exec, process, write"
                        title={tooltip('agents.sandbox.test.mandatoryCapabilities')}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                      />
                    </label>
                  </div>

                  <label className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
                    <SandboxFieldLabel label="Overrides JSON" />
                    <textarea
                      aria-label="Overrides JSON"
                      value={sandboxOverridesText}
                      onChange={(event) => setSandboxOverridesText(event.target.value)}
                      title={tooltip('agents.sandbox.test.overridesJson')}
                      className="min-h-[220px] w-full rounded-xl border border-slate-700 bg-slate-900 p-3 font-mono text-xs text-slate-100 outline-none"
                    />
                  </label>

                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => void validateSandboxConfigNow()}
                      disabled={saving}
                      title={tooltip('agents.sandbox.validate')}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 disabled:opacity-50"
                    >
                      Validate
                    </button>
                    <button
                      type="button"
                      onClick={() => void runSandboxDryRun()}
                      disabled={saving}
                      title={tooltip('agents.sandbox.dryRun')}
                      className="inline-flex items-center gap-2 rounded-full border border-indigo-400/60 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-100 disabled:opacity-50"
                    >
                      Dry-run
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveSandboxConfig()}
                      disabled={saving}
                      title={tooltip('agents.sandbox.save')}
                      className="inline-flex items-center gap-2 rounded-full border border-indigo-400/60 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-100 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      Save Sandbox
                    </button>
                    <button
                      type="button"
                      onClick={() => void runSandboxExecution()}
                      disabled={saving}
                      title={tooltip('agents.sandbox.runTest')}
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 disabled:opacity-50"
                    >
                      Run Test
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-200">Policy Preview</div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${(sandboxDryRun?.riskLevel || selectedSandboxProfile?.riskLevel || 'low') === 'critical'
                        ? 'border-red-400/40 text-red-200'
                        : (sandboxDryRun?.riskLevel || selectedSandboxProfile?.riskLevel || 'low') === 'high'
                          ? 'border-orange-400/40 text-orange-200'
                          : 'border-slate-700 text-slate-300'
                        }`}>
                        {(sandboxDryRun?.riskLevel || selectedSandboxProfile?.riskLevel || 'low').toString()}
                      </span>
                    </div>
                    <pre className="max-h-[240px] overflow-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-[11px] text-slate-300">
                      {JSON.stringify(
                        sandboxDryRun?.effectivePolicy
                        || buildSandboxPreviewConfig(
                          sandboxConfig,
                          selectedSandboxProfile?.config || null,
                          parseSandboxOverrides(sandboxOverridesText),
                        ),
                        null,
                        2,
                      )}
                    </pre>
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="mb-3 text-sm font-semibold text-slate-200">Validation</div>
                    <div className="space-y-2">
                      {(sandboxValidation?.issues || []).map((issue, index) => (
                        <div
                          key={`${issue.field}-${index}`}
                          className={`rounded-2xl border px-4 py-3 text-sm ${issue.severity === 'error'
                            ? 'border-red-500/20 bg-red-500/10 text-red-100'
                            : 'border-amber-500/20 bg-amber-500/10 text-amber-100'
                            }`}
                        >
                          <div className="font-semibold">{issue.field}</div>
                          <div className="mt-1 text-xs opacity-90">{issue.message}</div>
                        </div>
                      ))}
                      {(!sandboxValidation || sandboxValidation.issues.length === 0) && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-400">
                          Nenhuma validacao executada ainda.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="mb-3 text-sm font-semibold text-slate-200">Dry-run Result</div>
                    {sandboxDryRun ? (
                      <div className="space-y-2 text-sm text-slate-300">
                        <div>Allowed: {String(sandboxDryRun.allowed)}</div>
                        <div>Approval required: {String(sandboxDryRun.requiresApproval)}</div>
                        {sandboxDryRun.reasons.length > 0 && (
                          <div className="space-y-2">
                            {sandboxDryRun.reasons.slice(0, 4).map((reason) => (
                              <div key={reason} className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-xs text-slate-400">
                                {reason}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">Executa um dry-run para visualizar a policy efetiva.</div>
                    )}
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="mb-3 text-sm font-semibold text-slate-200">Recent Executions</div>
                    <div className="space-y-2">
                      {sandboxExecutions.slice(0, 5).map((execution) => (
                        <div key={execution.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                          <div className="text-sm text-white">{execution.capability}</div>
                          <div className="mt-1 text-xs text-slate-500">{execution.status}</div>
                        </div>
                      ))}
                      {sandboxExecutions.length === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-500">
                          Nenhuma execucao de sandbox registrada para este agente.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!loading && activeTab === 'sandbox' && !sandboxConfig && (
              <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-400">
                A configuracao de sandbox ainda nao foi carregada.
              </div>
            )}

            {!loading && activeTab === 'chat' && (
              <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="max-h-[360px] space-y-3 overflow-y-auto">
                    {chatMessages.map((message, index) => (
                      <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl border px-4 py-3 text-sm ${message.role === 'user'
                          ? 'border-indigo-400/30 bg-indigo-500/10 text-indigo-50'
                          : 'border-slate-800 bg-slate-900/80 text-slate-200'
                          }`}>
                          <div>{message.content}</div>
                          {message.meta && <div className="mt-2 text-[11px] text-slate-500">{message.meta}</div>}
                        </div>
                      </div>
                    ))}
                    {chatMessages.length === 0 && (
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-6 text-center text-sm text-slate-500">
                        Start a direct conversation with this agent.
                      </div>
                    )}
                  </div>
                  <form onSubmit={sendChat} className="mt-4 space-y-3">
                    <textarea
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      title={tooltip('agents.chat.input')}
                      placeholder="Send a request directly to this agent..."
                      className="min-h-[120px] w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-100 outline-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!chatInput.trim()}
                        title={tooltip('agents.chat.send')}
                        className="rounded-full border border-indigo-400/60 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-100 disabled:opacity-40"
                      >
                        Send to Agent
                      </button>
                    </div>
                  </form>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="mb-3 text-sm font-semibold text-slate-200">Recent Executions</div>
                    <div className="space-y-2">
                      {history.slice(0, 5).map((item) => (
                        <div key={item.taskId} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                          <div className="text-sm text-white">{item.prompt}</div>
                          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                            <span>{item.model || 'n/a'}</span>
                            <span>{item.audit?.overallConformanceScore !== undefined ? item.audit.overallConformanceScore : item.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-slate-400">Selecione um agente para abrir a gestao.</div>
        )}
      </section>
      
      {showImportModal && (
        <AgentImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={refreshAgents}
        />
      )}
      
      {showExportModal && selectedAgent && (
        <AgentExportModal
          agentId={selectedAgent.id}
          agentName={selectedAgent.name}
          onClose={() => setShowExportModal(false)}
          onSuccess={refreshAgents}
        />
      )}
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">{icon}{label}</div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function TabButton({ active, icon, label, onClick, tooltipEntry }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void; tooltipEntry?: TooltipEntry }) {
  return (
    <RichTooltip entry={tooltipEntry}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${active ? 'border-indigo-400/60 bg-indigo-500/10 text-indigo-100' : 'border-slate-700 text-slate-300'
          }`}
      >
        {icon}
        {label}
      </button>
    </RichTooltip>
  );
}

function FieldTitle({ label, tooltipKey, className = '' }: { label: string; tooltipKey: string; className?: string }) {
  const tooltipEntry = useTooltipEntry();

  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      <span>{label}</span>
      <TooltipIcon entry={tooltipEntry(tooltipKey)} />
    </div>
  );
}

function FieldIntro({ tooltipKey }: { tooltipKey: string }) {
  const { locale } = useI18n();
  const tooltipEntry = useTooltipEntry();
  const entry = tooltipEntry(tooltipKey);

  if (!entry) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4 text-sm text-indigo-50">
      <div className="font-semibold">{entry.label}</div>
      {entry.details ? <div className="mt-2 leading-6 text-indigo-100/90">{entry.details}</div> : null}
      {entry.whenToUse ? <div className="mt-2 text-xs uppercase tracking-[0.2em] text-indigo-200/70">{locale === 'pt-BR' ? 'Quando usar' : 'When to use'}</div> : null}
      {entry.whenToUse ? <div className="mt-1 leading-6 text-indigo-100/90">{entry.whenToUse}</div> : null}
      {entry.example ? <div className="mt-3 rounded-xl border border-indigo-400/20 bg-slate-950/30 px-3 py-2 text-xs text-indigo-100">{locale === 'pt-BR' ? 'Exemplo' : 'Example'}: {entry.example}</div> : null}
    </div>
  );
}

function SandboxEditorCard({ title, children }: { title: string; children: React.ReactNode }) {
  const tooltipEntry = useTooltipEntry();
  const tooltipKey = sandboxCardTooltipKeys[title] || 'agents.sandbox.field';

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <span>{title}</span>
        <TooltipIcon entry={tooltipEntry(tooltipKey)} />
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SandboxToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  const tooltipKey = sandboxFieldTooltipKeys[label] || 'agents.sandbox.field';

  return (
    <label className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
      <FieldTitle label={label} tooltipKey={tooltipKey} />
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-indigo-400"
      />
    </label>
  );
}

function SandboxFieldLabel({ label, className = 'mb-2' }: { label: string; className?: string }) {
  return <FieldTitle label={label} tooltipKey={sandboxFieldTooltipKeys[label] || 'agents.sandbox.field'} className={className} />;
}

function parseSandboxOverrides(value: string): Record<string, unknown> {
  const trimmed = value.trim();
  if (!trimmed) {
    return {};
  }

  try {
    const parsed = JSON.parse(trimmed);
    return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function buildSandboxPreviewConfig(
  config: AgentSandboxConfig,
  selectedProfileConfig: Partial<SandboxConfig> | null,
  overrides: Record<string, unknown>,
): SandboxConfig {
  const base = selectedProfileConfig || {
    enabled: config.enabled,
    mode: config.profileId ? 'process' : 'process',
    filesystem: {
      readOnlyRoot: true,
      workingDirectory: '/workspace',
      allowedReadPaths: ['/workspace'],
      allowedWritePaths: ['/workspace/output'],
      tempDirectory: '/workspace/tmp',
      persistArtifacts: true,
    },
    network: {
      mode: 'off',
      blockPrivateNetworks: true,
      allowDns: false,
      httpOnly: true,
    },
    resources: {
      timeoutSeconds: 60,
      cpuLimit: 1,
      memoryMb: 512,
      diskMb: 512,
      maxProcesses: 8,
      maxThreads: 8,
      maxStdoutKb: 256,
      maxStderrKb: 256,
    },
    execution: {
      allowShell: false,
      allowedBinaries: ['node', 'python', 'python3', 'bash'],
      blockedBinaries: ['sudo', 'su', 'ssh', 'scp', 'docker', 'kubectl'],
      allowedInterpreters: ['node', 'python', 'python3'],
      allowSubprocessSpawn: false,
      allowPackageInstall: false,
    },
    environment: {
      runtime: 'node',
      runtimeVersion: '20',
      envVars: {},
      inheritHostEnv: false,
      secretInjection: false,
      timezone: 'UTC',
      locale: 'en-US',
    },
    security: {
      runAsNonRoot: true,
      noNewPrivileges: true,
      disableDeviceAccess: true,
      disablePrivilegedMode: true,
      disableHostNamespaces: true,
    },
    ioPolicy: {
      maxInputSizeKb: 256,
      maxOutputSizeKb: 512,
      allowedOutputTypes: ['text', 'json', 'file'],
      stripSensitiveOutput: true,
      contentScan: true,
      retention: 'task',
    },
    audit: {
      enabled: true,
      captureCommand: true,
      captureStdout: true,
      captureStderr: true,
      captureExitCode: true,
      captureArtifacts: true,
      captureTiming: true,
      captureHashes: true,
      capturePolicySnapshot: true,
      captureNetworkEvents: false,
    },
    approvals: {
      requireApprovalForExec: true,
      requireApprovalForWriteOutsideWorkspace: true,
      requireApprovalForNetwork: true,
      requireApprovalForLargeArtifacts: false,
    },
  };

  return deepMergePreviewConfig(base, {
    enabled: config.enabled,
    ...overrides,
  });
}

function buildSandboxExecutionPayload(
  agentId: string,
  capability: string,
  commandText: string,
  sandboxConfig: AgentSandboxConfig | null,
  profiles: SandboxProfile[],
  overrides: Record<string, unknown>,
) {
  const selectedProfile = sandboxConfig?.profileId
    ? profiles.find((profile) => profile.id === sandboxConfig.profileId)
    : null;

  return {
    agentId,
    capability,
    command: commandText.split(/\s+/).filter(Boolean),
    requestedPaths: ['/workspace'],
    taskId: undefined,
    skillId: undefined,
    skillRequirements: selectedProfile ? selectedProfile.config : undefined,
    temporaryOverrides: overrides as any,
  };
}

function deepMergePreviewConfig(base: any, patch: any): any {
  const result = Array.isArray(base) ? [...base] : { ...base };

  for (const [key, value] of Object.entries(patch || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value) && base?.[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
      result[key] = deepMergePreviewConfig(base[key], value);
      continue;
    }

    result[key] = value;
  }

  return result;
}

function setNestedValue(source: Record<string, unknown>, path: string[], value: unknown): Record<string, unknown> {
  const next = { ...source };
  let cursor: Record<string, unknown> = next;

  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index];
    const current = cursor[key];
    cursor[key] = current && typeof current === 'object' && !Array.isArray(current)
      ? { ...(current as Record<string, unknown>) }
      : {};
    cursor = cursor[key] as Record<string, unknown>;
  }

  cursor[path[path.length - 1]] = value;
  return next;
}

function splitCommaList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitCommaNumberList(value: string): number[] {
  return value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));
}


function formatPct(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'n/a';
  }
  return `${Math.round(value * 100)}%`;
}

function formatCurrency(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'n/a';
  }
  return `$${value.toFixed(2)}`;
}

function buildCreateForm(template: AgentTemplate): CreateAgentInput {
  return {
    name: '',
    role: template.defaults.role,
    description: template.defaults.description,
    teamId: template.defaults.teamId,
    category: template.defaults.category,
    type: template.defaults.type,
    defaultModel: template.defaults.defaultModel,
    isDefault: false,
    specializations: [...(template.defaults.specializations || [])],
  };

}
