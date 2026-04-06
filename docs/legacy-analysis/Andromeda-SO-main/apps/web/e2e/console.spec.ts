import { test, expect } from '@playwright/test';

const API_BASE = 'http://127.0.0.1:5000';
const AUTH_HEADERS = { Authorization: 'Bearer andromeda_dev_web_token' };

test.describe('Console - Funcionalidades', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('deve exibir campo de input para mensagens', async ({ page }) => {
    const input = page.locator('input[type="text"]');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', /Talk to|Initialize sequence/);
  });

  test('deve exibir botão de enviar', async ({ page }) => {
    const sendButton = page.locator('button[aria-label="Send"]');
    await expect(sendButton).toBeVisible();
    await expect(sendButton).toBeDisabled();
  });

  test('deve habilitar botão enviar quando input tem texto', async ({ page }) => {
    const input = page.locator('input[type="text"]');
    const sendButton = page.locator('button[aria-label="Send"]');

    await input.fill('Teste de mensagem');
    await expect(sendButton).toBeEnabled();
  });

  test('deve exibir seletor de agentes', async ({ page }) => {
    const agentSelect = page.locator('select').first();
    await expect(agentSelect).toBeVisible();
  });

  test('deve exibir seletor de modelos', async ({ page }) => {
    const modelSelect = page.locator('select').last();
    await expect(modelSelect).toBeVisible();
    await expect(modelSelect.locator('option').first()).toContainText('Automatic (Router)');
  });

  test('deve exibir título do console', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Andromeda Command Console');
  });

  test('deve exibir informações de sessão no header', async ({ page }) => {
    const sessionLabel = page.locator('text=Session:');
    await expect(sessionLabel).toBeVisible();
  });

  test('deve refletir status real do gateway', async ({ page }) => {
    const agents = await page.request.get(`${API_BASE}/v1/agents`, { headers: AUTH_HEADERS }).catch(() => null);

    const sidebar = page.locator('aside').first();

    if (agents && agents.ok()) {
      await expect(sidebar).toContainText('Gateway Online');
    } else {
      await expect(sidebar).toContainText('Gateway Offline');
    }
  });
});
