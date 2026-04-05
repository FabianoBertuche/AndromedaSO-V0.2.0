/**
 * Property tests for Ollama adapter.
 *
 * Feature: local-dev-setup, Property 1: Resolução de baseUrl do Ollama adapter
 * Feature: local-dev-setup, Property 2: Fallback de OLLAMA_BASE_URL para env var
 * Feature: real-provider-adapters, Task 6.3 - Propriedade 8: URL dinâmica do Ollama
 *
 * Validates:
 * - Requisito 3.1: Lê OLLAMA_BASE_URL da env quando baseUrl não fornecido
 * - Requisito 3.3: Argumento explícito tem precedência sobre env var
 * - Requisito 8.1: listModels() e ping() usam baseUrl configurado (não hardcoded)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { ollamaAdapterFactory } from '../ollama.adapter.js';

// Helper to generate valid URL strings
const validUrlArb = fc.string({ minLength: 7 }).map((s) => {
  // Ensure it starts with http:// or https://
  const prefix = s.startsWith('http') ? '' : 'http://';
  return prefix + s;
}).filter((s) => {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
});

describe('Ollama Adapter baseUrl Resolution', () => {
  beforeEach(() => {
    // Clear any cached env var before each test
    delete process.env.OLLAMA_BASE_URL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OLLAMA_BASE_URL;
  });

  // Property 1: Argumento explícito tem precedência sobre env var
  describe('Property 1: Argumento explícito tem precedência sobre env var', () => {
    it('deve usar baseUrl explícito independentemente do valor da env var', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUrlArb,
          fc.string({ minLength: 1 }),
          async (explicitUrl, envValue) => {
            // Arrange: set env var to something different
            process.env.OLLAMA_BASE_URL = envValue;

            // Spy on global fetch to capture the URL used
            let capturedUrl: string | null = null;
            const originalFetch = globalThis.fetch;
            globalThis.fetch = vi.fn(async (url: unknown, _init?: RequestInit) => {
              capturedUrl = typeof url === 'string' ? url : url instanceof URL ? url.href : String(url);
              // Return a valid Ollama response structure
              return {
                ok: true,
                json: async () => ({ models: [] }),
              } as Response;
            });

            // Act: create adapter with explicit baseUrl
            const adapter = ollamaAdapterFactory(undefined, explicitUrl);
            await adapter.listModels();

            // Restore fetch
            globalThis.fetch = originalFetch;

            // Assert: captured URL must start with the explicit baseUrl
            expect(capturedUrl).not.toBeNull();
            expect(capturedUrl!.startsWith(explicitUrl)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Property 2: Fallback para env var quando sem argumento explícito
  describe('Property 2: Fallback para env var quando sem argumento explícito', () => {
    it('deve usar OLLAMA_BASE_URL quando baseUrl explícito não fornecido', async () => {
      await fc.assert(
        fc.asyncProperty(
          validUrlArb,
          async (envUrl) => {
            // Arrange: set env var
            process.env.OLLAMA_BASE_URL = envUrl;

            // Spy on global fetch to capture the URL used
            let capturedUrl: string | null = null;
            const originalFetch = globalThis.fetch;
            globalThis.fetch = vi.fn(async (url: unknown, _init?: RequestInit) => {
              capturedUrl = typeof url === 'string' ? url : url instanceof URL ? url.href : String(url);
              return {
                ok: true,
                json: async () => ({ models: [] }),
              } as Response;
            });

            // Act: create adapter WITHOUT explicit baseUrl
            const adapter = ollamaAdapterFactory();
            await adapter.listModels();

            // Restore fetch
            globalThis.fetch = originalFetch;

            // Assert: captured URL must use the env var value
            expect(capturedUrl).not.toBeNull();
            expect(capturedUrl!.startsWith(envUrl)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('deve usar DEFAULT_BASE_URL quando nem explícito nem env fornecido', async () => {
      // Arrange: ensure no env var
      delete process.env.OLLAMA_BASE_URL;

      const DEFAULT_BASE_URL = 'http://127.0.0.1:11434';

      // Spy on global fetch
      let capturedUrl: string | null = null;
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn(async (url: unknown, _init?: RequestInit) => {
        capturedUrl = typeof url === 'string' ? url : url instanceof URL ? url.href : String(url);
        return {
          ok: true,
          json: async () => ({ models: [] }),
        } as Response;
      });

      // Act: create adapter without baseUrl
      const adapter = ollamaAdapterFactory();
      await adapter.listModels();

      // Restore fetch
      globalThis.fetch = originalFetch;

      // Assert: must use default URL
      expect(capturedUrl).not.toBeNull();
      expect(capturedUrl!.startsWith(DEFAULT_BASE_URL)).toBe(true);
    });
  });

  // ─── Property 8: URL dinâmica do Ollama ───────────────────────────────────
  describe('Propriedade 8: URL dinâmica do Ollama', () => {
    it('listModels() usa baseUrl configurado para qualquer URL válida', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webUrl(),
          async (baseUrl) => {
            // Arrange: ensure no env var interference
            delete process.env.OLLAMA_BASE_URL;

            let capturedUrl: string | null = null;
            const originalFetch = globalThis.fetch;
            globalThis.fetch = vi.fn(async (url: unknown) => {
              capturedUrl = typeof url === 'string' ? url : url instanceof URL ? url.href : String(url);
              return {
                ok: true,
                json: async () => ({ models: [] }),
              } as Response;
            });

            // Act
            const adapter = ollamaAdapterFactory(undefined, baseUrl);
            await adapter.listModels();

            // Restore
            globalThis.fetch = originalFetch;

            // Assert: URL must use the configured baseUrl
            expect(capturedUrl).not.toBeNull();
            expect(capturedUrl!.startsWith(baseUrl)).toBe(true);
            expect(capturedUrl!.endsWith('/api/tags')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('ping() usa baseUrl configurado para qualquer URL válida', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webUrl(),
          async (baseUrl) => {
            // Arrange: ensure no env var interference
            delete process.env.OLLAMA_BASE_URL;

            let capturedUrl: string | null = null;
            const originalFetch = globalThis.fetch;
            globalThis.fetch = vi.fn(async (url: unknown) => {
              capturedUrl = typeof url === 'string' ? url : url instanceof URL ? url.href : String(url);
              return {
                ok: true,
                json: async () => ({ models: [] }),
              } as Response;
            });

            // Act
            const adapter = ollamaAdapterFactory(undefined, baseUrl);
            await adapter.ping();

            // Restore
            globalThis.fetch = originalFetch;

            // Assert: URL must use the configured baseUrl
            expect(capturedUrl).not.toBeNull();
            expect(capturedUrl!.startsWith(baseUrl)).toBe(true);
            expect(capturedUrl!.endsWith('/api/tags')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});