import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildServer } from '../../src/server';

let server: any;

beforeEach(async () => {
  server = await buildServer();
  await server.ready();
});

afterEach(async () => {
  await server.close();
});

describe('MVP10 T057-T058', () => {
  it('generates playbook suggestions from performance and feedback data', async () => {
    await request(server.server)
      .post('/agents/agent-suggest/performance/record')
      .send({ date: '2026-04-03', latencyP95: 220, successRate: 0.78, throughput: 20 })
      .expect(200);

    await request(server.server)
      .post('/tasks/task-suggest-1/feedback')
      .send({ agentId: 'agent-suggest', capability: 'planning', thumbs: 'down', note: 'needs retry' })
      .expect(200);

    await request(server.server)
      .post('/agents/agent-suggest/suggestions/refresh')
      .send({})
      .expect(200);

    const suggestionsRes = await request(server.server).get('/agents/agent-suggest/suggestions');
    expect(suggestionsRes.status).toBe(200);
    expect(suggestionsRes.body.suggestions.length).toBeGreaterThan(0);
  });

  it('runs eval with golden dataset of 50 tasks', async () => {
    const evalRes = await request(server.server)
      .post('/eval/run')
      .send({ agentId: 'agent-eval' });

    expect(evalRes.status).toBe(200);
    expect(evalRes.body.datasetSize).toBe(50);
    expect(evalRes.body.results).toHaveLength(50);
    expect(evalRes.body.results[0]).toMatchObject({ taskId: 'golden-01' });
  });
});