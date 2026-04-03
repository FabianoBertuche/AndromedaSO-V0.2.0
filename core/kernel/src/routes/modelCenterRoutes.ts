import { FastifyPluginAsync } from 'fastify';
import { modelProviderService } from '../services/modelProviderService';

export const modelCenterRoutes: FastifyPluginAsync = async (server) => {
  server.post('/providers', async (request, reply) => {
    const body = request.body as {
      name?: string;
      displayName?: string;
      apiBase?: string;
      apiKey?: string;
    };

    if (!body?.name) {
      return reply.status(400).send({ error: 'name is required' });
    }

    const payload = {
      name: body.name,
      displayName: body.displayName,
      apiBase: body.apiBase,
      apiKey: body.apiKey
    };

    try {
      const provider = await modelProviderService.createProvider(payload);
      return reply.status(201).send(provider);
    } catch (error) {
      return reply.status(409).send({ error: (error as Error).message });
    }
  });

  server.get('/providers', async () => {
    return { providers: modelProviderService.listProviders() };
  });

  server.post('/providers/:id/sync', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const models = await modelProviderService.syncModels(id);
      return { providerId: id, models };
    } catch (error) {
      return reply.status(404).send({ error: (error as Error).message });
    }
  });

  server.get('/providers/:id/health', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      return await modelProviderService.healthCheck(id);
    } catch (error) {
      return reply.status(404).send({ error: (error as Error).message });
    }
  });

  server.post('/models/:id/benchmark', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { taskType?: 'coding' | 'chat' | 'analysis' };

    if (!body?.taskType) {
      return reply.status(400).send({ error: 'taskType is required' });
    }

    try {
      const result = await modelProviderService.benchmarkModel(id, body.taskType);
      return { result };
    } catch (error) {
      return reply.status(404).send({ error: (error as Error).message });
    }
  });

  server.post('/router/infer', async (request, reply) => {
    const body = request.body as { taskType?: 'coding' | 'chat' | 'analysis' };
    if (!body?.taskType) {
      return reply.status(400).send({ error: 'taskType is required' });
    }

    try {
      return modelProviderService.inferRoute(body.taskType);
    } catch (error) {
      return reply.status(400).send({ error: (error as Error).message });
    }
  });

  server.get('/router/decisions', async () => {
    return { decisions: modelProviderService.getRoutingHistory() };
  });

  server.get('/models/benchmarks', async () => {
    return { results: modelProviderService.getBenchmarks() };
  });
};
