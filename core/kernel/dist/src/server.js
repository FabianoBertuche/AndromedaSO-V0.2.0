import Fastify from 'fastify';
import { moduleRoutes } from './api/moduleRoutes';
import { evolutionRoutes } from './api/evolutionRoutes';
import { metrics } from './config/metrics';
import { ModuleRegistryService } from './registry/moduleRegistry';
export function buildServer(logger = true) {
    const server = Fastify({ logger });
    const runtimeRegistry = new ModuleRegistryService();
    server.get('/health', async () => ({ status: 'ok', server: 'core-kernel' }));
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
    server.register(moduleRoutes, { prefix: '/api', registry: runtimeRegistry });
    server.register(evolutionRoutes);
    return server;
}
//# sourceMappingURL=server.js.map