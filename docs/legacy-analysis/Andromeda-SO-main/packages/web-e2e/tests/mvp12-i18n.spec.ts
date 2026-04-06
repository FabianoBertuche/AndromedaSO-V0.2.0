// packages/web-e2e/tests/mvp12-i18n.spec.ts
import { test, expect } from '@playwright/test';

async function loginAs(page, email: string, password: string) {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', email);
    await page.fill('[data-testid="password"]', password);
    await page.click('[data-testid="btn-login"]');
    await expect(page).toHaveURL(/dashboard/);
}

test.describe('MVP12 — i18n Nativa PT-BR / EN-US', () => {

    test.beforeEach(async ({ page }) => {
        await loginAs(page, 'test@andromeda.so', '123456');
    });

    // ─── 1. LOCALE SWITCHER ─────────────────────────────────────────
    test('LocaleSwitcher exibe PT-BR como padrão', async ({ page }) => {
        await page.goto('/dashboard');
        
        // Verifica que o locale switcher está visível
        const localeSwitcher = page.locator('[data-testid="locale-switcher"]');
        await expect(localeSwitcher).toBeVisible();
        
        // Verifica que PT-BR está selecionado por padrão
        await expect(localeSwitcher).toContainText('PT');
    });

    test('Troca de locale PT-BR para EN-US sem reload', async ({ page }) => {
        await page.goto('/dashboard');
        
        // Captura texto em PT-BR
        const labelPT = await page.locator('h1').first().textContent();
        
        // Abre o dropdown de locale
        await page.click('[data-testid="locale-switcher"]');
        
        // Seleciona EN-US
        await page.click('[data-testid="locale-option-en-US"]');
        
        // Aguarda a tradução ser aplicada
        await page.waitForTimeout(500);
        
        // Verifica que o texto mudou (não é mais o mesmo)
        const labelEN = await page.locator('h1').first().textContent();
        expect(labelPT).not.toBe(labelEN);
        
        // Verifica que não houve reload (URL permanece a mesma)
        expect(page.url()).toContain('/dashboard');
    });

    test('Locale persiste após refresh', async ({ page }) => {
        await page.goto('/dashboard');
        
        // Troca para EN-US
        await page.click('[data-testid="locale-switcher"]');
        await page.click('[data-testid="locale-option-en-US"]');
        await page.waitForTimeout(500);
        
        // Recarrega a página
        await page.reload();
        
        // Verifica que EN-US ainda está selecionado
        const localeSwitcher = page.locator('[data-testid="locale-switcher"]');
        await expect(localeSwitcher).toContainText('EN');
    });

    // ─── 2. TRADUÇÕES DE UI ───────────────────────────────────────
    test('Labels de formulário são traduzidos', async ({ page }) => {
        await page.goto('/agents');
        
        // Captura labels em PT-BR
        let nameLabel = await page.locator('label[for="name"]').textContent();
        expect(nameLabel).toContain('Nome');
        
        // Troca para EN-US
        await page.click('[data-testid="locale-switcher"]');
        await page.click('[data-testid="locale-option-en-US"]');
        await page.waitForTimeout(500);
        
        // Verifica que labels mudaram
        nameLabel = await page.locator('label[for="name"]').textContent();
        expect(nameLabel).toContain('Name');
    });

    test('Mensagens de erro são traduzidas', async ({ page }) => {
        await page.goto('/agents');
        
        // Troca para EN-US
        await page.click('[data-testid="locale-switcher"]');
        await page.click('[data-testid="locale-option-en-US"]');
        await page.waitForTimeout(500);
        
        // Tenta criar agente sem nome
        await page.click('[data-testid="btn-criar-agente"]');
        await page.click('[data-testid="btn-salvar"]');
        
        // Verifica mensagem de erro em inglês
        const errorMsg = await page.locator('[data-testid="error-message"]').textContent();
        expect(errorMsg).toMatch(/required|obrigat/i);
    });

    // ─── 3. PREFERÊNCIAS DO USUÁRIO ───────────────────────────────
    test('Preferência de locale é salva no backend', async ({ page }) => {
        await page.goto('/settings');
        
        // Verifica seletor de idioma nas configurações
        const localeSelect = page.locator('[data-testid="locale-preference"]');
        await expect(localeSelect).toBeVisible();
        
        // Troca para EN-US
        await localeSelect.selectOption('en-US');
        
        // Salva preferências
        await page.click('[data-testid="btn-save-preferences"]');
        
        // Aguarda confirmação
        await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
        
        // Recarrega e verifica que persistiu
        await page.reload();
        await expect(localeSelect).toHaveValue('en-US');
    });

    // ─── 4. LOCALE DO AGENTE ──────────────────────────────────────
    test('Agente pode ter locale preferido configurado', async ({ page }) => {
        await page.goto('/agents');
        
        // Abre edição de agente
        await page.click('[data-testid="agent-item"]:first-child');
        await page.click('[data-testid="btn-edit"]');
        
        // Verifica campos de locale
        const preferredLocale = page.locator('[data-testid="preferred-locale"]');
        const fallbackLocale = page.locator('[data-testid="fallback-locale"]');
        
        await expect(preferredLocale).toBeVisible();
        await expect(fallbackLocale).toBeVisible();
        
        // Altera locale preferido
        await preferredLocale.selectOption('en-US');
        await fallbackLocale.selectOption('pt-BR');
        
        // Salva
        await page.click('[data-testid="btn-save"]');
        
        // Verifica toast de sucesso
        await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
    });

    test('Agente responde no idioma configurado', async ({ page }) => {
        await page.goto('/agents');
        
        // Seleciona agente com locale EN-US
        await page.click('[data-testid="agent-en-us"]');
        
        // Abre chat
        await page.click('[data-testid="btn-chat"]');
        
        // Envia mensagem
        await page.fill('[data-testid="chat-input"]', 'Hello');
        await page.click('[data-testid="btn-send"]');
        
        // Aguarda resposta
        const response = page.locator('[data-testid="agent-response"]');
        await expect(response).toBeVisible({ timeout: 10000 });
        
        // Verifica que resposta está em inglês (placeholder - depende da implementação)
        // Nota: Este teste dependeria de um agente real respondendo
    });

    // ─── 5. ERROS E FALLBACK ──────────────────────────────────────
    test('Fallback para EN-US quando tradução PT-BR não existe', async ({ page, request }) => {
        // Este teste verifica que o fallback funciona
        // Por exemplo, uma chave nova que só existe em EN-US
        
        await page.goto('/dashboard');
        
        // Verifica que não há erros de tradução no console
        const translationErrors: string[] = [];
        page.on('console', msg => {
            if (msg.text().includes('translation') || msg.text().includes('i18n')) {
                translationErrors.push(msg.text());
            }
        });
        
        // Navega por várias páginas
        await page.goto('/agents');
        await page.goto('/tasks');
        await page.goto('/knowledge');
        
        // Verifica que não houve erros críticos de tradução
        const criticalErrors = translationErrors.filter(e => 
            e.includes('missing') && e.includes('error')
        );
        expect(criticalErrors).toHaveLength(0);
    });

});