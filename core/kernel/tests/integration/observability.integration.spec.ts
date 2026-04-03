import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import { buildServer } from '../../src/server';
import { metrics } from '../../src/config/metrics';
import { safetyMonitor } from '../../src/config/safetyMonitor';

let server: any;

beforeEach(async () => {
  metrics.reset();
  safetyMonitor.reset();
  server = buildServer(false);
  await server.ready();
});

afterEach(async () => {
  await server.close();
});

describe('Observability and Safety', () => {
  it('exposes metrics endpoint with runtime counters', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'andromeda-observability-'));
    const modulePath = path.join(tmp, 'module-metrics');
    await fs.mkdir(modulePath, { recursive: true });

    await fs.writeFile(path.join(modulePath, 'module.manifest.yaml'), `id: mod-metrics\nname: Module Metrics\ngroup: obs\nvariant: default\nversion: 1.0.0\nentrypoint: ./index.js\ncontracts:\n  input: ./contracts/input.ts\n  output: ./contracts/output.ts\ncapabilities:\n  - run\nstatus: active\ncritical: false\ndependencies: []\n`);

    await request(server.server).post('/api/modules/discover').send({ rootPath: tmp });
    const metricsRes = await request(server.server).get('/api/metrics');

    expect(metricsRes.status).toBe(200);
    expect(metricsRes.body.counters.modules_discovered).toBeGreaterThanOrEqual(1);
    expect(metricsRes.body.counters.modules_registered).toBeGreaterThanOrEqual(1);
    expect(metricsRes.body.gauges.registry_size).toBeGreaterThanOrEqual(1);

    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('detects retry storms on repeated start failures', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'andromeda-retry-storm-'));
    const modulePath = path.join(tmp, 'module-retry');
    await fs.mkdir(modulePath, { recursive: true });

    await fs.writeFile(path.join(modulePath, 'module.manifest.yaml'), `id: mod-retry\nname: Module Retry\ngroup: obs\nvariant: default\nversion: 1.0.0\nentrypoint: ./index.js\ncontracts:\n  input: ./contracts/input.ts\n  output: ./contracts/output.ts\ncapabilities:\n  - run\nstatus: active\ncritical: false\ndependencies: []\n`);

    const discoverRes = await request(server.server).post('/api/modules/discover').send({ rootPath: tmp });
    const moduleId = discoverRes.body.registered[0].id;

    // Force repeated start failures (cannot start from "registered" state)
    for (let i = 0; i < 6; i++) {
      const res = await request(server.server).post(`/api/modules/${moduleId}/start`);
      expect(res.status).toBe(500);
    }

    const metricsRes = await request(server.server).get('/api/metrics');
    expect(metricsRes.status).toBe(200);
    expect(metricsRes.body.counters.starts_failed).toBeGreaterThanOrEqual(6);
    // This counter is expected to be incremented by retry storm detection logic.
    expect(metricsRes.body.counters.retry_storm_alerts).toBeGreaterThanOrEqual(1);

    await fs.rm(tmp, { recursive: true, force: true });
  });
});
