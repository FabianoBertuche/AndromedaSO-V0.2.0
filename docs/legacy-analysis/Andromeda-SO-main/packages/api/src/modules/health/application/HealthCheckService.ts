import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { loadCognitiveServiceConfig } from '../../cognitive/infrastructure/cognitive-service.config';

export interface ServiceStatus {
  status: 'up' | 'down';
  latencyMs: number;
  error?: string;
}

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'down';
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
    'cognitive-python': ServiceStatus;
    'vector-store': ServiceStatus;
  };
  version: string;
  timestamp: string;
}

export class HealthCheckService {
  private prisma: PrismaClient;
  private redis: Redis;
  private cognitiveConfig = loadCognitiveServiceConfig();

  constructor(prisma: PrismaClient, redis: Redis) {
    this.prisma = prisma;
    this.redis = redis;
  }

  async check(): Promise<HealthCheckResult> {
    const [database, redis, cognitivePython, vectorStore] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkCognitivePython(),
      this.checkVectorStore(),
    ]);

    const services = {
      database,
      redis,
      'cognitive-python': cognitivePython,
      'vector-store': vectorStore,
    };

    const status = this.determineOverallStatus(services);

    return {
      status,
      services,
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', latencyMs: Date.now() - start };
    } catch (error) {
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkRedis(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
      const result = await this.redis.ping();
      if (result === 'PONG') {
        return { status: 'up', latencyMs: Date.now() - start };
      }
      return { status: 'down', latencyMs: Date.now() - start, error: 'Unexpected response' };
    } catch (error) {
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkCognitivePython(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
      const response = await fetch(`${this.cognitiveConfig.baseUrl}/health`, {
        method: 'GET',
        headers: this.cognitiveConfig.authToken
          ? { Authorization: `Bearer ${this.cognitiveConfig.authToken}` }
          : {},
        signal: AbortSignal.timeout(this.cognitiveConfig.timeoutMs),
      });

      if (response.ok) {
        return { status: 'up', latencyMs: Date.now() - start };
      }
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        error: `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkVectorStore(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
      const response = await fetch(`${this.cognitiveConfig.baseUrl}/vector-store/health`, {
        method: 'GET',
        headers: this.cognitiveConfig.authToken
          ? { Authorization: `Bearer ${this.cognitiveConfig.authToken}` }
          : {},
        signal: AbortSignal.timeout(this.cognitiveConfig.timeoutMs),
      });

      if (response.ok) {
        return { status: 'up', latencyMs: Date.now() - start };
      }
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        error: `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private determineOverallStatus(
    services: HealthCheckResult['services']
  ): 'ok' | 'degraded' | 'down' {
    const criticalServices = ['database'] as const;
    const optionalServices = ['redis', 'cognitive-python', 'vector-store'] as const;

    const criticalDown = criticalServices.some(
      (service) => services[service].status === 'down'
    );
    if (criticalDown) {
      return 'down';
    }

    const optionalDown = optionalServices.some(
      (service) => services[service].status === 'down'
    );
    if (optionalDown) {
      return 'degraded';
    }

    return 'ok';
  }
}
