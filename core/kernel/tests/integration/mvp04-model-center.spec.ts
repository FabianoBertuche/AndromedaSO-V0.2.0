import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildServer } from '../../src/server';
import { providerRepository } from '../../src/modules/providers/infrastructure/repositories/provider.repository.memory';

let server: any;

beforeEach(async () => {
  providerRepository.reset();
  server = await buildServer();
  await server.ready();
});

afterEach(async () => {
  await server.close();
});

describe('MVP04 v2 Model Center API', () => {
  it('POST /api/providers openai -> 201', async () => {
    const response = await request(server.server)
      .post('/api/providers')
      .send({ type: 'openai', name: 'openai-live' });

    expect(response.status).toBe(201);
    expect(response.body.type).toBe('openai');
  });

  it('POST /api/providers/:id/sync returns 12+ models for openai', async () => {
    const created = await request(server.server)
      .post('/api/providers')
      .send({ type: 'openai', name: 'openai-sync' });

    const sync = await request(server.server)
      .post(`/api/providers/${created.body.id}/sync`)
      .send({});

    expect(sync.status).toBe(200);
    expect(sync.body.models.length).toBeGreaterThanOrEqual(12);
  });

  it('POST /api/providers/:id/sync for ollama includes local and routed cloud models', async () => {
    const created = await request(server.server)
      .post('/api/providers')
      .send({ type: 'ollama', name: 'ollama-hybrid' });

    const sync = await request(server.server)
      .post(`/api/providers/${created.body.id}/sync`)
      .send({});

    expect(sync.status).toBe(200);

    const modelIds = sync.body.models.map((item: { modelId: string }) => item.modelId);
    expect(modelIds.some((id: string) => id.startsWith('ollama/'))).toBe(true);
    expect(modelIds.some((id: string) => id.startsWith('ollama-cloud/'))).toBe(true);
  });

  it('GET /api/providers/:id/health returns latency', async () => {
    const created = await request(server.server)
      .post('/api/providers')
      .send({ type: 'groq', name: 'groq-health' });

    const health = await request(server.server)
      .get(`/api/providers/${created.body.id}/health`);

    expect(health.status).toBe(200);
    expect(health.body.latencyMs).toBeGreaterThan(0);
  });

  it('POST /api/llm-router/benchmark coding returns 9.4+ for gpt-4o', async () => {
    const created = await request(server.server)
      .post('/api/providers')
      .send({ type: 'openai', name: 'openai-benchmark' });

    const sync = await request(server.server)
      .post(`/api/providers/${created.body.id}/sync`)
      .send({});

    const benchmark = await request(server.server)
      .post('/api/llm-router/benchmark')
      .send({ modelId: 'gpt-4o', taskType: 'coding' });

    expect(sync.status).toBe(200);
    expect(benchmark.status).toBe(200);
    expect(benchmark.body.result.score).toBeGreaterThanOrEqual(9.4);
  });

  it('saves selected models in bulk', async () => {
    const created = await request(server.server)
      .post('/api/providers')
      .send({ type: 'openai', name: 'openai-select' });

    await request(server.server)
      .post(`/api/providers/${created.body.id}/sync`)
      .send({})
      .expect(200);

    const save = await request(server.server)
      .post(`/api/providers/${created.body.id}/models/select`)
      .send({ modelIds: ['gpt-4o', 'gpt-4.1'] });

    expect(save.status).toBe(200);
    expect(save.body.selectedModelIds.length).toBe(2);
  });

  it('returns router rankings and decisions', async () => {
    const created = await request(server.server)
      .post('/api/providers')
      .send({ type: 'openai', name: 'openai-router' });

    await request(server.server)
      .post(`/api/providers/${created.body.id}/sync`)
      .send({})
      .expect(200);

    await request(server.server)
      .post('/api/llm-router/infer')
      .send({ taskType: 'coding' })
      .expect(200);

    const rankings = await request(server.server).get('/api/llm-router/rankings');
    const decisions = await request(server.server).get('/api/llm-router/decisions');

    expect(rankings.status).toBe(200);
    expect(rankings.body.ranked.length).toBeGreaterThan(0);
    expect(decisions.status).toBe(200);
    expect(decisions.body.decisions.length).toBeGreaterThan(0);
  });

  it('rejects provider without type', async () => {
    const response = await request(server.server)
      .post('/api/providers')
      .send({ name: 'invalid-provider' });

    expect(response.status).toBe(400);
  });
});
