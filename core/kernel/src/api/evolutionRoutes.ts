import { FastifyPluginAsync } from 'fastify';
import { agentEvolutionService } from '../evolution/evolutionService';

export const evolutionRoutes: FastifyPluginAsync = async (server) => {
  server.post('/agents/:id/version/snapshot', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { gitCommit?: string; manifest?: Record<string, unknown> };

    if (!body?.gitCommit || !body?.manifest) {
      return reply.status(400).send({ error: 'gitCommit and manifest are required' });
    }

    const snapshot = agentEvolutionService.snapshotVersion(id, {
      gitCommit: body.gitCommit,
      manifest: body.manifest
    });

    return { snapshot };
  });

  server.get('/agents/:id/version/diff', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { fromVersion, toVersion } = request.query as { fromVersion?: string; toVersion?: string };

    if (!fromVersion || !toVersion) {
      return reply.status(400).send({ error: 'fromVersion and toVersion are required' });
    }

    const diff = agentEvolutionService.getDiff(id, Number(fromVersion), Number(toVersion));
    if (!diff) {
      return reply.status(404).send({ error: 'Version snapshot not found' });
    }

    return diff;
  });

  server.post('/agents/:id/version/rollback', async (request, reply) => {
    const { id } = request.params as { id: string };
    const snapshot = agentEvolutionService.rollback(id);
    if (!snapshot) {
      return reply.status(400).send({ error: 'Rollback requires at least 2 versions' });
    }

    return { rollbackVersion: snapshot.version, restoredGitCommit: snapshot.gitCommit };
  });

  server.post('/agents/:id/performance/record', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      date?: string;
      latencyP95?: number;
      successRate?: number;
      throughput?: number;
    };

    if (
      !body?.date
      || typeof body.latencyP95 !== 'number'
      || typeof body.successRate !== 'number'
      || typeof body.throughput !== 'number'
    ) {
      return reply.status(400).send({ error: 'date, latencyP95, successRate and throughput are required' });
    }

    const record = agentEvolutionService.recordPerformance(id, {
      date: body.date,
      latencyP95: body.latencyP95,
      successRate: body.successRate,
      throughput: body.throughput
    });

    return { record };
  });

  server.get('/agents/:id/performance', async (request) => {
    const { id } = request.params as { id: string };
    const records = agentEvolutionService.getPerformance(id);
    return { agentId: id, records };
  });

  server.post('/agents/:id/reputation/feedback', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { capability?: string; feedback?: number };

    if (!body?.capability || typeof body.feedback !== 'number') {
      return reply.status(400).send({ error: 'capability and feedback are required' });
    }

    const normalizedFeedback = Math.max(0, Math.min(1, body.feedback));
    agentEvolutionService.addCapabilityFeedback(id, body.capability, normalizedFeedback);
    return { ok: true };
  });

  server.get('/agents/:id/reputation', async (request) => {
    const { id } = request.params as { id: string };
    return agentEvolutionService.getReputation(id);
  });

  server.post('/agents/:id/budget/set', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { dailyLimit?: number; monthlyLimit?: number };

    if (typeof body?.dailyLimit !== 'number' || typeof body?.monthlyLimit !== 'number') {
      return reply.status(400).send({ error: 'dailyLimit and monthlyLimit are required' });
    }

    const budget = agentEvolutionService.setBudget(id, body.dailyLimit, body.monthlyLimit);
    return { agentId: id, budget };
  });

  server.post('/agents/:id/budget/spend', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { amount?: number };

    if (typeof body?.amount !== 'number' || body.amount < 0) {
      return reply.status(400).send({ error: 'amount must be a positive number' });
    }

    const outcome = agentEvolutionService.spendBudget(id, body.amount);
    if (!outcome.allowed) {
      return reply.status(429).send({ error: 'Budget limit exceeded', ...outcome });
    }

    return outcome;
  });

  server.get('/agents/:id/budget', async (request) => {
    const { id } = request.params as { id: string };
    return { agentId: id, budget: agentEvolutionService.getBudget(id) };
  });
};