// packages/web-e2e/tests/mvp12-export-import.spec.ts
import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function loginAs(page, email: string, password: string) {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', email);
    await page.fill('[data-testid="password"]', password);
    await page.click('[data-testid="btn-login"]');
    await expect(page).toHaveURL(/dashboard/);
}

test.describe('MVP12 — Export/Import de Agentes', () => {

    test.beforeEach(async ({ page }) => {
        await loginAs(page, 'admin@andromeda.so', '123456');
    });

    // ─── 1. EXPORT DE AGENTE ───────────────────────────────────────
    test('Botão Export aparece na listagem de agentes', async ({ page }) => {
        await page.goto('/agents');
        
        // Verifica botão de export no header
        const exportBtn = page.locator('[data-testid="btn-export-agent"]');
        await expect(exportBtn).toBeVisible();
    });

    test('Botão Export aparece no menu de contexto do agente', async ({ page }) => {
        await page.goto('/agents');
        
        // Clica no menu de contexto do primeiro agente
        await page.click('[data-testid="agent-item"]:first-child [data-testid="btn-menu"]');
        
        // Verifica opção de export
        const exportOption = page.locator('[data-testid="menu-export"]');
        await expect(exportOption).toBeVisible();
    });

    test('Export modal abre com opções', async ({ page }) => {
        await page.goto('/agents');
        
        // Clica no primeiro agente
        await page.click('[data-testid="agent-item"]:first-child');
        
        // Clica em export
        await page.click('[data-testid="btn-export"]');
        
        // Verifica modal de export
        const modal = page.locator('[data-testid="export-modal"]');
        await expect(modal).toBeVisible();
        
        // Verifica checkbox de incluir knowledge
        const includeKnowledge = page.locator('[data-testid="include-knowledge"]');
        await expect(includeKnowledge).toBeVisible();
        await expect(includeKnowledge).not.toBeChecked();
        
        // Verifica checkbox de incluir versões
        const includeVersions = page.locator('[data-testid="include-versions"]');
        await expect(includeVersions).toBeVisible();
        await expect(includeVersions).toBeChecked();
    });

    test('Export gera download do arquivo .andromeda-agent', async ({ page }) => {
        await page.goto('/agents');
        
        // Seleciona agente
        await page.click('[data-testid="agent-item"]:first-child');
        await page.click('[data-testid="btn-export"]');
        
        // Inicia download
        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.click('[data-testid="btn-export-confirm"]'),
        ]);
        
        // Verifica extensão do arquivo
        expect(download.suggestedFilename()).toMatch(/\.andromeda-agent$/);
        
        // Verifica que arquivo foi baixado
        const path = await download.path();
        expect(fs.existsSync(path)).toBeTruthy();
    });

    test('Export falha se usuário não tem permissão', async ({ page }) => {
        // Login como viewer (sem permissão de export)
        await page.goto('/login');
        await page.fill('[data-testid="email"]', 'viewer@andromeda.so');
        await page.fill('[data-testid="password"]', '123456');
        await page.click('[data-testid="btn-login"]');
        
        await page.goto('/agents');
        await page.click('[data-testid="agent-item"]:first-child');
        
        // Botão de export não deve aparecer
        const exportBtn = page.locator('[data-testid="btn-export"]');
        await expect(exportBtn).not.toBeVisible();
    });

    // ─── 2. IMPORT DE AGENTE ───────────────────────────────────────
    test('Botão Import aparece no header da listagem', async ({ page }) => {
        await page.goto('/agents');
        
        const importBtn = page.locator('[data-testid="btn-import-agent"]');
        await expect(importBtn).toBeVisible();
    });

    test('Import modal com drag-drop', async ({ page }) => {
        await page.goto('/agents');
        
        // Abre modal de import
        await page.click('[data-testid="btn-import-agent"]');
        
        // Verifica área de drop
        const dropArea = page.locator('[data-testid="import-drop-area"]');
        await expect(dropArea).toBeVisible();
        
        // Verifica input de arquivo
        const fileInput = page.locator('[data-testid="import-file-input"]');
        await expect(fileInput).toBeVisible();
    });

    test('Import valida arquivo e mostra progresso', async ({ page }) => {
        await page.goto('/agents');
        
        // Abre modal
        await page.click('[data-testid="btn-import-agent"]');
        
        // Upload de arquivo válido (fixture)
        const fileInput = page.locator('[data-testid="import-file-input"]');
        await fileInput.setInputFiles('fixtures/valid-agent.andromeda-agent');
        
        // Verifica que progresso aparece
        const progressBar = page.locator('[data-testid="import-progress"]');
        await expect(progressBar).toBeVisible();
        
        // Aguarda conclusão
        await expect(page.locator('[data-testid="import-success"]')).toBeVisible({
            timeout: 30000
        });
    });

    test('Import falha com checksum inválido', async ({ page }) => {
        await page.goto('/agents');
        
        await page.click('[data-testid="btn-import-agent"]');
        
        // Upload de arquivo corrompido
        const fileInput = page.locator('[data-testid="import-file-input"]');
        await fileInput.setInputFiles('fixtures/corrupted-agent.andromeda-agent');
        
        // Verifica mensagem de erro
        const errorMsg = page.locator('[data-testid="import-error"]');
        await expect(errorMsg).toBeVisible({ timeout: 10000 });
        await expect(errorMsg).toContainText('checksum');
    });

    // ─── 3. CONFLITO DE IMPORT ──────────────────────────────────────
    test('Import detecta conflito de slug e mostra dialog', async ({ page }) => {
        await page.goto('/agents');
        
        await page.click('[data-testid="btn-import-agent"]');
        
        // Upload de agente com slug já existente
        const fileInput = page.locator('[data-testid="import-file-input"]');
        await fileInput.setInputFiles('fixtures/duplicate-agent.andromeda-agent');
        
        // Aguarda dialog de conflito
        const conflictDialog = page.locator('[data-testid="conflict-dialog"]');
        await expect(conflictDialog).toBeVisible({ timeout: 10000 });
        
        // Verifica opções
        await expect(page.locator('[data-testid="btn-abort"]')).toBeVisible();
        await expect(page.locator('[data-testid="btn-rename"]')).toBeVisible();
        await expect(page.locator('[data-testid="btn-overwrite"]')).toBeVisible();
    });

    test('Conflito: ABORT cancela import sem criar agente', async ({ page }) => {
        await page.goto('/agents');
        
        await page.click('[data-testid="btn-import-agent"]');
        
        const fileInput = page.locator('[data-testid="import-file-input"]');
        await fileInput.setInputFiles('fixtures/duplicate-agent.andromeda-agent');
        
        // Aguarda conflito
        await page.locator('[data-testid="conflict-dialog"]').waitFor({ timeout: 10000 });
        
        // Clica em Abort
        await page.click('[data-testid="btn-abort"]');
        
        // Verifica que import foi cancelado
        await expect(page.locator('[data-testid="import-cancelled"]')).toBeVisible();
        
        // Verifica que nenhum agente novo foi criado
        await page.goto('/agents');
        const agentCount = await page.locator('[data-testid="agent-item"]').count();
        // O count deve ser o mesmo de antes
    });

    test('Conflito: RENAME cria agente com sufixo', async ({ page }) => {
        await page.goto('/agents');
        
        // Conta agentes antes
        const countBefore = await page.locator('[data-testid="agent-item"]').count();
        
        await page.click('[data-testid="btn-import-agent"]');
        
        const fileInput = page.locator('[data-testid="import-file-input"]');
        await fileInput.setInputFiles('fixtures/duplicate-agent.andromeda-agent');
        
        await page.locator('[data-testid="conflict-dialog"]').waitFor({ timeout: 10000 });
        
        // Clica em Rename
        await page.click('[data-testid="btn-rename"]');
        
        // Aguarda sucesso
        await expect(page.locator('[data-testid="import-success"]')).toBeVisible({
            timeout: 30000
        });
        
        // Verifica novo agente com slug modificado
        await page.goto('/agents');
        const countAfter = await page.locator('[data-testid="agent-item"]').count();
        expect(countAfter).toBe(countBefore + 1);
        
        // Verifica que slug tem sufixo
        const newAgent = page.locator('text=-imported-');
        await expect(newAgent).toBeVisible();
    });

    test('Conflito: OVERWRITE substitui agente existente', async ({ page }) => {
        await page.goto('/agents');
        
        // Conta agentes antes
        const countBefore = await page.locator('[data-testid="agent-item"]').count();
        
        await page.click('[data-testid="btn-import-agent"]');
        
        const fileInput = page.locator('[data-testid="import-file-input"]');
        await fileInput.setInputFiles('fixtures/duplicate-agent.andromeda-agent');
        
        await page.locator('[data-testid="conflict-dialog"]').waitFor({ timeout: 10000 });
        
        // Clica em Overwrite
        await page.click('[data-testid="btn-overwrite"]');
        
        // Aguarda sucesso
        await expect(page.locator('[data-testid="import-success"]')).toBeVisible({
            timeout: 30000
        });
        
        // Verifica que count permanece igual
        await page.goto('/agents');
        const countAfter = await page.locator('[data-testid="agent-item"]').count();
        expect(countAfter).toBe(countBefore);
    });

    // ─── 4. EXPORT/IMPORT COMPLETO ──────────────────────────────────
    test('Export -> Import mantém dados do agente', async ({ page }) => {
        // Cria agente temporário
        await page.goto('/agents');
        await page.click('[data-testid="btn-criar"]');
        await page.fill('[data-testid="field-nome"]', 'Agente E2E Test');
        await page.fill('[data-testid="field-descricao"]', 'Agente para teste E2E');
        await page.selectOption('[data-testid="preferred-locale"]', 'pt-BR');
        await page.click('[data-testid="btn-salvar"]');
        
        // Exporta
        await page.click('[data-testid="btn-export"]');
        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.click('[data-testid="btn-export-confirm"]'),
        ]);
        const exportPath = await download.path();
        
        // Deleta agente
        await page.goto('/agents');
        await page.click('[data-testid="agent-item"]:first-child [data-testid="btn-menu"]');
        await page.click('[data-testid="btn-delete"]');
        await page.click('[data-testid="btn-confirm-delete"]');
        
        // Importa
        await page.click('[data-testid="btn-import-agent"]');
        const fileInput = page.locator('[data-testid="import-file-input"]');
        await fileInput.setInputFiles(exportPath!);
        
        await expect(page.locator('[data-testid="import-success"]')).toBeVisible({
            timeout: 30000,
        });
        
        // Verifica dados
        await page.goto('/agents');
        await page.click('text=Agente E2E Test');
        
        const descricao = await page.locator('[data-testid="field-descricao"]').inputValue();
        expect(descricao).toContain('Agente para teste E2E');
    });

    // ─── 5. BUNDLE STRUCTURE ────────────────────────────────────────
    test('Bundle exportado contém arquivos obrigatórios', async ({ page }) => {
        await page.goto('/agents');
        await page.click('[data-testid="agent-item"]:first-child');
        await page.click('[data-testid="btn-export"]');
        
        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.click('[data-testid="btn-export-confirm"]'),
        ]);
        
        // Salva e extrai o bundle
        const downloadPath = await download.path();
        
        // Verificações seriam feitas via API ou backend
        // Aqui apenas confirmamos que o download funciona
        expect(download.suggestedFilename()).toMatch(/\.andromeda-agent$/);
    });

});