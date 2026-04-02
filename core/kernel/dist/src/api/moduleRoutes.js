import { discoverModules } from '../discovery/fsDiscovery';
import { ModuleRegistryService } from '../registry/moduleRegistry';
const registry = new ModuleRegistryService();
export const moduleRoutes = async (server) => {
    server.post('/modules/discover', async (request, reply) => {
        const { rootPath } = request.body;
        if (!rootPath) {
            return reply.status(400).send({ error: 'rootPath is required' });
        }
        const manifests = await discoverModules(rootPath);
        const registered = await registry.discoverAndRegister(manifests);
        return { registered };
    });
    server.get('/modules', async () => {
        return { modules: registry.list() };
    });
    server.get('/modules/:id', async (request, reply) => {
        const { id } = request.params;
        const module = await registry.get(id);
        if (!module) {
            return reply.status(404).send({ error: 'Module not found' });
        }
        return module;
    });
};
//# sourceMappingURL=moduleRoutes.js.map