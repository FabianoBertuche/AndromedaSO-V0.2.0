// packages/web-e2e/tests/mvp12-cli.spec.ts
// Testes E2E para CLI via subprocess
// Estes testes requerem que os comandos CLI estejam instalados

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const CLI_PATH = path.join(__dirname, '../../cli/dist/index.js');
const FIXTURES_PATH = path.join(__dirname, 'fixtures');

test.describe('MVP12 — CLI Export/Import', () => {
  
  test.beforeAll(() => {
    // Garante que CLI está compilado
    if (!fs.existsSync(CLI_PATH)) {
      console.log('CLI não compilado, compilando...');
      execSync('npm run build', { cwd: path.join(__dirname, '../../cli') });
    }
  });

  // ─── 1. COMANDO I18N LOCALES ─────────────────────────────────────
  test('andromeda i18n locales lista locales disponíveis', () => {
    const result = execSync(`npx andromeda i18n locales`, {
      encoding: 'utf-8',
      env: { ...process.env, ANDROMEDA_API_URL: 'http://localhost:3000' }
    });
    
    expect(result).toContain('pt-BR');
    expect(result).toContain('en-US');
  });

  test('andromeda i18n seed popula mensagens', () => {
    const result = execSync(`npx andromeda i18n seed --locale pt-BR`, {
      encoding: 'utf-8',
      env: { ...process.env, ANDROMEDA_API_URL: 'http://localhost:3000' }
    });
    
    expect(result).toContain('seed');
    expect(result).toContain('sucesso');
  });

  // ─── 2. COMANDO AGENTS EXPORT ───────────────────────────────────
  test('andromeda agents export <id> gera arquivo .andromeda-agent', () => {
    const outputPath = path.join(FIXTURES_PATH, 'test-export.andromeda-agent');
    
    const result = execSync(
      `npx andromeda agents export test-agent-001 --output "${outputPath}"`,
      {
        encoding: 'utf-8',
        env: { ...process.env, ANDROMEDA_API_URL: 'http://localhost:3000' }
      }
    );
    
    // Verifica mensagem de sucesso
    expect(result).toContain('Exportado');
    expect(result).toContain('test-agent-001');
    
    // Verifica que arquivo foi criado
    expect(fs.existsSync(outputPath)).toBeTruthy();
    
    // Verifica extensão
    expect(outputPath).toMatch(/\.andromeda-agent$/);
    
    // Cleanup
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
  });

  test('andromeda agents export --include-knowledge inclui knowledge', () => {
    const outputPath = path.join(FIXTURES_PATH, 'test-export-with-knowledge.andromeda-agent');
    
    const result = execSync(
      `npx andromeda agents export test-agent-001 --include-knowledge --output "${outputPath}"`,
      {
        encoding: 'utf-8',
        env: { ...process.env, ANDROMEDA_API_URL: 'http://localhost:3000' }
      }
    );
    
    expect(result).toContain('knowledge');
    
    // Cleanup
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
  });

  test('andromeda agents export falha para agente inexistente', () => {
    let error: Error | null = null;
    
    try {
      execSync(`npx andromeda agents export non-existent-agent-id`, {
        encoding: 'utf-8',
        stdio: 'pipe',
        env: { ...process.env, ANDROMEDA_API_URL: 'http://localhost:3000' }
      });
    } catch (e) {
      error = e as Error;
    }
    
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/não encontrado|not found/i);
  });

  // ─── 3. COMANDO AGENTS IMPORT ───────────────────────────────────
  test('andromeda agents import cria agente válido', () => {
    // Primeiro exporta um agente
    const exportPath = path.join(FIXTURES_PATH, 'valid-import-test.andromeda-agent');
    execSync(
      `npx andromeda agents export test-agent-001 --output "${exportPath}"`,
      {
        encoding: 'utf-8',
        env: { ...process.env, ANDROMEDA_API_URL: 'http://localhost:3000' }
      }
    );
    
    // Depois importa
    const result = execSync(
      `npx andromeda agents import "${exportPath}" --conflict abort`,
      {
        encoding: 'utf-8',
        env: { ...process.env, ANDROMEDA_API_URL: 'http://localhost:3000' }
      }
    );
    
    expect(result).toContain('sucesso');
    expect(result).toMatch(/agente.*criado/i);
    
    // Cleanup
    if (fs.existsSync(exportPath)) {
      fs.unlinkSync(exportPath);
    }
  });

  test('andromeda agents import detecta conflito com conflict=abort', () => {
    // Exporta agente existente
    const exportPath = path.join(FIXTURES_PATH, 'conflict-test.andromeda-agent');
    execSync(
      `npx andromeda agents export existing-agent --output "${exportPath}"`,
      {
        encoding: 'utf-8',
        env: { ...process.env, ANDROMEDA_API_URL: 'http://localhost:3000' }
      }
    );
    
    // Tenta importar com mesmo slug
    const result = execSync(
      `npx andromeda agents import "${exportPath}" --conflict abort`,
      {
        encoding: 'utf-8',
        env: { ...process.env, ANDROMEDA_API_URL: 'http://localhost:3000' }
      }
    );
    
    expect(result).toContain('conflito');
    expect(result).toContain('abortado');
    
    // Cleanup
    if (fs.existsSync(exportPath)) {
      fs.unlinkSync(exportPath);
    }
  });

  test('andromeda agents import resolve conflito com conflict=rename', () => {
    const exportPath = path.join(FIXTURES_PATH, 'rename-test.andromeda-agent');
    execSync(
      `npx andromeda agents export existing-agent --output "${exportPath}"`,
      {
        encoding: 'utf-8',
        env: { ...process.env, ANDROMEDA_API_URL: 'http://localhost:3000' }
      }
    );
    
    const result = execSync(
      `npx andromeda agents import "${exportPath}" --conflict rename`,
      {
        encoding: 'utf-8',
        env: { ...process.env, ANDROMEDA_API_URL: 'http://localhost:3000' }
      }
    );
    
    expect(result).toContain('-imported');
    expect(result).toContain('sucesso');
    
    // Cleanup
    if (fs.existsSync(exportPath)) {
      fs.unlinkSync(exportPath);
    }
  });

  test('andromeda agents import resolve conflito com conflict=overwrite', () => {
    const exportPath = path.join(FIXTURES_PATH, 'overwrite-test.andromeda-agent');
    execSync(
      `npx andromeda agents export existing-agent --output "${exportPath}"`,
      {
        encoding: 'utf-8',
        env: { ...process.env, ANDROMEDA_API_URL: 'http://localhost:3000' }
      }
    );
    
    const result = execSync(
      `npx andromeda agents import "${exportPath}" --conflict overwrite`,
      {
        encoding: 'utf-8',
        env: { ...process.env, ANDROMEDA_API_URL: 'http://localhost:3000' }
      }
    );
    
    expect(result).toContain('substituído');
    
    // Cleanup
    if (fs.existsSync(exportPath)) {
      fs.unlinkSync(exportPath);
    }
  });

  test('andromeda agents import falha com arquivo corrompido', () => {
    const corruptPath = path.join(FIXTURES_PATH, 'corrupt.andromeda-agent');
    fs.writeFileSync(corruptPath, 'not a valid zip file');
    
    let error: Error | null = null;
    
    try {
      execSync(`npx andromeda agents import "${corruptPath}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
        env: { ...process.env, ANDROMEDA_API_URL: 'http://localhost:3000' }
      });
    } catch (e) {
      error = e as Error;
    }
    
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/checksum|inválido|inválido/i);
    
    // Cleanup
    if (fs.existsSync(corruptPath)) {
      fs.unlinkSync(corruptPath);
    }
  });

  // ─── 4. INTEGRIDADE DO BUNDLE ────────────────────────────────────
  test('Bundle exportado contém manifest.json', () => {
    const exportPath = path.join(FIXTURES_PATH, 'bundle-test.andromeda-agent');
    
    execSync(
      `npx andromeda agents export test-agent-001 --output "${exportPath}"`,
      {
        encoding: 'utf-8',
        env: { ...process.env, ANDROMEDA_API_URL: 'http://localhost:3000' }
      }
    );
    
    // Extrai e verifica estrutura
    const extractDir = path.join(FIXTURES_PATH, 'extracted');
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true });
    }
    
    execSync(`unzip -o "${exportPath}" -d "${extractDir}"`, { encoding: 'utf-8' });
    
    // Verifica arquivos obrigatórios
    expect(fs.existsSync(path.join(extractDir, 'manifest.json'))).toBeTruthy();
    expect(fs.existsSync(path.join(extractDir, 'profile', 'identity.md'))).toBeTruthy();
    expect(fs.existsSync(path.join(extractDir, 'config.json'))).toBeTruthy();
    
    // Verifica conteúdo do manifest
    const manifest = JSON.parse(
      fs.readFileSync(path.join(extractDir, 'manifest.json'), 'utf-8')
    );
    expect(manifest.schemaVersion).toBe('1.0');
    expect(manifest.agent).toBeDefined();
    expect(manifest.agent.id).toBeDefined();
    expect(manifest.agent.slug).toBeDefined();
    
    // Cleanup
    fs.rmSync(extractDir, { recursive: true, force: true });
    if (fs.existsSync(exportPath)) {
      fs.unlinkSync(exportPath);
    }
  });

});