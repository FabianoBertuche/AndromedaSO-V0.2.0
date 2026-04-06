import React from 'react';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentManagementView } from '../../../src/components/agents/AgentManagementView';
import type { AgentSummary } from '../../../src/lib/agents';

const mocks = vi.hoisted(() => ({
  dryRunSandbox: vi.fn(),
  chatWithAgent: vi.fn(),
  getAgentSandbox: vi.fn(),
  getAgentBehavior: vi.fn(),
  getAgentConformance: vi.fn(),
  getAgentHistory: vi.fn(),
  getAgentProfile: vi.fn(),
  getAgentProfileHistory: vi.fn(),
  getAgentPerformance: vi.fn(),
  getAgentPerformanceTrend: vi.fn(),
  getAgentVersions: vi.fn(),
  getAgentSafeguards: vi.fn(),
  listPlaybookSuggestions: vi.fn(),
  listSandboxExecutions: vi.fn(),
  listSandboxProfiles: vi.fn(),
  approvePlaybookSuggestion: vi.fn(),
  rejectPlaybookSuggestion: vi.fn(),
  restoreAgentProfileVersion: vi.fn(),
  restoreAgentStoredVersion: vi.fn(),
  startSandboxExecution: vi.fn(),
  updateAgentSandbox: vi.fn(),
  updateAgentBehavior: vi.fn(),
  updateAgentProfile: vi.fn(),
  updateAgentSafeguards: vi.fn(),
  validateSandboxConfig: vi.fn(),
}));

vi.mock('../../../src/lib/agents', () => ({
  dryRunSandbox: mocks.dryRunSandbox,
  chatWithAgent: mocks.chatWithAgent,
  getAgentSandbox: mocks.getAgentSandbox,
  getAgentBehavior: mocks.getAgentBehavior,
  getAgentConformance: mocks.getAgentConformance,
  getAgentHistory: mocks.getAgentHistory,
  getAgentProfile: mocks.getAgentProfile,
  getAgentProfileHistory: mocks.getAgentProfileHistory,
  getAgentPerformance: mocks.getAgentPerformance,
  getAgentPerformanceTrend: mocks.getAgentPerformanceTrend,
  getAgentVersions: mocks.getAgentVersions,
  getAgentSafeguards: mocks.getAgentSafeguards,
  listPlaybookSuggestions: mocks.listPlaybookSuggestions,
  listSandboxExecutions: mocks.listSandboxExecutions,
  listSandboxProfiles: mocks.listSandboxProfiles,
  approvePlaybookSuggestion: mocks.approvePlaybookSuggestion,
  rejectPlaybookSuggestion: mocks.rejectPlaybookSuggestion,
  restoreAgentProfileVersion: mocks.restoreAgentProfileVersion,
  restoreAgentStoredVersion: mocks.restoreAgentStoredVersion,
  startSandboxExecution: mocks.startSandboxExecution,
  updateAgentSandbox: mocks.updateAgentSandbox,
  updateAgentBehavior: mocks.updateAgentBehavior,
  updateAgentProfile: mocks.updateAgentProfile,
  updateAgentSafeguards: mocks.updateAgentSafeguards,
  validateSandboxConfig: mocks.validateSandboxConfig,
}));

