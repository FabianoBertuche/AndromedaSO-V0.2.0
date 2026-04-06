import { test, expect } from '@playwright/test';

const API_BASE = 'http://127.0.0.1:5000';
const AUTH_HEADERS = { Authorization: 'Bearer andromeda_dev_web_token' };

test.describe('Agents - Integração Real', () => {
  test.beforeEach(async ({ page }) => {
    const agents = await page.request.get(`${API_BASE}/v1/agents`, { headers: AUTH_HEADERS });
    expect(agents.ok()).toBe(true);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  });

  test('deve navegar para Agents e exibir lista real', async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/v1/agents`, { headers: AUTH_HEADERS });
    expect(response.ok()).toBe(true);
    const agents = await response.json();
    expect(agents.length).toBeGreaterThan(0);

    await page.locator('aside').first().getByRole('button', { name: 'Agents', exact: true }).click();
    await page.waitForTimeout(2000);

    const agentsButton = page.locator('aside').first().getByRole('button', { name: 'Agents', exact: true });
    await expect(agentsButton).toHaveClass(/bg-indigo-500\/10/);
    await expect(page.locator('body')).toContainText('Andromeda Kernel');
  });

  test('deve selecionar agente real e refletir no console', async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/v1/agents`, { headers: AUTH_HEADERS });
    const agents = await response.json();
    expect(agents.length).toBeGreaterThan(0);

    const agentSelect = page.locator('select').first();
    await page.waitForTimeout(2000);

    const options = await agentSelect.locator('option').count();
    expect(options).toBeGreaterThan(0);

    await agentSelect.selectOption({ index: 0 });
    await page.waitForTimeout(500);

    const selectedValue = await agentSelect.inputValue();
    expect(selectedValue).toBeTruthy();
  });
});

test.describe('Navegação - Integração', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('deve navegar por todas as abas e verificar conteúdo', async ({ page }) => {
    const tabs = [
      { name: 'Console', text: 'Andromeda Command Console' },
      { name: 'Agents', text: 'Andromeda Kernel' },
      { name: 'Timelines', text: 'Historico Operacional' },
      { name: 'Model Center', text: 'Central de Modelos' },
      { name: 'Memory', text: 'Memory Layer v1' },
      { name: 'Knowledge', text: 'Knowledge Layer' },
    ];

    for (const tab of tabs) {
      const button = page.locator('aside').first().getByRole('button', { name: tab.name, exact: true });
      await button.click();
      await page.waitForTimeout(2000);

      await expect(button).toHaveClass(/bg-indigo-500\/10/);
      await expect(page.locator('body')).toContainText(tab.text);
    }
  });

  test('deve manter aba ativa ao navegar', async ({ page }) => {
    const agentsButton = page.getByRole('button', { name: 'Agents', exact: true }).first();
    await agentsButton.click();
    await page.waitForTimeout(1000);
    await expect(agentsButton).toHaveClass(/bg-indigo-500\/10/);

    const consoleButton = page.getByRole('button', { name: 'Console', exact: true }).first();
    await consoleButton.click();
    await page.waitForTimeout(1000);
    await expect(consoleButton).toHaveClass(/bg-indigo-500\/10/);
    await expect(page.locator('h2')).toContainText('Andromeda Command Console');
  });
});

test.describe('Model Center - Integração Real', () => {
  test.beforeEach(async ({ page }) => {
    const models = await page.request.get(`${API_BASE}/v1/model-center/models`, { headers: AUTH_HEADERS });
    expect(models.ok()).toBe(true);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('deve carregar modelos do backend no Model Center', async ({ page }) => {
    await page.locator('aside').first().getByRole('button', { name: /Model Center/i }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toContainText('Central de Modelos');
    await expect(page.locator('body')).toContainText('Catálogo de Modelos');
  });
});

test.describe('Memory - Integração Real', () => {
  test.beforeEach(async ({ page }) => {
    const memory = await page.request.get(`${API_BASE}/v1/memory`, { headers: AUTH_HEADERS });
    expect(memory.ok()).toBe(true);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('deve carregar Memory com dados do backend', async ({ page }) => {
    await page.getByRole('button', { name: 'Memory' }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toContainText('Memory Layer v1');
  });
});

test.describe('Knowledge - Integração Real', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('deve carregar Knowledge com dados reais do backend', async ({ page }) => {
    const collections = await page.request.get(`${API_BASE}/v1/knowledge/collections`, { headers: AUTH_HEADERS });
    expect(collections.ok()).toBe(true);

    await page.locator('aside').first().getByRole('button', { name: 'Knowledge', exact: true }).click();
    await page.waitForTimeout(3000);

    await expect(page.locator('body')).toContainText('Knowledge Layer');
    await expect(page.locator('body')).toContainText('Knowledge Collections');
    await expect(page.locator('body')).toContainText(/Collection|Audit Collection/);
  });
});
