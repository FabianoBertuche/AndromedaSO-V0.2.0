import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildServer } from '../../src/server';

let server: any;

beforeEach(async () => {
  server = buildServer();
  await server.ready();
});

afterEach(async () => {
  await server.close();
});

describe('MVP10 T053-T054', () => {
  it('computes reputation score by capability', async () => {
    await request(server.server)
      .post('/agents/agent-rep/performance/record')
      .send({ date: '2026-04-03', latencyP95: 120, successRate: 0.9, throughput: 30 })
      .expect(200);

    await request(server.server)
      .post('/agents/agent-rep/reputation/feedback')
      .send({ capability: 'routing', feedback: 0.8 })
      .expect(200);

    const reputationRes = await request(server.server).get('/agents/agent-rep/reputation');
    expect(reputationRes.status).toBe(200);
    expect(reputationRes.body.routing).toBeCloseTo(0.86, 2);
  });

  it('sets budget policy and blocks requests with 429 when exceeded', async () => {
    await request(server.server)
      .post('/agents/agent-budget/budget/set')
      .send({ dailyLimit: 100, monthlyLimit: 500 })
      .expect(200);

    await request(server.server)
      .post('/agents/agent-budget/budget/spend')
      .send({ amount: 60 })
      .expect(200);

    const blockedRes = await request(server.server)
      .post('/agents/agent-budget/budget/spend')
      .send({ amount: 50 });

    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.error).toBe('Budget limit exceeded');
  });
});