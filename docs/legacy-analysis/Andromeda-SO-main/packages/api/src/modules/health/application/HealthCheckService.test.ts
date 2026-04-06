import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthCheckService } from './HealthCheckService';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

vi.mock('@prisma/client');
vi.mock('ioredis');
vi.mock('../../cognitive/infrastructure/cognitive-service.config', () => ({
  loadCognitiveServiceConfig: () => ({
    baseUrl: 'http://127.0.0.1:8008',
    timeoutMs: 1000,
    authToken: 'test-token',
  }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('HealthCheckService', () => {
  let healthCheckService: HealthCheckService;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: vi.fn(),
    };
    mockRedis = {
      ping: vi.fn(),
    };
    healthCheckService = new HealthCheckService(mockPrisma, mockRedis);
    mockFetch.mockClear();
  });

  it('should return ok when all services are up', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockRedis.ping.mockResolvedValue('PONG');
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const result = await healthCheckService.check();

    expect(result.status).toBe('ok');
    expect(result.services.database.status).toBe('up');
    expect(result.services.redis.status).toBe('up');
    expect(result.version).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });

  it('should return degraded when optional services are down', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockRedis.ping.mockRejectedValue(new Error('Connection refused'));
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const result = await healthCheckService.check();

    expect(result.status).toBe('degraded');
    expect(result.services.database.status).toBe('up');
    expect(result.services.redis.status).toBe('down');
  });

  it('should return down when database is down', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const result = await healthCheckService.check();

    expect(result.status).toBe('down');
    expect(result.services.database.status).toBe('down');
  });

  it('should measure latency for each service', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockRedis.ping.mockResolvedValue('PONG');
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const result = await healthCheckService.check();

    expect(result.services.database.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.services.redis.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('should include error message when service is down', async () => {
    const error = new Error('Connection refused');
    mockPrisma.$queryRaw.mockRejectedValue(error);
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const result = await healthCheckService.check();

    expect(result.services.database.error).toBe('Connection refused');
  });
});
