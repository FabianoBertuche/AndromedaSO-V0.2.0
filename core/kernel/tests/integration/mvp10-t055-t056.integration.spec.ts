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

describe('MVP10 T055-T056', () => {
  it('returns cost dashboard data and serves React page', async () => {
    await request(server.server)
      .post('/agents/agent-cost/budget/set')
      .send({ dailyLimit: 100, monthlyLimit: 1000 })
      .expect(200);

    await request(server.server)
      .post('/agents/agent-cost/budget/spend')
      .send({ amount: 35 })
      .expect(200);

    const dataRes = await request(server.server).get('/dashboard/costs/data');
    expect(dataRes.status).toBe(200);
    expect(dataRes.body.agents[0]).toMatchObject({
      agentId: 'agent-cost',
      spentDaily: 35
    });

    const pageRes = await request(server.server).get('/dashboard/costs');
    expect(pageRes.status).toBe(200);
    expect(pageRes.headers['content-type']).toContain('text/html');
    expect(pageRes.text).toContain('Andromeda Cost Dashboard');
  });

  it('stores task feedback and feeds reputation scoring', async () => {
    await request(server.server)
      .post('/agents/agent-feedback/performance/record')
      .send({ date: '2026-04-03', latencyP95: 100, successRate: 0.8, throughput: 33 })
      .expect(200);

    await request(server.server)
      .post('/tasks/task-123/feedback')
      .send({
        agentId: 'agent-feedback',
        capability: 'planning',
        thumbs: 'up',
        note: 'Great result'
      })
      .expect(200);

    const reputationRes = await request(server.server).get('/agents/agent-feedback/reputation');
    expect(reputationRes.status).toBe(200);
    expect(reputationRes.body.planning).toBeGreaterThan(0.8);
  });
});