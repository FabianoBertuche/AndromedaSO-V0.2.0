import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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

describe('User Story 4: Coherent System Growth APIs', () => {
  it('adds a new module type via contracts without breaking existing modules', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'andromeda-story4-'));
    const modulePath = path.join(tmp, 'module-existing');
    const newTypePath = path.join(tmp, 'module-new-type');
    await fs.mkdir(modulePath, { recursive: true });
    await fs.mkdir(newTypePath, { recursive: true });

    // Existing module
    const existingManifest = `id: mod-existing
name: Existing Module
group: core
variant: default
version: 1.0.0
entrypoint: ./index.js
contracts:
  input: ./contracts/input.ts
  output: ./contracts/output.ts
capabilities:
  - run
status: active
critical: false
dependencies: []
`;

    // New type module
    const newTypeManifest = `id: mod-new-type
name: New Type Module
group: plugin
variant: extended
version: 1.0.0
entrypoint: ./index.js
contracts:
  input: ./contracts/input.ts
  output: ./contracts/output.ts
  extension: ./contracts/extension.ts
capabilities:
  - run
  - extend
status: active
critical: false
dependencies: []
`;

    await fs.writeFile(path.join(modulePath, 'module.manifest.yaml'), existingManifest);
    await fs.writeFile(path.join(newTypePath, 'module.manifest.yaml'), newTypeManifest);

    // Discover all
    const discoverRes = await request(server.server).post('/api/modules/discover').send({ rootPath: tmp });
    expect(discoverRes.status).toBe(200);
    expect(discoverRes.body.registered).toHaveLength(2);

    const existingId = discoverRes.body.registered.find((m: any) => m.id === 'mod-existing').id;
    const newTypeId = discoverRes.body.registered.find((m: any) => m.id === 'mod-new-type').id;

    // Validate existing module still works
    const validateExisting = await request(server.server).post(`/api/modules/${existingId}/validate`);
    expect(validateExisting.status).toBe(200);
    expect(validateExisting.body.valid).toBe(true);

    // Validate new type module
    const validateNew = await request(server.server).post(`/api/modules/${newTypeId}/validate`);
    expect(validateNew.status).toBe(200);
    expect(validateNew.body.valid).toBe(true);

    // Load existing
    const loadExisting = await request(server.server).post(`/api/modules/${existingId}/load`);
    expect(loadExisting.status).toBe(200);

    // Load new type
    const loadNew = await request(server.server).post(`/api/modules/${newTypeId}/load`);
    expect(loadNew.status).toBe(200);

    // Start existing
    const startExisting = await request(server.server).post(`/api/modules/${existingId}/start`);
    expect(startExisting.status).toBe(200);

    // Start new type
    const startNew = await request(server.server).post(`/api/modules/${newTypeId}/start`);
    expect(startNew.status).toBe(200);

    // Check statuses
    const statusExisting = await request(server.server).get(`/api/modules/${existingId}/status`);
    expect(statusExisting.status).toBe(200);
    expect(statusExisting.body.state).toBe('running');

    const statusNew = await request(server.server).get(`/api/modules/${newTypeId}/status`);
    expect(statusNew.status).toBe(200);
    expect(statusNew.body.state).toBe('running');

    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('introduces new structural capability absorbed by core via contracts and registry', async () => {
    // Test that new capabilities are registered without ad-hoc coupling
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'andromeda-story4-capability-'));
    const modulePath = path.join(tmp, 'module-capability');
    await fs.mkdir(modulePath, { recursive: true });

    const manifest = `id: mod-capability
name: Capability Module
group: system
variant: enhanced
version: 1.0.0
entrypoint: ./index.js
contracts:
  input: ./contracts/input.ts
  output: ./contracts/output.ts
  capability: ./contracts/capability.ts
capabilities:
  - run
  - monitor
status: active
critical: false
dependencies: []
`;

    await fs.writeFile(path.join(modulePath, 'module.manifest.yaml'), manifest);

    // Discover
    const discoverRes = await request(server.server).post('/api/modules/discover').send({ rootPath: tmp });
    expect(discoverRes.status).toBe(200);
    const moduleId = discoverRes.body.registered[0].id;

    // Validate and load
    await request(server.server).post(`/api/modules/${moduleId}/validate`);
    await request(server.server).post(`/api/modules/${moduleId}/load`);
    await request(server.server).post(`/api/modules/${moduleId}/start`);

    // Verify the new capability is registered and accessible
    const moduleRes = await request(server.server).get(`/api/modules/${moduleId}`);
    expect(moduleRes.status).toBe(200);
    expect(moduleRes.body.capabilities).toContain('monitor');

    await fs.rm(tmp, { recursive: true, force: true });
  });
});