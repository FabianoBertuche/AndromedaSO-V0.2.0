import Fastify from 'fastify';
import { moduleRoutes } from './api/moduleRoutes';
export function buildServer() {
    const server = Fastify({ logger: false });
    server.get('/health', async () => ({ status: 'ok', server: 'core-kernel' }));
    server.register(moduleRoutes, { prefix: '/api' });
    return server;
}
//# sourceMappingURL=server.js.map