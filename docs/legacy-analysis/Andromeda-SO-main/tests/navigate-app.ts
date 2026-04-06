import { chromium, Browser, Page } from '@playwright/test';

async function run() {
  const browser: Browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page: Page = await context.newPage();

  const results: string[] = [];
  results.push(`Browser: Chromium | Viewport: 1920x1080\n`);

  async function navigate(label: string, action: () => Promise<void>) {
    results.push(`\n=== ${label} ===`);
    try {
      await action();
      results.push(`URL: ${page.url()}`);
      const h2 = await page.locator('h2').first().textContent().catch(() => '(no h2)');
      const buttons = await page.locator('nav button').allTextContents().catch(() => []);
      results.push(`Heading: ${h2}`);
      results.push(`Nav buttons: ${buttons.join(', ')}`);
      const error = page.url().includes('error') ? '⚠ URL contains error' : '';
      results.push(`Status: OK ${error}`);
    } catch (e: any) {
      results.push(`Error: ${e.message}`);
    }
  }

  await navigate('Homepage', async () => {
    await page.goto('http://127.0.0.1:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  await navigate('Console tab', async () => {
    await page.getByRole('button', { name: /Console/i }).click();
    await page.waitForTimeout(1000);
  });

  await navigate('Agents tab', async () => {
    await page.getByRole('button', { name: /Agents/i }).click();
    await page.waitForTimeout(1000);
  });

  await navigate('Plans tab', async () => {
    await page.getByRole('button', { name: /Plans/i }).click();
    await page.waitForTimeout(2000);
    const planHeading = await page.getByRole('heading', { name: /Planos/i }).textContent().catch(() => '(not found)');
    const emptyState = await page.getByText(/Nenhum plano criado ainda/i).textContent().catch(() => '(not found)');
    results.push(`Plans heading: ${planHeading}`);
    results.push(`Empty state: ${emptyState}`);
  });

  await navigate('Memory tab', async () => {
    await page.getByRole('button', { name: /Memory/i }).click();
    await page.waitForTimeout(1000);
  });

  await navigate('Knowledge tab', async () => {
    await page.getByRole('button', { name: /Knowledge/i }).click();
    await page.waitForTimeout(1000);
  });

  await navigate('Costs tab', async () => {
    await page.getByRole('button', { name: /Costs/i }).click();
    await page.waitForTimeout(1000);
  });

  await navigate('Timeline tab', async () => {
    await page.getByRole('button', { name: /Timelines/i }).click();
    await page.waitForTimeout(1000);
  });

  await navigate('Model Center tab', async () => {
    await page.getByRole('button', { name: /Model Center/i }).click();
    await page.waitForTimeout(1000);
  });

  await browser.close();

  console.log(results.join('\n'));
}

run().catch(console.error);