import { PrismaClient } from '@prisma/client';
import { redisConnection } from '../../shared/redis';
import { HealthCheckService } from './application/HealthCheckService';
import { createHealthRoutes } from './interfaces/http/health.routes';

const prisma = new PrismaClient();
const healthCheckService = new HealthCheckService(prisma, redisConnection);
const healthRouter = createHealthRoutes(healthCheckService);

export {
  healthCheckService,
  healthRouter,
};
