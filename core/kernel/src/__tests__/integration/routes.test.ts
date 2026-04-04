import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

// Mock validateEnvironment para não tentar conectar ao banco nos testes
vi.mock('../../config/validateEnvironment.js', () => ({
  validateEnvironment: vi.fn().mockResolvedValue(undefined)
}));

// Mock postgresRegistry para evitar importação do schema drizzle-orm-pg
vi.mock('../../store/postgresRegistry.js', () => ({
  registerModule: vi.fn().mockResolvedValue([]),
  getModuleById: vi.fn().mockResolvedValue([]),
  persistLifecycleEvent: vi.fn().mockResolvedValue([]),
  persistValidationDecision: vi.fn().mockResolvedValue([])
}));

import { buildServer } from '../../server.js';

/**
 * Validates: Requirements 10.4
 * Integration tests for HTTP routes
 */

let server: Awaited<ReturnType<typeof buildServer>>;

beforeAll(async () => {
  server = await buildServer(false); // false = sem logger
  await server.ready();
});

afterAll(async () => {
  await server.close();
});

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const response = await server.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.status).toBe('ok');
  });
});

describe('GET /api/health', () => {
  it('returns 200', async () => {
    const response = await server.inject({ method: 'GET', url: '/api/health' });
    expect(response.statusCode).toBe(200);
  });
});

describe('GET /api/providers', () => {
  it('returns 200 with providers array', async () => {
    const response = await server.inject({ method: 'GET', url: '/api/providers' });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveProperty('providers');
    expect(Array.isArray(body.providers)).toBe(true);
  });
});

describe('POST /api/providers', () => {
  it('returns 201 with id and name when body is valid', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/providers',
      payload: { type: 'openai', name: 'test-openai' }
    });
    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('name');
  });

  it('returns 400 when body is missing', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/providers',
      payload: {}
    });
    expect(response.statusCode).toBe(400);
  });
});

describe('POST /tasks/multi', () => {
  it('returns 200 with taskId and subtasks when body is valid', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/tasks/multi',
      payload: { task: 'build a landing page' }
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveProperty('taskId');
    expect(body).toHaveProperty('subtasks');
  });

  it('returns 400 when body is missing task', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/tasks/multi',
      payload: {}
    });
    expect(response.statusCode).toBe(400);
  });
});

describe('x-correlation-id header', () => {
  it('is present on GET /health', async () => {
    const response = await server.inject({ method: 'GET', url: '/health' });
    expect(response.headers['x-correlation-id']).toBeDefined();
  });

  it('is present on GET /api/health', async () => {
    const response = await server.inject({ method: 'GET', url: '/api/health' });
    expect(response.headers['x-correlation-id']).toBeDefined();
  });

  it('is present on GET /api/providers', async () => {
    const response = await server.inject({ method: 'GET', url: '/api/providers' });
    expect(response.headers['x-correlation-id']).toBeDefined();
  });

  it('is present on POST /tasks/multi', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/tasks/multi',
      payload: { task: 'build a landing page' }
    });
    expect(response.headers['x-correlation-id']).toBeDefined();
  });
});
