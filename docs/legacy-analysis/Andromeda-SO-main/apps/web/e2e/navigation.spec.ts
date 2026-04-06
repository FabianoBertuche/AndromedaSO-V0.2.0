import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.describe('Navegação entre Abas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  function navButton(page: Page, name: string) {
    return page.locator('aside').first().getByRole('button', { name, exact: true });
  }

  test('deve navegar para aba Console', async ({ page }) => {
    await navButton(page, 'Console').click();
    await expect(page.locator('h2')).toContainText('Andromeda Command Console');
    await expect(page.locator('body')).toContainText('Andromeda Command Console');
  });

  test('deve navegar para aba Agents', async ({ page }) => {
    const btn = navButton(page, 'Agents');
    await btn.click();
    await page.waitForTimeout(1000);
    await expect(btn).toHaveClass(/bg-indigo-500\/10/);
    await expect(page.locator('body')).toContainText('Andromeda Kernel');
  });

  test('deve navegar para aba Timelines', async ({ page }) => {
    const btn = navButton(page, 'Timelines');
    await btn.click();
    await page.waitForTimeout(1000);
    await expect(btn).toHaveClass(/bg-indigo-500\/10/);
    await expect(page.locator('body')).toContainText('Historico Operacional');
  });

  test('deve navegar para aba Model Center', async ({ page }) => {
    const btn = navButton(page, 'Model Center');
    await btn.click();
    await page.waitForTimeout(1000);
    await expect(btn).toHaveClass(/bg-indigo-500\/10/);
    await expect(page.locator('body')).toContainText('Central de Modelos');
  });

  test('deve navegar para aba Memory', async ({ page }) => {
    const btn = navButton(page, 'Memory');
    await btn.click();
    await page.waitForTimeout(1000);
    await expect(btn).toHaveClass(/bg-indigo-500\/10/);
    await expect(page.locator('body')).toContainText('Memory Layer v1');
  });

  test('deve navegar para aba Knowledge', async ({ page }) => {
    const btn = navButton(page, 'Knowledge');
    await btn.click();
    await page.waitForTimeout(1000);
    await expect(btn).toHaveClass(/bg-indigo-500\/10/);
    await expect(page.locator('body')).toContainText('Knowledge Layer');
  });

  test('deve destacar aba ativa', async ({ page }) => {
    const consoleButton = navButton(page, 'Console');
    await consoleButton.click();
    await expect(consoleButton).toHaveClass(/bg-indigo-500\/10/);
  });
});
