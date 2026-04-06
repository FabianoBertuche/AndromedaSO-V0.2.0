import { test, expect } from '@playwright/test';

const API_BASE = 'http://127.0.0.1:5000';
const AUTH_HEADERS = { Authorization: 'Bearer andromeda_dev_web_token' };

test.describe('Andromeda OS - Interface Principal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('deve carregar a página principal', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Andromeda OS');
  });

  test('deve exibir sidebar com navegação', async ({ page }) => {
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();

    await expect(page.getByRole('button', { name: 'Console' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Agents' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Timelines' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Model Center' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Memory' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Knowledge' })).toBeVisible();
  });

  test('deve exibir gateway online quando backend conectado', async ({ page }) => {
    const agents = await page.request.get(`${API_BASE}/v1/agents`, { headers: AUTH_HEADERS });

    const sidebar = page.locator('aside').first();
    await expect(sidebar).toContainText(/Gateway/);

    if (agents.ok()) {
      await expect(sidebar).toContainText('Gateway Online');
      await expect(sidebar).not.toContainText('Gateway Offline');

      const onlineIndicator = sidebar.locator('.bg-emerald-500');
      await expect(onlineIndicator).toBeVisible();
    } else {
      await expect(sidebar).toContainText('Gateway Offline');

      const offlineIndicator = sidebar.locator('.bg-red-500');
      await expect(offlineIndicator).toBeVisible();
    }
  });
});
