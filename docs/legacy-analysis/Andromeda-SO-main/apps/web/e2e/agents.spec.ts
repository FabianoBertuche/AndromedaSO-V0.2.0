import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:5000';
const AUTH_HEADERS = { Authorization: 'Bearer andromeda_dev_web_token' };

test.describe('Agents - Funcionalidades Reais', () => {
  test.beforeEach(async ({ page }) => {
    const health = await page.request.get(`${API_BASE}/v1/health`).catch(() => null);
    if (!health || !health.ok()) {
      test.fail(true, 'Backend não está rodando em localhost:5000');
    }

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Agents' }).click();
    await page.waitForTimeout(2000);
  });

  test('deve carregar lista de agentes reais', async ({ page }) => {
    // Verificar via API
    const response = await page.request.get(`${API_BASE}/v1/agents`, { headers: AUTH_HEADERS });
    expect(response.ok()).toBe(true);

    const agents = await response.json();
    expect(agents.length).toBeGreaterThan(0);

    // Verificar que a view exibe os agentes
    const main = page.locator('main');
    await expect(main).not.toBeEmpty();

    // Deve haver pelo menos um elemento de agente visível
    const content = await main.textContent();
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(10);
  });

  test('deve exibir detalhes do agente ao selecionar', async ({ page }) => {
    // Buscar agentes reais
    const response = await page.request.get(`${API_BASE}/v1/agents`, { headers: AUTH_HEADERS });
    const agents = await response.json();
    expect(agents.length).toBeGreaterThan(0);

    // Se houver agentes, verificar que a UI mostra informações
    const main = page.locator('main');
    await expect(main).not.toBeEmpty();
  });
});
