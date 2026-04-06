import { test, expect } from '@playwright/test';

const API_BASE = 'http://127.0.0.1:5000';
const AUTH_HEADERS = { Authorization: 'Bearer andromeda_dev_web_token' };

test.describe('Views Específicas - Integração Real', () => {
  test.beforeEach(async ({ page }) => {
    const agents = await page.request.get(`${API_BASE}/v1/agents`, { headers: AUTH_HEADERS }).catch(() => null);
    expect(agents?.ok()).toBe(true);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Timeline - deve carregar view com conteúdo', async ({ page }) => {
    await page.locator('aside').first().getByRole('button', { name: 'Timelines', exact: true }).click();
    await page.waitForTimeout(2000);

    await expect(page.locator('aside').first().getByRole('button', { name: 'Timelines', exact: true })).toHaveClass(/bg-indigo-500\/10/);
    await expect(page.locator('body')).toContainText('Historico Operacional');
  });

  test('Model Center - deve carregar view com conteúdo', async ({ page }) => {
    await page.locator('aside').first().getByRole('button', { name: 'Model Center', exact: true }).click();
    await page.waitForTimeout(2000);

    await expect(page.locator('aside').first().getByRole('button', { name: 'Model Center', exact: true })).toHaveClass(/bg-indigo-500\/10/);
    await expect(page.locator('body')).toContainText('Central de Modelos');
  });

  test('Memory - deve carregar view com conteúdo', async ({ page }) => {
    await page.locator('aside').first().getByRole('button', { name: 'Memory', exact: true }).click();
    await page.waitForTimeout(2000);

    await expect(page.locator('aside').first().getByRole('button', { name: 'Memory', exact: true })).toHaveClass(/bg-indigo-500\/10/);
    await expect(page.locator('body')).toContainText('Memory Layer v1');
  });

  test('Knowledge - deve carregar view com conteúdo', async ({ page }) => {
    await page.locator('aside').first().getByRole('button', { name: 'Knowledge', exact: true }).click();
    await page.waitForTimeout(2000);

    await expect(page.locator('aside').first().getByRole('button', { name: 'Knowledge', exact: true })).toHaveClass(/bg-indigo-500\/10/);
    await expect(page.locator('body')).toContainText('Knowledge Layer');
  });
});
