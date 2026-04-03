import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildServer } from '../../src/server';
import { modelProviderService } from '../../src/services/modelProviderService';

let server: any;

beforeEach(async () => {
  modelProviderService.reset();
  server = buildServer();
  await server.ready();
});

afterEach(async () => {
  await server.close();
});

describe('MVP04 Model Center', () => {
  it('POST /providers -> sync -> infer -> benchmark', async () => {
    const created = await request(server.server)
      .post('/api/providers')
      .send({ name: 'openai', displayName: 'OpenAI' });

    expect(created.status).toBe(201);

    const sync = await request(server.server)
      .post('/api/providers/openai/sync')
      .send({});

    expect(sync.status).toBe(200);
    expect(sync.body.models.length).toBeGreaterThan(0);

    const infer = await request(server.server)
      .post('/api/router/infer')
      .send({ taskType: 'coding' });

    expect(infer.status).toBe(200);
    expect(infer.body.decision).toBeDefined();

    const benchmark = await request(server.server)
      .post('/api/models/gpt-4o/benchmark')
      .send({ taskType: 'coding' });

    expect(benchmark.status).toBe(200);
    expect(benchmark.body.result.success).toBe(true);
  });

  it('Router selects GPT-4o for coding task', async () => {
    await request(server.server)
      .post('/api/providers')
      .send({ name: 'openai', displayName: 'OpenAI' })
      .expect(201);

    await request(server.server)
      .post('/api/providers/openai/sync')
      .send({})
      .expect(200);

    const infer = await request(server.server)
      .post('/api/router/infer')
      .send({ taskType: 'coding' });

    expect(infer.status).toBe(200);
    expect(infer.body.decision.selectedModel).toBe('gpt-4o');
  });

  it('rejects provider creation when name is missing', async () => {
    const response = await request(server.server)
      .post('/api/providers')
      .send({ displayName: 'No Name' });

    expect(response.status).toBe(400);
  });

  it('rejects duplicate provider names', async () => {
    await request(server.server)
      .post('/api/providers')
      .send({ name: 'openai', displayName: 'OpenAI' })
      .expect(201);

    const duplicate = await request(server.server)
      .post('/api/providers')
      .send({ name: 'openai', displayName: 'OpenAI 2' });

    expect(duplicate.status).toBe(409);
  });

  it('returns 404 when syncing unknown provider', async () => {
    const response = await request(server.server)
      .post('/api/providers/unknown/sync')
      .send({});

    expect(response.status).toBe(404);
  });

  it('returns health metrics for synced provider', async () => {
    await request(server.server)
      .post('/api/providers')
      .send({ name: 'openai', displayName: 'OpenAI' })
      .expect(201);

    await request(server.server)
      .post('/api/providers/openai/sync')
      .send({})
      .expect(200);

    const health = await request(server.server)
      .get('/api/providers/openai/health');

    expect(health.status).toBe(200);
    expect(health.body.latencyMs).toBeGreaterThan(0);
  });

  it('returns 400 for infer route without taskType', async () => {
    const response = await request(server.server)
      .post('/api/router/infer')
      .send({});

    expect(response.status).toBe(400);
  });

  it('tracks routing decisions history', async () => {
    await request(server.server)
      .post('/api/providers')
      .send({ name: 'openai', displayName: 'OpenAI' })
      .expect(201);

    await request(server.server)
      .post('/api/providers/openai/sync')
      .send({})
      .expect(200);

    await request(server.server)
      .post('/api/router/infer')
      .send({ taskType: 'coding' })
      .expect(200);

    const decisions = await request(server.server)
      .get('/api/router/decisions');

    expect(decisions.status).toBe(200);
    expect(decisions.body.decisions.length).toBeGreaterThan(0);
  });

  it('returns benchmark history after benchmark execution', async () => {
    await request(server.server)
      .post('/api/providers')
      .send({ name: 'openai', displayName: 'OpenAI' })
      .expect(201);

    await request(server.server)
      .post('/api/providers/openai/sync')
      .send({})
      .expect(200);

    await request(server.server)
      .post('/api/models/gpt-4o/benchmark')
      .send({ taskType: 'coding' })
      .expect(200);

    const history = await request(server.server)
      .get('/api/models/benchmarks');

    expect(history.status).toBe(200);
    expect(history.body.results.length).toBeGreaterThan(0);
  });

  it('returns 404 for benchmark on unknown model', async () => {
    const response = await request(server.server)
      .post('/api/models/unknown-model/benchmark')
      .send({ taskType: 'coding' });

    expect(response.status).toBe(404);
  });
});
