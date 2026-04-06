import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/model-center/models', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'model-1', externalModelId: 'llama3', displayName: 'Llama 3' }]),
    });
  });

  await page.route('**/v1/agents', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'agent-1', name: 'Kernel', role: 'Operational orchestrator', category: 'ops', teamId: 'team-core', status: 'active', type: 'specialist', defaultModel: 'automatic-router', profileVersion: 'v1.2.0', identityActive: true, recentConformanceScore: 91 }]),
    });
  });

  await page.route('**/v1/agents/agent-1/profile', async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profileDocument()) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profileDocument()) });
  });

  await page.route('**/v1/agents/agent-1/profile/history', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ version: 'v1.1.0', updatedAt: '2026-03-23T12:00:00.000Z', summary: 'seed' }]) });
  });

  await page.route('**/v1/agents/agent-1/versions', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ agentId: 'agent-1', restoredVersionNumber: 1, currentVersionNumber: 2, profileVersionLabel: 'v1.2.0', updatedAt: new Date().toISOString() }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ agentId: 'agent-1', items: [{ versionNumber: 2, sourceVersionLabel: 'v1.2.0', changeSummary: 'metadata updated', createdAt: '2026-03-23T12:30:00.000Z' }] }) });
  });

  await page.route('**/v1/agents/agent-1/behavior', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profileDocument().persona) });
  });

  await page.route('**/v1/agents/agent-1/safeguards', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profileDocument().safeguards) });
  });

  await page.route('**/v1/agents/agent-1/conformance', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ agentId: 'agent-1', averageOverallConformanceScore: 88, recentExecutions: [], recentViolations: [] }) });
  });

  await page.route('**/v1/agents/agent-1/history', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.route('**/v1/agents/agent-1/performance?period=30d', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ agentId: 'agent-1', period: '30d', items: [{ agentId: 'agent-1', periodType: 'daily', periodStart: '2026-03-23T00:00:00.000Z', periodEnd: '2026-03-23T23:59:59.999Z', tasksTotal: 10, tasksSucceeded: 8, tasksFailed: 2, successRate: 0.8, avgConformance: 0.87, feedbackScore: 1, avgLatencyMs: 1800, totalTokensUsed: 12000, totalCostUsd: 4.2, reputationScores: { research: 0.889, analysis: 0.75 }, reputationUpdatedAt: '2026-03-24T01:00:00.000Z', metricsSnapshot: null }] }) });
  });

  await page.route('**/v1/agents/agent-1/performance/trend', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ agentId: 'agent-1', items: [{ weekStart: '2026-03-17T00:00:00.000Z', avgSuccessRate: 0.8, avgConformanceScore: 0.87, totalCostUsd: 4.2 }] }) });
  });

  await page.route('**/v1/agents/agent-1/playbook-suggestions', async (route) => {
    const method = route.request().method();
    if (method === 'POST') {
      const approved = route.request().url().includes('/approve');
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 's1', status: approved ? 'approved' : 'rejected' }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ agentId: 'agent-1', items: [
      { id: 's1', agentId: 'agent-1', title: 'Reforcar validacao', summary: 'Sugestao derivada de episodios recentes.', suggestion: 'Adicionar verificacao explicita antes do parse.', confidence: 0.82, status: 'pending', sourceEpisodeIds: ['e1'], sourceEpisodes: [{ id: 'e1', summary: 'Falha de parse em timestamp.', createdAt: '2026-03-23T00:00:00.000Z', importanceScore: 84 }], reviewedBy: null, reviewedAt: null, rejectionReason: null, createdAt: '2026-03-24T00:00:00.000Z' },
      { id: 's2', agentId: 'agent-1', title: 'Historico aprovado', summary: 'Sugestao anterior.', suggestion: 'Documentar precondicoes.', confidence: 0.91, status: 'approved', sourceEpisodeIds: ['e2'], sourceEpisodes: [], reviewedBy: 'user-1', reviewedAt: '2026-03-24T05:00:00.000Z', rejectionReason: null, createdAt: '2026-03-20T00:00:00.000Z' },
    ] }) });
  });

  await page.route('**/v1/costs/summary**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ range: { from: '2026-03-01T00:00:00.000Z', to: '2026-03-31T23:59:59.999Z' }, currency: 'USD', totals: { costUsd: 12.4, tokensUsed: 9123, executions: 18, avgCostPerExecutionUsd: 0.6889 }, series: [{ bucket: '2026-03-22', costUsd: 4.2, tokensUsed: 4000, executions: 6 }, { bucket: '2026-03-23', costUsd: 8.2, tokensUsed: 5123, executions: 12 }] }) });
  });

  await page.route('**/v1/costs/by-agent**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ range: { from: '2026-03-01T00:00:00.000Z', to: '2026-03-31T23:59:59.999Z' }, items: [{ agentId: 'agent-1', executions: 18, tokensUsed: 9123, costUsd: 12.4, avgLatencyMs: 1800 }] }) });
  });

  await page.route('**/v1/costs/export', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ fileName: 'costs.csv', contentType: 'text/csv', data: 'agentId,executions,tokensUsed,costUsd,avgLatencyMs\nagent-1,18,9123,12.4,1800\n' }) });
  });
});

