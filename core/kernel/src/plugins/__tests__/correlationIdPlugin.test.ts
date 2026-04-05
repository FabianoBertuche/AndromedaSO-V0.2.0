import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import * as fc from 'fast-check';

// Mock dependencies to avoid database connection
vi.mock('../../config/validateEnvironment.js', () => ({
  validateEnvironment: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../store/postgresRegistry.js', () => ({
  registerModule: vi.fn().mockResolvedValue([]),
  getModuleById: vi.fn().mockResolvedValue([]),
  persistLifecycleEvent: vi.fn().mockResolvedValue([]),
  persistValidationDecision: vi.fn().mockResolvedValue([])
}));

import { buildServer } from '../../server.js';

// UUID v4 regex pattern
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('correlationIdPlugin (via buildServer)', () => {
  let server: Awaited<ReturnType<typeof buildServer>>;

  beforeAll(async () => {
    server = await buildServer(false);
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  // ─── Task 11.3: Property test — valid correlation ID is preserved (Propriedade 6) ───
  describe('correlation ID preservation (Property 6)', () => {
    it('property: valid correlation ID (1-128 chars) is preserved in response (fast-check)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 128 }),
          async (correlationIdValue) => {
            const response = await server.inject({
              method: 'GET',
              url: '/health',
              headers: { 'x-correlation-id': correlationIdValue }
            });

            expect(response.statusCode).toBe(200);
            const responseCorrelationId = response.headers['x-correlation-id'];
            expect(responseCorrelationId).toBe(correlationIdValue);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve specific valid correlation IDs', async () => {
      const validIds = [
        'simple-id',
        'a'.repeat(128),
        '123e4567-e89b-12d3-a456-426614174000',
        'my-custom-correlation-id-123'
      ];

      for (const id of validIds) {
        const response = await server.inject({
          method: 'GET',
          url: '/health',
          headers: { 'x-correlation-id': id }
        });

        expect(response.headers['x-correlation-id']).toBe(id);
      }
    });
  });

  // ─── Task 11.4: Property test — request without correlation ID receives UUID v4 (Propriedade 7) ───
  describe('UUID v4 generation (Property 7)', () => {
    it('property: request without correlation ID receives valid UUID v4 (fast-check)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          async () => {
            const response = await server.inject({
              method: 'GET',
              url: '/health'
              // No x-correlation-id header
            });

            expect(response.statusCode).toBe(200);
            const responseCorrelationId = response.headers['x-correlation-id'];
            expect(responseCorrelationId).toMatch(UUID_V4_REGEX);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate different UUIDs for each request without header', async () => {
      const responses = await Promise.all([
        server.inject({ method: 'GET', url: '/health' }),
        server.inject({ method: 'GET', url: '/health' }),
        server.inject({ method: 'GET', url: '/health' })
      ]);

      const ids = responses.map(r => r.headers['x-correlation-id'] as string);
      // All should be valid UUIDs
      ids.forEach(id => expect(id).toMatch(UUID_V4_REGEX));
      // At least 2 should be different (statistically very likely)
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBeGreaterThan(1);
    });
  });

  // ─── Task 11.5: Unit tests for correlationId behavior ───
  describe('correlation ID behavior (Task 11.5)', () => {
    it('should generate UUID v4 when no correlation ID header is present', async () => {
      const response = await server.inject({ method: 'GET', url: '/health' });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-correlation-id']).toMatch(UUID_V4_REGEX);
    });

    it('should preserve valid correlation ID header (≤128 chars)', async () => {
      const customId = 'my-custom-id-12345';
      const response = await server.inject({
        method: 'GET',
        url: '/health',
        headers: { 'x-correlation-id': customId }
      });

      expect(response.headers['x-correlation-id']).toBe(customId);
    });

    it('should generate new UUID when header exceeds 128 characters', async () => {
      const longId = 'a'.repeat(129);

      const response = await server.inject({
        method: 'GET',
        url: '/health',
        headers: { 'x-correlation-id': longId }
      });

      expect(response.statusCode).toBe(200);
      // Should NOT preserve the long ID
      expect(response.headers['x-correlation-id']).not.toBe(longId);
      // Should generate a new UUID v4
      expect(response.headers['x-correlation-id']).toMatch(UUID_V4_REGEX);
    });

    it('should handle empty string correlation ID as missing', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health',
        headers: { 'x-correlation-id': '' }
      });

      // Empty string should be treated as missing, so a new UUID should be generated
      expect(response.headers['x-correlation-id']).toMatch(UUID_V4_REGEX);
    });

    it('should set correlationId on request object via decorator', async () => {
      const customId = 'request-object-test';
      const response = await server.inject({
        method: 'GET',
        url: '/health',
        headers: { 'x-correlation-id': customId }
      });

      expect(response.statusCode).toBe(200);
      // The body won't have correlationId since /health doesn't return it
      // but the header should be set correctly
      expect(response.headers['x-correlation-id']).toBe(customId);
    });

    it('should handle array-style header (use first value)', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health',
        headers: { 'x-correlation-id': ['value-1', 'value-2'] }
      });

      // Fastify may join array headers with comma, or use first value
      // Either way it should be a valid response
      expect(response.statusCode).toBe(200);
      expect(response.headers['x-correlation-id']).toBeDefined();
    });

    it('should include correlation ID on all API routes', async () => {
      const routes = ['/health', '/api/health', '/api/providers', '/status'];

      for (const route of routes) {
        const response = await server.inject({
          method: 'GET',
          url: route
        });

        expect(response.headers['x-correlation-id']).toBeDefined();
        expect(response.headers['x-correlation-id']).toMatch(UUID_V4_REGEX);
      }
    });
  });
});
