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
});