test('navigates MVP10 UI surfaces without breakage', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Andromeda OS' })).toBeVisible();
  await page.getByRole('button', { name: 'Agents' }).click();
  await expect(page.getByRole('button', { name: 'History' })).toBeVisible();

  await page.getByRole('button', { name: 'Performance' }).click();
  await expect(page.getByText('Reputacao por Capability')).toBeVisible();
  await expect(page.getByText('Trend (90 dias)')).toBeVisible();

  await page.getByRole('button', { name: 'Suggestions' }).click();
  await expect(page.getByText('Pending Suggestions')).toBeVisible();
  await expect(page.getByText('Reforcar validacao')).toBeVisible();

  await page.getByRole('button', { name: 'Costs' }).click();
  await expect(page.getByRole('heading', { name: 'Costs Dashboard' })).toBeVisible();
  await expect(page.getByText('Top Agents by Spend')).toBeVisible();
  await expect(page.getByText('Cost Breakdown')).toBeVisible();
});

function profileDocument() {
  return {
    id: 'agent-1',
    version: 'v1.2.0',
    status: 'active',
    description: 'Coordinates work across the system.',
    teamId: 'team-core',
    category: 'ops',
    type: 'orchestrator',
    defaultModel: 'automatic-router',
    isDefault: false,
    identity: { name: 'Kernel', role: 'Operational orchestrator', mission: 'Coordinate', scope: 'Core', communicationStyle: 'Direct', ecosystemRole: 'Operator', agentType: 'orchestrator', specializations: ['research', 'analysis'] },
    markdown: { identity: '# Identity', soul: '# Soul', rules: '# Rules', playbook: '# Playbook', context: '# Context' },
    persona: { formality: 60, warmth: 55, objectivity: 80, detailLevel: 70, caution: 75, autonomy: 65, creativity: 50, ambiguityTolerance: 45, proactivity: 80, delegationTendency: 50, feedbackFrequency: 70, playbookStrictness: 70, complianceStrictness: 85, selfReviewIntensity: 72, evidenceRequirements: 68 },
    safeguards: { mode: 'balanced', minOverallConformance: 70, requireAuditOnCriticalTasks: false, alwaysProvideIntermediateFeedback: false, preferSpecialistDelegation: false, blockOutOfRoleResponses: false, runSelfReview: true, prioritizeSkillFirst: false, alwaysSuggestNextSteps: true, correctiveAction: 'rewrite', activePolicies: ['sandbox'] },
    createdAt: '2026-03-20T00:00:00.000Z',
    updatedAt: '2026-03-24T00:00:00.000Z',
  };
}
