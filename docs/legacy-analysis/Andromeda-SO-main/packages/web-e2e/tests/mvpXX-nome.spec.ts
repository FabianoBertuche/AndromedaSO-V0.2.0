// packages/web-e2e/tests/mvpXX-nome.spec.ts
import { test, expect } from '@playwright/test';

// Helper de autenticação reutilizável
async function loginAs(page, email: string, password: string) {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', email);
    await page.fill('[data-testid="password"]', password);
    await page.click('[data-testid="btn-login"]');
    await expect(page).toHaveURL(/dashboard/);
}

test.describe('MVPXX — [Nome do MVP]', () => {

    test.beforeEach(async ({ page }) => {
        await loginAs(page, 'test@andromeda.so', '123456');
    });

    // ─── 1. CARREGAMENTO DAS TELAS ─────────────────────────────────
    test('Tela principal do MVP carrega sem erros', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });

        await page.goto('/[rota-do-mvp]');
        await expect(page.locator('h1')).toBeVisible();
        expect(errors).toHaveLength(0);
    });

    // ─── 2. LISTAGEM ───────────────────────────────────────────────
    test('Lista carrega dados reais do backend', async ({ page }) => {
        await page.goto('/[rota-do-mvp]');
        // Aguarda chamada de API completar
        await page.waitForResponse(resp =>
            resp.url().includes('/api/v1/[recurso]') && resp.status() === 200
        );
        // Verifica que há pelo menos um item ou mensagem de "vazio"
        const items = page.locator('[data-testid="list-item"]');
        const empty = page.locator('[data-testid="empty-state"]');
        expect(
            (await items.count()) > 0 || (await empty.isVisible())
        ).toBeTruthy();
    });

    // ─── 3. CRIAR ──────────────────────────────────────────────────
    test('Botão Criar abre formulário e submete com sucesso', async ({ page }) => {
        await page.goto('/[rota-do-mvp]');
        await page.click('[data-testid="btn-criar"]');
        await expect(page.locator('[data-testid="modal-criar"]')).toBeVisible();

        // Preenche campos obrigatórios
        await page.fill('[data-testid="field-nome"]', 'Teste Playwright E2E');

        // Intercepta a request para confirmar que foi ao backend
        const [response] = await Promise.all([
            page.waitForResponse(resp =>
                resp.url().includes('/api/v1/[recurso]') &&
                resp.request().method() === 'POST'
            ),
            page.click('[data-testid="btn-salvar"]'),
        ]);

        expect(response.status()).toBe(201);
        // Verifica que aparece na lista
        await expect(page.locator('text=Teste Playwright E2E')).toBeVisible();
    });

    // ─── 4. AÇÕES ESPECÍFICAS DO MVP ───────────────────────────────
    // (Adicionar um test para cada botão de ação relevante do MVP)

    // ─── 5. FLUXO E2E COMPLETO ─────────────────────────────────────
    test('Fluxo principal do MVP de ponta a ponta', async ({ page }) => {
        // Descrever o fluxo crítico do MVP aqui
        // Ex: criar → configurar → executar → verificar resultado
    });

});
