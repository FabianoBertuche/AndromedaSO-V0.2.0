import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import { buildServer } from '../../src/server';
let server;
beforeEach(async () => {
    server = buildServer();
    await server.ready();
});
afterEach(async () => {
    await server.close();
});
describe('User Story 2: Module Validation and Loading APIs', () => {
    it('validates a module with valid contract and approves for loading', async () => {
        const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'andromeda-story2-validate-'));
        const modulePath = path.join(tmp, 'module-valid');
        await fs.mkdir(modulePath, { recursive: true });
        const manifest = `id: mod-valid
name: Module Valid
group: test
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
        await fs.writeFile(path.join(modulePath, 'module.manifest.yaml'), manifest);
        // First discover and register
        const discoverRes = await request(server.server).post('/api/modules/discover').send({ rootPath: tmp });
        expect(discoverRes.status).toBe(200);
        const moduleId = discoverRes.body.registered[0].id;
        // Then validate
        const validateRes = await request(server.server).post(`/api/modules/${moduleId}/validate`).send({});
        if (validateRes.status !== 200) {
            console.error('VALIDATE FAILED:', validateRes.body);
        }
        expect(validateRes.status).toBe(200);
        expect(validateRes.body).toMatchObject({ valid: true, state: 'validated' });
        await fs.rm(tmp, { recursive: true, force: true });
    });
    it('rejects a module with invalid contract', async () => {
        const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'andromeda-story2-invalid-'));
        const modulePath = path.join(tmp, 'module-invalid');
        await fs.mkdir(modulePath, { recursive: true });
        const manifest = `id: mod-invalid
name: Module Invalid
group: test
variant: default
version: 1.0.0
entrypoint: ./index.js
contracts:
  input: ''
  output: ''
capabilities: []
status: active
critical: false
dependencies: []
`;
        await fs.writeFile(path.join(modulePath, 'module.manifest.yaml'), manifest);
        // Discover and register
        const discoverRes = await request(server.server).post('/api/modules/discover').send({ rootPath: tmp });
        expect(discoverRes.status).toBe(200);
        const moduleId = discoverRes.body.registered[0].id;
        // Attempt validation
        const validateRes = await request(server.server).post(`/api/modules/${moduleId}/validate`).send({});
        expect(validateRes.status).toBe(400);
        expect(validateRes.body).toMatchObject({ valid: false, error: expect.any(String) });
        await fs.rm(tmp, { recursive: true, force: true });
    });
    it('loads a validated module and transitions state', async () => {
        const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'andromeda-story2-load-'));
        const modulePath = path.join(tmp, 'module-load-test');
        await fs.mkdir(modulePath, { recursive: true });
        const manifest = `id: mod-load
name: Module Load Test
group: test
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
        await fs.writeFile(path.join(modulePath, 'module.manifest.yaml'), manifest);
        // Discover and register
        const discoverRes = await request(server.server).post('/api/modules/discover').send({ rootPath: tmp });
        const moduleId = discoverRes.body.registered[0].id;
        // Validate
        const validateRes = await request(server.server).post(`/api/modules/${moduleId}/validate`).send({});
        expect(validateRes.status).toBe(200);
        // Load
        const loadRes = await request(server.server).post(`/api/modules/${moduleId}/load`).send({});
        expect(loadRes.status).toBe(200);
        expect(loadRes.body).toMatchObject({ state: 'loaded' });
        await fs.rm(tmp, { recursive: true, force: true });
    });
});
//# sourceMappingURL=userStory2.integration.spec.js.map