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

describe('MVP10 T051-T052', () => {
  it('creates version snapshots and supports rollback endpoint', async () => {
    await request(server.server)
      .post('/agents/agent-alpha/version/snapshot')
      .send({ gitCommit: 'abc1234', manifest: { llm: 'gpt-4o-mini', temperature: 0.2 } })
      .expect(200);

    await request(server.server)
      .post('/agents/agent-alpha/version/snapshot')
      .send({ gitCommit: 'def5678', manifest: { llm: 'gpt-4.1', temperature: 0.1 } })
      .expect(200);

    const rollbackRes = await request(server.server)
      .post('/agents/agent-alpha/version/rollback')
      .send({});

    expect(rollbackRes.status).toBe(200);
    expect(rollbackRes.body).toMatchObject({
      restoredGitCommit: 'abc1234'
    });
  });

  it('returns version diffs for manifest changes', async () => {
    await request(server.server)
      .post('/agents/agent-diff/version/snapshot')
      .send({ gitCommit: '111aaaa', manifest: { llm: 'gpt-4o-mini', temperature: 0.2 } })
      .expect(200);

    await request(server.server)
      .post('/agents/agent-diff/version/snapshot')
      .send({ gitCommit: '222bbbb', manifest: { llm: 'gpt-4.1', temperature: 0.2, topP: 0.95 } })
      .expect(200);

    const diffRes = await request(server.server)
      .get('/agents/agent-diff/version/diff?fromVersion=1&toVersion=2');

    expect(diffRes.status).toBe(200);
    expect(diffRes.body.changedKeys).toContain('llm');
    expect(diffRes.body.changedKeys).toContain('topP');
  });

  it('records and reads performance history', async () => {
    await request(server.server)
      .post('/agents/agent-perf/performance/record')
      .send({
        date: '2026-04-03',
        latencyP95: 210,
        successRate: 0.98,
        throughput: 42
      })
      .expect(200);

    const response = await request(server.server).get('/agents/agent-perf/performance');
    expect(response.status).toBe(200);
    expect(response.body.agentId).toBe('agent-perf');
    expect(response.body.records).toHaveLength(1);
    expect(response.body.records[0]).toMatchObject({
      latencyP95: 210,
      successRate: 0.98,
      throughput: 42
    });
  });
});