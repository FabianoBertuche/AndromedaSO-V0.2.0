import Fastify from 'fastify';
import { moduleRoutes } from './api/moduleRoutes';

export function buildServer(logger = true) {
  const server = Fastify({ logger });
  server.get('/health', async () => ({ status: 'ok', server: 'core-kernel' }));
  server.register(moduleRoutes, { prefix: '/api' });
  return server;
}
