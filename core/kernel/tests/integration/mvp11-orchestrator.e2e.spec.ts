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

describe('MVP11 Orchestrator e2e', () => {
  it('scenario 1: creates orchestration and retrieves task tree', async () => {
    const create = await request(server.server)
      .post('/tasks/multi')
      .send({ task: 'Criar landing page' });

    expect(create.status).toBe(200);
    const taskId = create.body.taskId;

    const detail = await request(server.server).get(`/tasks/${taskId}/orchestration`);
    expect(detail.status).toBe(200);
    expect(detail.body.tree[0].children.length).toBe(3);
  });

  it('scenario 2: sends cross-agent message inside orchestration flow', async () => {
    const create = await request(server.server)
      .post('/tasks/multi')
      .send({ task: 'Criar landing page' });

    const taskId = create.body.taskId;

    const send = await request(server.server)
      .post('/agents/agent-copy/message')
      .send({
        to: 'agent-code',
        content: 'Hero copy is ready for integration',
        taskId
      });

    expect(send.status).toBe(200);
    expect(send.body.delivered).toBe(true);

    const detail = await request(server.server).get(`/tasks/${taskId}/orchestration`);
    expect(detail.status).toBe(200);
    expect(detail.body.messages.length).toBeGreaterThan(0);
  });
});
