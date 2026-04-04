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

describe('MVP10 T059 E2E scenarios', () => {
  it('scenario 1: creates agent snapshots and rollback', async () => {
    await request(server.server).post('/agents/e2e-a/version/snapshot').send({ gitCommit: 'a1', manifest: { v: 1 } }).expect(200);
    await request(server.server).post('/agents/e2e-a/version/snapshot').send({ gitCommit: 'a2', manifest: { v: 2 } }).expect(200);
    await request(server.server).post('/agents/e2e-a/version/rollback').send({}).expect(200);
  });

  it('scenario 2: records and reads performance', async () => {
    await request(server.server).post('/agents/e2e-b/performance/record').send({ date: '2026-04-03', latencyP95: 90, successRate: 0.97, throughput: 55 }).expect(200);
    const res = await request(server.server).get('/agents/e2e-b/performance');
    expect(res.status).toBe(200);
    expect(res.body.records.length).toBe(1);
  });

  it('scenario 3: computes reputation after task feedback', async () => {
    await request(server.server).post('/agents/e2e-c/performance/record').send({ date: '2026-04-03', latencyP95: 140, successRate: 0.85, throughput: 35 }).expect(200);
    await request(server.server).post('/tasks/e2e-task-1/feedback').send({ agentId: 'e2e-c', capability: 'routing', thumbs: 'up' }).expect(200);
    const rep = await request(server.server).get('/agents/e2e-c/reputation');
    expect(rep.status).toBe(200);
    expect(rep.body.routing).toBeGreaterThan(0);
  });

  it('scenario 4: sets budget and spends within limit', async () => {
    await request(server.server).post('/agents/e2e-d/budget/set').send({ dailyLimit: 200, monthlyLimit: 2000 }).expect(200);
    const spend = await request(server.server).post('/agents/e2e-d/budget/spend').send({ amount: 50 });
    expect(spend.status).toBe(200);
    expect(spend.body.spentDaily).toBe(50);
  });

  it('scenario 5: blocks spend over budget with 429', async () => {
    await request(server.server).post('/agents/e2e-e/budget/set').send({ dailyLimit: 100, monthlyLimit: 500 }).expect(200);
    await request(server.server).post('/agents/e2e-e/budget/spend').send({ amount: 90 }).expect(200);
    const blocked = await request(server.server).post('/agents/e2e-e/budget/spend').send({ amount: 20 });
    expect(blocked.status).toBe(429);
  });

  it('scenario 6: serves dashboard page and data', async () => {
    await request(server.server).post('/agents/e2e-f/budget/set').send({ dailyLimit: 100, monthlyLimit: 1000 }).expect(200);
    await request(server.server).post('/agents/e2e-f/budget/spend').send({ amount: 22 }).expect(200);
    await request(server.server).get('/dashboard/costs').expect(200);
    const data = await request(server.server).get('/dashboard/costs/data');
    expect(data.status).toBe(200);
  });

  it('scenario 7: refreshes and gets suggestions', async () => {
    await request(server.server).post('/agents/e2e-g/performance/record').send({ date: '2026-04-03', latencyP95: 180, successRate: 0.7, throughput: 20 }).expect(200);
    await request(server.server).post('/tasks/e2e-task-2/feedback').send({ agentId: 'e2e-g', capability: 'planning', thumbs: 'down' }).expect(200);
    await request(server.server).post('/agents/e2e-g/suggestions/refresh').send({}).expect(200);
    const suggestions = await request(server.server).get('/agents/e2e-g/suggestions');
    expect(suggestions.status).toBe(200);
    expect(suggestions.body.suggestions.length).toBeGreaterThan(0);
  });

  it('scenario 8: runs golden eval benchmark', async () => {
    const result = await request(server.server).post('/eval/run').send({ agentId: 'e2e-h' });
    expect(result.status).toBe(200);
    expect(result.body.datasetSize).toBe(50);
  });

  it('scenario 9: handles diff between versions', async () => {
    await request(server.server).post('/agents/e2e-i/version/snapshot').send({ gitCommit: 'i1', manifest: { model: 'mini' } }).expect(200);
    await request(server.server).post('/agents/e2e-i/version/snapshot').send({ gitCommit: 'i2', manifest: { model: 'large' } }).expect(200);
    const diff = await request(server.server).get('/agents/e2e-i/version/diff?fromVersion=1&toVersion=2');
    expect(diff.status).toBe(200);
    expect(diff.body.changedKeys).toContain('model');
  });

  it('scenario 10: runs full flow task to budget block', async () => {
    await request(server.server).post('/agents/e2e-j/version/snapshot').send({ gitCommit: 'j1', manifest: { chain: 'base' } }).expect(200);
    await request(server.server).post('/agents/e2e-j/performance/record').send({ date: '2026-04-03', latencyP95: 110, successRate: 0.88, throughput: 31 }).expect(200);
    await request(server.server).post('/tasks/e2e-task-3/feedback').send({ agentId: 'e2e-j', capability: 'reasoning', thumbs: 'up' }).expect(200);
    await request(server.server).post('/agents/e2e-j/budget/set').send({ dailyLimit: 20, monthlyLimit: 200 }).expect(200);
    await request(server.server).post('/agents/e2e-j/budget/spend').send({ amount: 15 }).expect(200);
    const blocked = await request(server.server).post('/agents/e2e-j/budget/spend').send({ amount: 10 });
    expect(blocked.status).toBe(429);
  });
});