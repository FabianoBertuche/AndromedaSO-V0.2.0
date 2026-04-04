import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import { moduleRoutes } from './api/moduleRoutes.js';
import { evolutionRoutes } from './api/evolutionRoutes.js';
import { orchestratorRoutes } from './routes/orchestratorRoutes.js';
import { llmRouterRoutes, providerRoutes } from './modules/providers/routes/providerRoutes.js';
import { metrics } from './config/metrics.js';
import { ModuleRegistryService } from './registry/moduleRegistry.js';
import { validateEnvironment } from './config/validateEnvironment.js';

export async function buildServer(logger = true) {
  await validateEnvironment();
  const server = Fastify({ logger });
  const runtimeRegistry = new ModuleRegistryService();

  // Add correlation ID hook at root level so it applies to all routes
  server.decorateRequest('correlationId', '');
  server.addHook('onRequest', async (request, reply) => {
    const MAX_CORRELATION_ID_LENGTH = 128;
    const incoming = request.headers['x-correlation-id'];
    let correlationId: string;
    if (!incoming || incoming === '') {
      correlationId = randomUUID();
    } else if (typeof incoming === 'string' && incoming.length <= MAX_CORRELATION_ID_LENGTH) {
      correlationId = incoming;
    } else {
      correlationId = randomUUID();
    }
    (request as any).correlationId = correlationId;
    reply.header('x-correlation-id', correlationId);
  });
  server.get('/health', async () => ({ status: 'ok', server: 'core-kernel' }));
  server.get('/api/health', async () => ({ status: 'ok', server: 'core-kernel' }));
  server.get('/status', async () => {
    const modules = runtimeRegistry.list();
    const activeModules = modules.filter((m) => m.state === 'running').map((m) => m.id);
    const metricSnapshot = metrics.getMetrics();

    return {
      status: 'healthy',
      registrySize: modules.length,
      activeModules,
      metrics: {
        retry_storm_total: metricSnapshot.prometheus.retry_storm_total
      }
    };
  });
  server.get('/api/status', async () => {
    const modules = runtimeRegistry.list();
    const activeModules = modules.filter((m) => m.state === 'running').map((m) => m.id);
    const metricSnapshot = metrics.getMetrics();

    return {
      status: 'healthy',
      registrySize: modules.length,
      activeModules,
      metrics: {
        retry_storm_total: metricSnapshot.prometheus.retry_storm_total
      }
    };
  });
  server.register(moduleRoutes as any, { prefix: '/api', registry: runtimeRegistry });
  server.register(providerRoutes, { prefix: '/api/providers' });
  server.register(llmRouterRoutes, { prefix: '/api/llm-router' });
  server.register(evolutionRoutes);
  server.register(orchestratorRoutes);
  return server;
}
