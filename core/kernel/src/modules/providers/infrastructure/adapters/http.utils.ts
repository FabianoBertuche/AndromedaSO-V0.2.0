/**
 * Shared HTTP utilities for provider adapters.
 * Uses native fetch and AbortController (Node 20+) — no additional dependencies.
 */

export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function pingWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    await fetchWithTimeout(url, options, timeoutMs);
    return { ok: true, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: timeoutMs };
  }
}
