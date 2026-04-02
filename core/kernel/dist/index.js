import Fastify from 'fastify';
import { config } from './config';
const server = Fastify({ logger: true });
server.get('/health', async () => ({ status: 'ok', server: 'core-kernel' }));
const start = async () => {
    try {
        await server.listen({ port: config.port, host: '0.0.0.0' });
        console.log(`Core/Kernel API running at http://0.0.0.0:${config.port}`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=index.js.map