describe('AgentManagementView sandbox tab', () => {
  vi.setConfig({ testTimeout: 20000 });
  const agent = {
    id: 'agent-1',
    name: 'Agent One',
    role: 'assistant',
    category: 'ops',
    teamId: 'team-alpha',
    status: 'active',
    type: 'general',
    defaultModel: 'model-a',
    profileVersion: 'v12',
    identityActive: true,
    recentConformanceScore: 91,
  } satisfies AgentSummary;

  const profileDocument = {
    id: 'agent-1',
    version: 'v12',
    status: 'active',
    description: 'Agent description',
    teamId: 'team-alpha',
    category: 'ops',
    type: 'general',
    defaultModel: 'model-a',
    isDefault: false,
    identity: {
      name: 'Agent One',
      role: 'assistant',
      mission: 'Assist',
      scope: 'Scope',
      communicationStyle: 'clear',
      ecosystemRole: 'operator',
      agentType: 'general',
      specializations: ['sandbox', 'api'],
    },
    markdown: {
      identity: '# Identity',
      soul: '# Soul',
      rules: '# Rules',
      playbook: '# Playbook',
      context: '# Context',
    },
    persona: {
      formality: 50,
      warmth: 50,
      objectivity: 50,
      detailLevel: 50,
      caution: 50,
      autonomy: 50,
      creativity: 50,
      ambiguityTolerance: 50,
      proactivity: 50,
      delegationTendency: 50,
      feedbackFrequency: 50,
      playbookStrictness: 50,
      complianceStrictness: 50,
      selfReviewIntensity: 50,
      evidenceRequirements: 50,
    },
    safeguards: {
      mode: 'balanced',
      minOverallConformance: 70,
      requireAuditOnCriticalTasks: true,
      alwaysProvideIntermediateFeedback: true,
      preferSpecialistDelegation: true,
      blockOutOfRoleResponses: true,
      runSelfReview: true,
      prioritizeSkillFirst: true,
      alwaysSuggestNextSteps: true,
      correctiveAction: 'rewrite',
      activePolicies: ['sandbox'],
    },
    createdAt: '2026-03-18T12:00:00.000Z',
    updatedAt: '2026-03-18T12:00:00.000Z',
  };

  const sandboxConfig = {
    agentId: 'agent-1',
    enabled: true,
    profileId: 'sbx_code_runner',
    overrides: {},
    enforcement: {
      mandatoryForCapabilities: ['exec', 'write'],
      fallbackBehavior: 'deny' as const,
    },
    createdAt: '2026-03-18T12:00:00.000Z',
    updatedAt: '2026-03-18T12:00:00.000Z',
  };

  const sandboxProfile = {
    id: 'sbx_code_runner',
    name: 'Code Runner',
    description: 'Run controlled code',
    version: 1,
    isSystem: true,
    mode: 'process' as const,
    riskLevel: 'high' as const,
    config: {
      enabled: true,
      mode: 'process' as const,
      filesystem: {
        readOnlyRoot: true,
        workingDirectory: '/workspace',
        allowedReadPaths: ['/workspace'],
        allowedWritePaths: ['/workspace/output'],
        tempDirectory: '/workspace/tmp',
        persistArtifacts: true,
      },
      network: {
        mode: 'off' as const,
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
        allowedBinaries: ['node'],
        blockedBinaries: ['sudo'],
        allowedInterpreters: ['node'],
        allowSubprocessSpawn: true,
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
        retention: 'task' as const,
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
    },
    createdAt: '2026-03-18T12:00:00.000Z',
    updatedAt: '2026-03-18T12:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getAgentProfile.mockResolvedValue(profileDocument);
    mocks.getAgentBehavior.mockResolvedValue(profileDocument.persona);
    mocks.getAgentSafeguards.mockResolvedValue(profileDocument.safeguards);
    mocks.getAgentProfileHistory.mockResolvedValue([{ version: 'v12', updatedAt: '2026-03-18T12:00:00.000Z', summary: 'v12' }]);
    mocks.getAgentVersions.mockResolvedValue([{ versionNumber: 1, sourceVersionLabel: 'v12', changeSummary: 'seed', createdAt: '2026-03-18T12:00:00.000Z' }]);
    mocks.getAgentHistory.mockResolvedValue([]);
    mocks.getAgentConformance.mockResolvedValue({ agentId: 'agent-1', recentExecutions: [], recentViolations: [] });
    mocks.getAgentPerformance.mockResolvedValue({ agentId: 'agent-1', period: '30d', items: [] });
    mocks.getAgentPerformanceTrend.mockResolvedValue({ agentId: 'agent-1', items: [] });
    mocks.listPlaybookSuggestions.mockResolvedValue([]);
    mocks.getAgentSandbox.mockResolvedValue(sandboxConfig);
    mocks.listSandboxProfiles.mockResolvedValue([sandboxProfile]);
    mocks.listSandboxExecutions.mockResolvedValue([]);
    mocks.validateSandboxConfig.mockResolvedValue({ valid: true, issues: [] });
    mocks.dryRunSandbox.mockResolvedValue({
      allowed: true,
      requiresApproval: false,
      riskLevel: 'low',
      validation: { valid: true, issues: [] },
      effectivePolicy: sandboxProfile.config,
      reasons: [],
    });
    mocks.startSandboxExecution.mockResolvedValue({
      execution: {
        id: 'exec-1',
        agentId: 'agent-1',
        capability: 'exec',
        status: 'queued',
        mode: 'process',
        command: ['node', '-v'],
        policySnapshot: sandboxProfile.config,
      },
    });
  });

  it('renderiza a aba Sandbox com os controles principais', async () => {
    const user = userEvent.setup();

    render(
      <AgentManagementView
        agents={[agent]}
        selectedAgentId="agent-1"
        sessionId="session-1"
        onSelectAgent={vi.fn()}
        onUseInConsole={vi.fn()}
        refreshAgents={vi.fn(async () => {})}
      />,
    );

    await waitFor(() => expect(screen.getByRole('button', { name: 'Sandbox' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Sandbox' }));

    await waitFor(() => expect(screen.getByText('Policy Preview')).toBeInTheDocument());

    expect(screen.getByDisplayValue('exec')).toBeInTheDocument();
    expect(screen.getByDisplayValue('node -v')).toBeInTheDocument();
    expect(screen.getByText('Recent Executions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Validate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dry-run' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Sandbox' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run Test' })).toBeInTheDocument();
    expect(screen.getByText('Nenhuma execucao de sandbox registrada para este agente.')).toBeInTheDocument();
  });

  it('executa dry-run com o payload esperado da UI', async () => {
    const user = userEvent.setup();

    render(
      <AgentManagementView
        agents={[agent]}
        selectedAgentId="agent-1"
        sessionId="session-1"
        onSelectAgent={vi.fn()}
        onUseInConsole={vi.fn()}
        refreshAgents={vi.fn(async () => {})}
      />,
    );

    await waitFor(() => expect(screen.getByRole('button', { name: 'Sandbox' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Sandbox' }));
    await waitFor(() => expect(screen.getByText('Policy Preview')).toBeInTheDocument());

    const [capabilityInput, commandInput, overridesTextarea] = [
      screen.getByDisplayValue('exec'),
      screen.getByDisplayValue('node -v'),
      screen.getByRole('textbox', { name: 'Overrides JSON' }),
    ];

    await user.clear(capabilityInput);
    await user.type(capabilityInput, 'read');
    await user.clear(commandInput);
    await user.type(commandInput, 'node --version');
    fireEvent.change(overridesTextarea, { target: { value: '{\n  "network": { "mode": "restricted" }\n}' } });

    await user.click(screen.getByRole('button', { name: 'Dry-run' }));

    await waitFor(() => expect(mocks.dryRunSandbox).toHaveBeenCalledTimes(1));
    expect(mocks.dryRunSandbox).toHaveBeenCalledWith({
      agentId: 'agent-1',
      capability: 'read',
      command: ['node', '--version'],
      requestedPaths: ['/workspace'],
      skillRequirements: sandboxProfile.config,
      temporaryOverrides: {
        network: {
          mode: 'restricted',
        },
      },
    });
    expect(screen.getByText('Allowed: true')).toBeInTheDocument();
    expect(screen.getByText('Approval required: false')).toBeInTheDocument();
  });

  it('dispara a execução de teste da sandbox pela UI', async () => {
    const user = userEvent.setup();
    const refreshAgents = vi.fn(async () => {});

    render(
      <AgentManagementView
        agents={[agent]}
        selectedAgentId="agent-1"
        sessionId="session-1"
        onSelectAgent={vi.fn()}
        onUseInConsole={vi.fn()}
        refreshAgents={refreshAgents}
      />,
    );

    await waitFor(() => expect(screen.getByRole('button', { name: 'Sandbox' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Sandbox' }));
    await waitFor(() => expect(screen.getByText('Policy Preview')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Run Test' }));

    await waitFor(() => expect(mocks.startSandboxExecution).toHaveBeenCalledTimes(1));
    expect(mocks.startSandboxExecution).toHaveBeenCalledWith(expect.objectContaining({
      agentId: 'agent-1',
      capability: 'exec',
      command: ['node', '-v'],
      requestedPaths: ['/workspace'],
      skillRequirements: sandboxProfile.config,
      temporaryOverrides: {},
    }));
  });
});
