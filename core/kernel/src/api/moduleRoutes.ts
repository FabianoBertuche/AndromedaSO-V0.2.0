import { FastifyPluginAsync } from 'fastify';
import { discoverModules } from '../discovery/fsDiscovery';
import { ModuleRegistryService } from '../registry/moduleRegistry';

export const moduleRoutes: FastifyPluginAsync = async (server) => {
  const registry = new ModuleRegistryService();

  server.post('/modules/discover', async (request, reply) => {
    const { rootPath } = request.body as { rootPath: string };
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
    const { id } = request.params as { id: string };
    const module = await registry.get(id);
    if (!module) {
      return reply.status(404).send({ error: 'Module not found' });
    }
    return module;
  });
};
