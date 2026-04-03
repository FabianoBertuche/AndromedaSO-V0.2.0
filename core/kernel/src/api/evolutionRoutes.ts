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
};