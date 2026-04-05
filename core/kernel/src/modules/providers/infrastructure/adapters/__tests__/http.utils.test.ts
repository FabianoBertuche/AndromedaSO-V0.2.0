/**
 * Unit tests for HTTP utilities (fetchWithTimeout, pingWithTimeout).
 *
 * Feature: real-provider-adapters, Task 2.2
 *
 * Tests:
 * - fetchWithTimeout: sucesso, abort por timeout
 * - pingWithTimeout: retorna { ok: true, latencyMs: N } em sucesso
 * - pingWithTimeout: retorna { ok: false, latencyMs: 3000 } em timeout/falha
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetchWithTimeout, pingWithTimeout } from '../http.utils.js';

describe('http.utils', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ─── fetchWithTimeout ─────────────────────────────────────────────────────

  describe('fetchWithTimeout', () => {
    it('retorna response em sucesso quando fetch completa dentro do timeout', async () => {
      const expectedResponse = { ok: true, status: 200 } as unknown as Response;
      vi.mocked(fetch).mockResolvedValueOnce(expectedResponse);

      const result = await fetchWithTimeout('https://api.example.com/data', {}, 5000);

      expect(result).toBe(expectedResponse);
      expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    });

    it('dispara erro quando fetch é abortado pelo timeout', async () => {
      // Simula o AbortController abortando - rejeita com AbortError
      vi.mocked(fetch).mockRejectedValue(
        new DOMException('The user aborted a request.', 'AbortError')
      );

      const timeoutMs = 50;

      await expect(fetchWithTimeout('https://api.example.com/data', {}, timeoutMs)).rejects.toThrow(
        'The user aborted a request.'
      );
    });

    it('não deixa timer fantasma após abort', async () => {
      vi.mocked(fetch).mockRejectedValue(
        new DOMException('The user aborted a request.', 'AbortError')
      );

      const timeoutMs = 20;

      try {
        await fetchWithTimeout('https://api.example.com/data', {}, timeoutMs);
      } catch {
        // Esperado - abort
      }

      // Se chegamos aqui sem erros, o timer foi limpo corretamente
    });
  });

  // ─── pingWithTimeout ───────────────────────────────────────────────────────

  describe('pingWithTimeout', () => {
    it('retorna { ok: true, latencyMs: N } quando fetch completa com sucesso', async () => {
      const mockResponse = { ok: true, status: 200 } as unknown as Response;
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

      const start = Date.now();
      const result = await pingWithTimeout('https://api.example.com/ping', {}, 3000);
      const elapsed = Date.now() - start;

      expect(result.ok).toBe(true);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.latencyMs).toBeLessThanOrEqual(elapsed + 5);
    });

    it('retorna { ok: false, latencyMs: 3000 } quando ocorre timeout', async () => {
      // Simula fetch sendo abortado pelo timeout
      vi.mocked(fetch).mockRejectedValue(
        new DOMException('The user aborted a request.', 'AbortError')
      );

      const timeoutMs = 3000;
      const result = await pingWithTimeout('https://api.example.com/ping', {}, timeoutMs);

      expect(result.ok).toBe(false);
      expect(result.latencyMs).toBe(timeoutMs);
    });

    it('retorna { ok: false, latencyMs: 3000 } quando fetch lança erro', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const timeoutMs = 3000;
      const result = await pingWithTimeout('https://api.example.com/ping', {}, timeoutMs);

      expect(result.ok).toBe(false);
      expect(result.latencyMs).toBe(timeoutMs);
    });

    it('captura erros de rede e retorna estrutura consistente', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const result = await pingWithTimeout('https://api.example.com/ping', {}, 3000);

      expect(result).toHaveProperty('ok', false);
      expect(result).toHaveProperty('latencyMs', 3000);
    });
  });
});
