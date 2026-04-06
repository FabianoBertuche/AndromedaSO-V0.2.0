import { test, expect } from '@playwright/test';

const API_BASE = 'http://127.0.0.1:5000';
const AUTH_HEADERS = { Authorization: 'Bearer andromeda_dev_web_token' };

test.describe('Console - Integração Real com Backend', () => {
  test.beforeEach(async ({ page }) => {
    const agents = await page.request.get(`${API_BASE}/v1/agents`, { headers: AUTH_HEADERS });
    expect(agents.ok()).toBe(true);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('aside').first()).toBeVisible();
    await page.waitForTimeout(3000);

    const sidebar = page.locator('aside').first();
    await expect(sidebar).toContainText('Gateway Online');
  });

  test('deve carregar agentes reais pela API e pela UI', async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/v1/agents`, { headers: AUTH_HEADERS });
    expect(response.ok()).toBe(true);

    const agents = await response.json();
    expect(Array.isArray(agents)).toBe(true);
    expect(agents.length).toBeGreaterThan(0);

    const agentSelect = page.locator('select').first();
    await expect(agentSelect).toBeVisible();

    const uiOptions = await agentSelect.locator('option').count();
    expect(uiOptions).toBeGreaterThan(0);
    await expect(agentSelect.locator('option').first()).toContainText(agents[0].name);
  });

  test('deve carregar modelos reais do backend pela UI', async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/v1/model-center/models`, { headers: AUTH_HEADERS });
    expect(response.ok()).toBe(true);

    const models = await response.json();
    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);

    const modelSelect = page.locator('select').nth(1);
    await expect(modelSelect).toBeVisible();

    const options = await modelSelect.locator('option').count();
    expect(options).toBeGreaterThan(1);
    await expect(modelSelect.locator('option').nth(1)).toContainText(models[0].displayName);
  });

  test('deve enviar mensagem ao gateway e exibir retorno real do backend', async ({ page }) => {
    const input = page.locator('input[type="text"]');
    const sendButton = page.locator('button[aria-label="Send"]');

    await input.fill('Reply with just OK and no reasoning.');
    await expect(sendButton).toBeEnabled();

    const messagesBefore = await page.locator('.flex.justify-start, .flex.justify-end').count();

    await sendButton.click();

    await page.waitForFunction(
      (before) => {
        const msgs = document.querySelectorAll('.flex.justify-start, .flex.justify-end');
        return msgs.length > before;
      },
      messagesBefore,
      { timeout: 30000 }
    );

    const messagesAfter = await page.locator('.flex.justify-start, .flex.justify-end').count();
    expect(messagesAfter).toBeGreaterThan(messagesBefore);

    await expect(page.locator('body')).toContainText('OK');
    await expect(page.locator('body')).not.toContainText('Timed out after');
  });

  test('deve exibir gateway online no sidebar', async ({ page }) => {
    const sidebar = page.locator('aside').first();

    // Deve conter "Gateway Online", NÃO "Gateway Offline"
    await expect(sidebar).toContainText('Gateway Online');
    await expect(sidebar).not.toContainText('Gateway Offline');

    // Verificar indicador verde
    const onlineIndicator = sidebar.locator('.bg-emerald-500');
    await expect(onlineIndicator).toBeVisible();
  });
});
