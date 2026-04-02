import { FastifyPluginAsync } from 'fastify';
import { discoverModules } from '../discovery/fsDiscovery';
import { ModuleRegistryService } from '../registry/moduleRegistry';
import { validateAndLoadModule, loadModule } from '../lifecycle/loadModule';
import { LifecycleStateMachine } from '../lifecycle/stateMachine';

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

  server.post('/modules/:id/validate', async (request, reply) => {
    const { id } = request.params as { id: string };
    const module = await registry.get(id);
    if (!module) {
      return reply.status(404).send({ error: 'Module not found' });
    }

    const allModules = registry.list();
    const result = await validateAndLoadModule(module, allModules);

    if (!result.valid) {
      return reply.status(400).send({ valid: false, error: result.error });
    }

    registry.setState(id, 'validated');
    return { valid: true, state: 'validated' };
  });

  server.post('/modules/:id/load', async (request, reply) => {
    const { id } = request.params as { id: string };
    const module = await registry.get(id);
    if (!module) {
      return reply.status(404).send({ error: 'Module not found' });
    }

    const stateMachine = new LifecycleStateMachine('validated');
    try {
      const result = await loadModule(module, stateMachine);
      registry.setState(id, stateMachine.current());
      return result;
    } catch (err) {
      return reply.status(500).send({ error: (err as any).message });
    }
  });
};
