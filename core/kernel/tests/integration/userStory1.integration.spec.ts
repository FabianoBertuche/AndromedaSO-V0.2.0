import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import request from 'supertest';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import { buildServer } from '../../src/server';

let server: any;

beforeEach(async () => {
  server = buildServer();
  await server.ready();
});
afterEach(async () => {
  await server.close();
});

describe('User Story 1: Module Discovery and Registration APIs', () => {
  it('registers a valid module from a single root', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'andromeda-story1-'));
    const modulePath = path.join(tmp, 'module-a');
    await fs.mkdir(modulePath, { recursive: true });

    await fs.writeFile(path.join(modulePath, 'module.manifest.yaml'), `id: mod-a\nname: Module A\ngroup: group1\nvariant: default\nversion: 1.0.0\nentrypoint: ./index.js\ncontracts:\n  input: ./contracts/input.ts\n  output: ./contracts/output.ts\ncapabilities:\n  - run\nstatus: active\ncritical: false\ndependencies: []\n`);

    const res = await request(server.server).post('/api/modules/discover').send({ rootPath: tmp });

    expect(res.status).toBe(200);
    expect(res.body.registered).toHaveLength(1);
    expect(res.body.registered[0]).toMatchObject({ id: 'mod-a', name: 'Module A', group: 'group1', variant: 'default' });

    const listRes = await request(server.server).get('/api/modules');
    expect(listRes.status).toBe(200);
    expect(listRes.body.modules).toHaveLength(1);

    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('registers multiple modules from different groups/variants', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'andromeda-story1-')); 
    const moduleA = path.join(tmp, 'module-a');
    const moduleB = path.join(tmp, 'module-b');
    await fs.mkdir(moduleA, { recursive: true });
    await fs.mkdir(moduleB, { recursive: true });

    await fs.writeFile(moduleA + '/module.manifest.yaml', `id: mod-a\nname: Module A\ngroup: group1\nvariant: v1\nversion: 1.0.0\nentrypoint: ./index.js\ncontracts:\n  input: ./contracts/input.ts\n  output: ./contracts/output.ts\ncapabilities:\n  - run\nstatus: active\ncritical: false\ndependencies: []\n`);
    await fs.writeFile(moduleB + '/module.manifest.yaml', `id: mod-b\nname: Module B\ngroup: group2\nvariant: v2\nversion: 1.0.0\nentrypoint: ./index.js\ncontracts:\n  input: ./contracts/input.ts\n  output: ./contracts/output.ts\ncapabilities:\n  - run\nstatus: active\ncritical: false\ndependencies: []\n`);

    const res = await request(server.server).post('/api/modules/discover').send({ rootPath: tmp });
    if (res.status !== 200) {
      console.error('DISCOVER FAILED', res.body);
    }
    expect(res.status).toBe(200);
    expect(res.body.registered).toHaveLength(2);

    const ids = res.body.registered.map((m: any) => m.id);
    expect(ids).toContain('mod-a');
    expect(ids).toContain('mod-b');

    const listRes = await request(server.server).get('/api/modules');
    expect(listRes.body.modules).toHaveLength(2);

    await fs.rm(tmp, { recursive: true, force: true });
  });
});
