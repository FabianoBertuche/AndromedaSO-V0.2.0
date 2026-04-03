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

describe('MVP11 Orchestrator integration', () => {
  it('decomposes landing page task into design/copy/code subtasks', async () => {
    const response = await request(server.server)
      .post('/tasks/multi')
      .send({ task: 'Criar landing page' });

    expect(response.status).toBe(200);
    expect(response.body.subtasks).toHaveLength(3);
    const capabilities = response.body.subtasks.map((item: any) => item.capability);
    expect(capabilities).toEqual(expect.arrayContaining(['design', 'copy', 'code']));
  });

  it('relays agent message through /agents/:id/message', async () => {
    await request(server.server)
      .post('/tasks/multi')
      .send({ task: 'Criar landing page' })
      .expect(200);

    const relay = await request(server.server)
      .post('/agents/agent-design/message')
      .send({ to: 'agent-code', content: 'Need section spacing tokens' });

    expect(relay.status).toBe(200);
    expect(relay.body.delivered).toBe(true);

    const inbox = await request(server.server).get('/agents/agent-code/inbox');
    expect(inbox.status).toBe(200);
    expect(inbox.body.messages.length).toBeGreaterThan(0);
  });

  it('applies majority vote and falls back to human when tied', async () => {
    const tie = await request(server.server)
      .post('/tasks/multi')
      .send({ task: 'Create conflict in architecture decision' });

    expect(tie.status).toBe(200);
    expect(tie.body.requiresHumanFallback).toBe(true);

    const orchestration = await request(server.server)
      .get(`/tasks/${tie.body.taskId}/orchestration`);

    expect(orchestration.status).toBe(200);
    expect(orchestration.body.requiresHumanFallback).toBe(true);
  });

  it('returns orchestrator status counters', async () => {
    await request(server.server)
      .post('/tasks/multi')
      .send({ task: 'Criar landing page' })
      .expect(200);

    const status = await request(server.server).get('/orchestrator/status');
    expect(status.status).toBe(200);
    expect(status.body).toHaveProperty('activeTeams');
    expect(status.body).toHaveProperty('pending');
  });

  it('blocks multi-task orchestration when planner budget is exhausted', async () => {
    await request(server.server)
      .post('/agents/agent-planner/budget/set')
      .send({ dailyLimit: 5, monthlyLimit: 5 })
      .expect(200);

    const blocked = await request(server.server)
      .post('/tasks/multi')
      .send({ task: 'Criar landing page' });

    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toContain('Budget limit exceeded');
  });
});
