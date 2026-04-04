import type { FastifyPluginAsync } from 'fastify';
import type { ProviderConfig, TaskType } from '../domain/entities/provider.entity';
import { getProviderRepository } from '../infrastructure/repositories/provider.repository.factory';
import { ProviderOrchestratorService } from '../services/providerOrchestratorService';

let orchestratorServicePromise: Promise<ProviderOrchestratorService> | null = null;

const getProviderOrchestratorService = async (): Promise<ProviderOrchestratorService> => {
  if (!orchestratorServicePromise) {
    orchestratorServicePromise = getProviderRepository().then(
      (repository) => new ProviderOrchestratorService(repository)
    );
  }

  return orchestratorServicePromise;
};

export const providerRoutes: FastifyPluginAsync = async function providerRoutes(server) {
  server.get('/health', async function handleHealth() {
    return { status: 'ok', module: 'providers' };
  });

  server.post('/', async function handleCreate(request, reply) {
    const providerOrchestratorService = await getProviderOrchestratorService();
    const body = request.body as ProviderConfig;
    if (!body?.type) {
      return reply.status(400).send({ error: 'type is required' });
    }

    try {
      const provider = await providerOrchestratorService.createProvider(body);
      const health = await providerOrchestratorService.healthCheck(provider.id);
      return reply.status(201).send({ ...provider, health: health.health });
    } catch (error) {
      return reply.status(409).send({ error: (error as Error).message });
    }
  });

  server.get('/', async function handleList() {
    const providerOrchestratorService = await getProviderOrchestratorService();
    return { providers: await providerOrchestratorService.listProviders() };
  });

  server.post('/:id/sync', async function handleSync(request, reply) {
    const providerOrchestratorService = await getProviderOrchestratorService();
    const { id } = request.params as { id: string };
    try {
      const models = await providerOrchestratorService.syncModels(id);
      return { providerId: id, models };
    } catch (error) {
      return reply.status(404).send({ error: (error as Error).message });
    }
  });

  server.get('/:id/models', async function handleCatalog(request, reply) {
    const providerOrchestratorService = await getProviderOrchestratorService();
    const { id } = request.params as { id: string };
    try {
      return await providerOrchestratorService.getCatalog(id);
    } catch (error) {
      return reply.status(404).send({ error: (error as Error).message });
    }
  });

  server.post('/:id/models/select', async function handleSelect(request, reply) {
    const providerOrchestratorService = await getProviderOrchestratorService();
    const { id } = request.params as { id: string };
    const body = request.body as { modelIds?: string[] };

    try {
      const provider = await providerOrchestratorService.saveSelectedModels(id, body.modelIds ?? []);
      return { providerId: provider.id, selectedModelIds: provider.selectedModelIds };
    } catch (error) {
      return reply.status(404).send({ error: (error as Error).message });
    }
  });

  server.get('/:id/health', async function handleHealthById(request, reply) {
    const providerOrchestratorService = await getProviderOrchestratorService();
    const { id } = request.params as { id: string };
    try {
      return await providerOrchestratorService.healthCheck(id);
    } catch (error) {
      return reply.status(404).send({ error: (error as Error).message });
    }
  });

  server.delete('/:id', async function handleDelete(request, reply) {
    const providerOrchestratorService = await getProviderOrchestratorService();
    const { id } = request.params as { id: string };
    try {
      await providerOrchestratorService.deleteProvider(id);
      return reply.status(204).send();
    } catch (error) {
      return reply.status(404).send({ error: (error as Error).message });
    }
  });

  server.get('/:id/health/stream', async function handleHealthStream(request, reply) {
    const providerOrchestratorService = await getProviderOrchestratorService();
    const { id } = request.params as { id: string };

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });

    const emit = async () => {
      try {
        const payload = await providerOrchestratorService.healthCheck(id);
        reply.raw.write('event: health\n');
        reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (error) {
        const message = (error as Error).message;
        reply.raw.write('event: error\n');
        reply.raw.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      }
    };

    const timer = setInterval(() => {
      void emit();
    }, 3000);

    await emit();

    request.raw.on('close', function onClose() {
      clearInterval(timer);
      reply.raw.end();
    });
  });
};

export const llmRouterRoutes: FastifyPluginAsync = async function llmRouterRoutes(server) {
  server.get('/health', async function handleHealth() {
    return { status: 'ok', module: 'llm-router' };
  });

  server.post('/infer', async function handleInfer(request, reply) {
    const providerOrchestratorService = await getProviderOrchestratorService();
    const body = request.body as { taskType?: TaskType };
    if (!body?.taskType) {
      return reply.status(400).send({ error: 'taskType is required' });
    }

    try {
      return await providerOrchestratorService.inferRoute(body.taskType);
    } catch (error) {
      return reply.status(400).send({ error: (error as Error).message });
    }
  });

  server.post('/benchmark', async function handleBenchmark(request, reply) {
    const providerOrchestratorService = await getProviderOrchestratorService();
    const body = request.body as { modelId?: string; taskType?: TaskType };
    if (!body?.modelId || !body?.taskType) {
      return reply.status(400).send({ error: 'modelId and taskType are required' });
    }

    try {
      const result = await providerOrchestratorService.benchmarkModel(body.modelId, body.taskType);
      return { result };
    } catch (error) {
      return reply.status(404).send({ error: (error as Error).message });
    }
  });

  server.get('/benchmarks', async function handleBenchmarks() {
    const providerOrchestratorService = await getProviderOrchestratorService();
    return { results: await providerOrchestratorService.listBenchmarks() };
  });

  server.get('/rankings', async function handleRankings() {
    const providerOrchestratorService = await getProviderOrchestratorService();
    const decision = await providerOrchestratorService.inferRoute('coding');
    return { ranked: decision.ranked };
  });

  server.get('/decisions', async function handleDecisions() {
    const providerOrchestratorService = await getProviderOrchestratorService();
    return { decisions: await providerOrchestratorService.getRoutingHistory() };
  });
};
