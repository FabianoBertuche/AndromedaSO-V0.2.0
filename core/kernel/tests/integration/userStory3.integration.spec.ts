import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import request from 'supertest';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import { buildServer } from '../../src/server';

let server: any;

beforeEach(async () => {
  server = await buildServer();
  await server.ready();
});
afterEach(async () => {
  await server.close();
});

describe('User Story 3: Module Lifecycle Management APIs', () => {
  it('should complete full lifecycle flow: discover -> validate -> load -> initialize -> start -> stop', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'andromeda-story3-'));
    const modulePath = path.join(tmp, 'module-test');
    await fs.mkdir(modulePath, { recursive: true });

    await fs.writeFile(path.join(modulePath, 'module.manifest.yaml'), `id: mod-test\nname: Test Module\ngroup: test\nvariant: default\nversion: 1.0.0\nentrypoint: ./index.js\ncontracts:\n  input: ./contracts/input.ts\n  output: ./contracts/output.ts\ncapabilities:\n  - run\nstatus: active\ncritical: false\ndependencies: []\n`);

    // Discover
    const discoverRes = await request(server.server).post('/api/modules/discover').send({ rootPath: tmp });
    expect(discoverRes.status).toBe(200);
    expect(discoverRes.body.registered).toHaveLength(1);

    const moduleId = discoverRes.body.registered[0].id;

    // Validate
    const validateRes = await request(server.server).post(`/api/modules/${moduleId}/validate`);
    expect(validateRes.status).toBe(200);
    expect(validateRes.body.valid).toBe(true);

    // Load
    const loadRes = await request(server.server).post(`/api/modules/${moduleId}/load`);
    expect(loadRes.status).toBe(200);

    // Check status after load
    const statusAfterLoad = await request(server.server).get(`/api/modules/${moduleId}/status`);
    expect(statusAfterLoad.status).toBe(200);
    expect(statusAfterLoad.body.state).toBe('loaded');

    // Initialize (start)
    const startRes = await request(server.server).post(`/api/modules/${moduleId}/start`);
    expect(startRes.status).toBe(200);

    // Check status after start
    const statusAfterStart = await request(server.server).get(`/api/modules/${moduleId}/status`);
    expect(statusAfterStart.status).toBe(200);
    expect(statusAfterStart.body.state).toBe('running');

    // Stop
    const stopRes = await request(server.server).post(`/api/modules/${moduleId}/stop`);
    expect(stopRes.status).toBe(200);

    // Check status after stop
    const statusAfterStop = await request(server.server).get(`/api/modules/${moduleId}/status`);
    expect(statusAfterStop.status).toBe(200);
    expect(statusAfterStop.body.state).toBe('stopped');

    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('should initialize a loaded module and allocate resources', async () => {
    // Acceptance Scenario 1: Given um módulo carregado, When inicialização é solicitada, Then o módulo entra em estado ativo com recursos alocados.
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'andromeda-story3-init-'));
    const modulePath = path.join(tmp, 'module-init');
    await fs.mkdir(modulePath, { recursive: true });

    await fs.writeFile(path.join(modulePath, 'module.manifest.yaml'), `id: mod-init\nname: Init Module\ngroup: test\nvariant: default\nversion: 1.0.0\nentrypoint: ./index.js\ncontracts:\n  input: ./contracts/input.ts\n  output: ./contracts/output.ts\ncapabilities:\n  - run\nstatus: active\ncritical: false\ndependencies: []\n`);

    // Discover and prepare to loaded state
    const discoverRes = await request(server.server).post('/api/modules/discover').send({ rootPath: tmp });
    expect(discoverRes.status).toBe(200);
    const moduleId = discoverRes.body.registered[0].id;

    const validateRes = await request(server.server).post(`/api/modules/${moduleId}/validate`);
    expect(validateRes.status).toBe(200);

    const loadRes = await request(server.server).post(`/api/modules/${moduleId}/load`);
    expect(loadRes.status).toBe(200);

    // Start (initialize)
    const startRes = await request(server.server).post(`/api/modules/${moduleId}/start`);
    expect(startRes.status).toBe(200);

    // Check status
    const statusRes = await request(server.server).get(`/api/modules/${moduleId}/status`);
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.state).toBe('running'); // assuming start sets to running

    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('should stop an active module and release resources', async () => {
    // Acceptance Scenario 2: Given um módulo ativo, When parada é solicitada, Then o módulo é finalizado e recursos liberados.
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'andromeda-story3-stop-'));
    const modulePath = path.join(tmp, 'module-stop');
    await fs.mkdir(modulePath, { recursive: true });

    await fs.writeFile(path.join(modulePath, 'module.manifest.yaml'), `id: mod-stop\nname: Stop Module\ngroup: test\nvariant: default\nversion: 1.0.0\nentrypoint: ./index.js\ncontracts:\n  input: ./contracts/input.ts\n  output: ./contracts/output.ts\ncapabilities:\n  - run\nstatus: active\ncritical: false\ndependencies: []\n`);

    // Discover, validate, load, start
    const discoverRes = await request(server.server).post('/api/modules/discover').send({ rootPath: tmp });
    expect(discoverRes.status).toBe(200);
    const moduleId = discoverRes.body.registered[0].id;

    await request(server.server).post(`/api/modules/${moduleId}/validate`);
    await request(server.server).post(`/api/modules/${moduleId}/load`);
    await request(server.server).post(`/api/modules/${moduleId}/start`);

    // Stop
    const stopRes = await request(server.server).post(`/api/modules/${moduleId}/stop`);
    expect(stopRes.status).toBe(200);

    // Check status
    const statusRes = await request(server.server).get(`/api/modules/${moduleId}/status`);
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.state).toBe('stopped');

    await fs.rm(tmp, { recursive: true, force: true });
  });
});