import { test, expect } from '@playwright/test';

test.describe('Plans tab', () => {
  test('navigates to Plans tab and renders the view', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173');

    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /Plans/i }).click();

    await expect(page.getByRole('heading', { name: /Planos de Execução/i })).toBeVisible({ timeout: 5000 });

    await expect(page.getByText(/Nenhum plano criado ainda/i)).toBeVisible({ timeout: 3000 });
  });

  test('shows tooltip on Plans nav button', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173');
    await page.waitForLoadState('networkidle');

    const plansButton = page.getByRole('button', { name: /Plans/i });
    await expect(plansButton).toHaveAttribute('title', /Plans/i);
  });
});