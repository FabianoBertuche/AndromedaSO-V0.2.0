import { FastifyPluginAsync } from 'fastify';
import { discoverModules } from '../discovery/fsDiscovery';
import { ModuleRegistryService } from '../registry/moduleRegistry';
import { validateAndLoadModule, loadModule } from '../lifecycle/loadModule';
import { LifecycleStateMachine } from '../lifecycle/stateMachine';
import { LifecycleOrchestrator } from '../lifecycle/lifecycleOrchestrator';
import { metrics } from '../config/metrics';
import { safetyMonitor } from '../config/safetyMonitor';
import { persistValidationDecision } from '../store/postgresRegistry';
import { SAFETY } from '../config/safety';

export const moduleRoutes: FastifyPluginAsync = async (server) => {
  const registry = new ModuleRegistryService();

  server.post('/modules/discover', async (request, reply) => {
    const { rootPath } = request.body as { rootPath: string };
    if (!rootPath) {
      return reply.status(400).send({ error: 'rootPath is required' });
    }

    const manifests = await discoverModules(rootPath);
    const registered = await registry.discoverAndRegister(manifests);
    metrics.incrementCounter('modules_discovered', manifests.length);
    metrics.incrementCounter('modules_registered', registered.length);
    metrics.setGauge('registry_size', registry.list().length);

    return { registered };
  });

  server.get('/modules', async () => {
    const modules = registry.list();
    metrics.incrementCounter('modules_listed');
    return { modules };
  });

  server.get('/modules/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const module = await registry.get(id);
    if (!module) {
      metrics.incrementCounter('modules_not_found');
      return reply.status(404).send({ error: 'Module not found' });
    }
    metrics.incrementCounter('modules_retrieved');
    return module;
  });

  server.post('/modules/:id/validate', async (request, reply) => {
    const { id } = request.params as { id: string };
    const module = await registry.get(id);
    if (!module) {
      metrics.incrementCounter('validation_module_not_found');
      return reply.status(404).send({ error: 'Module not found' });
    }

    const allModules = registry.list();
    const result = await validateAndLoadModule(module, allModules);

    try {
      await persistValidationDecision({
        moduleId: id,
        decision: result.valid ? 'passed' : 'failed',
        reason: result.valid ? 'Validation successful' : result.error,
        context: { contracts: module.contracts }
      });
    } catch (auditErr) {
      if (SAFETY.PG_REQUIRED) {
        throw new Error('PG required');
      }
    }

    if (!result.valid) {
      metrics.incrementCounter('validations_failed');
      if (safetyMonitor.recordFailure('validate', id)) {
        metrics.incrementCounter('retry_storm_alerts');
      }
      return reply.status(400).send({ valid: false, error: result.error });
    }

    registry.setState(id, 'validated');
    metrics.incrementCounter('validations_passed');
    return { valid: true, state: 'validated' };
  });

  server.post('/modules/:id/load', async (request, reply) => {
    const { id } = request.params as { id: string };
    const module = await registry.get(id);
    if (!module) {
      metrics.incrementCounter('load_module_not_found');
      return reply.status(404).send({ error: 'Module not found' });
    }

    const stateMachine = new LifecycleStateMachine('validated');
    try {
      const result = await loadModule(module, stateMachine);
      registry.setState(id, stateMachine.current());
      metrics.incrementCounter('modules_loaded');
      return result;
    } catch (err) {
      metrics.incrementCounter('loads_failed');
      if (safetyMonitor.recordFailure('load', id)) {
        metrics.incrementCounter('retry_storm_alerts');
      }
      return reply.status(500).send({ error: (err as any).message });
    }
  });

  server.post('/modules/:id/start', async (request, reply) => {
    const { id } = request.params as { id: string };
    const module = await registry.get(id);
    if (!module) {
      metrics.incrementCounter('start_module_not_found');
      return reply.status(404).send({ error: 'Module not found' });
    }

    const stateMachine = new LifecycleStateMachine(module.state);
    const orchestrator = new LifecycleOrchestrator(stateMachine);
    try {
      const result = await orchestrator.start(module);
      registry.setState(id, stateMachine.current());
      metrics.incrementCounter('lifecycle_transitions');
      metrics.incrementCounter('modules_started');
      return result;
    } catch (err) {
      metrics.incrementCounter('starts_failed');
      if (safetyMonitor.recordFailure('start', id)) {
        metrics.incrementCounter('retry_storm_alerts');
      }
      return reply.status(500).send({ error: (err as any).message });
    }
  });

  server.post('/modules/:id/stop', async (request, reply) => {
    const { id } = request.params as { id: string };
    const module = await registry.get(id);
    if (!module) {
      metrics.incrementCounter('stop_module_not_found');
      return reply.status(404).send({ error: 'Module not found' });
    }

    const stateMachine = new LifecycleStateMachine(module.state);
    const orchestrator = new LifecycleOrchestrator(stateMachine);
    try {
      const result = await orchestrator.stop(module);
      registry.setState(id, stateMachine.current());
      metrics.incrementCounter('lifecycle_transitions');
      metrics.incrementCounter('modules_stopped');
      return result;
    } catch (err) {
      metrics.incrementCounter('stops_failed');
      if (safetyMonitor.recordFailure('stop', id)) {
        metrics.incrementCounter('retry_storm_alerts');
      }
      return reply.status(500).send({ error: (err as any).message });
    }
  });

  server.get('/modules/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string };
    const module = await registry.get(id);
    if (!module) {
      metrics.incrementCounter('status_module_not_found');
      return reply.status(404).send({ error: 'Module not found' });
    }

    metrics.incrementCounter('status_requests');
    return { state: module.state };
  });

  server.get('/metrics', async () => {
    return metrics.getMetrics();
  });
};
