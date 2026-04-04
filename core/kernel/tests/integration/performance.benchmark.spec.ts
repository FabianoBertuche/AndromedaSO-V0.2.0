import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import { buildServer } from '../../src/server';

let server: any;

async function runInBatches<T>(items: T[], batchSize: number, worker: (item: T) => Promise<unknown>) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(worker));
  }
}

beforeEach(async () => {
  server = await buildServer(false);
  await server.ready();
});

afterEach(async () => {
  await server.close();
});

describe('Performance Benchmark: 100 Modules', () => {
  it('should discover and register 100 modules in under 5 seconds', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'andromeda-benchmark-'));
    
    // Create 100 modules
    const modulePromises = [];
    for (let i = 0; i < 100; i++) {
      const modulePath = path.join(tmp, `module-${i}`);
      modulePromises.push(fs.mkdir(modulePath, { recursive: true }).then(() => {
        const manifest = `id: mod-${i}
name: Module ${i}
group: bench
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
        return fs.writeFile(path.join(modulePath, 'module.manifest.yaml'), manifest);
      }));
    }
    
    await Promise.all(modulePromises);
    
    const startTime = Date.now();
    const discoverRes = await request(server.server).post('/api/modules/discover').send({ rootPath: tmp });
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(discoverRes.status).toBe(200);
    expect(discoverRes.body.registered).toHaveLength(100);
    expect(duration).toBeLessThan(5000); // SC-001: under 5 seconds
    
    console.log(`Discovery and registration of 100 modules took ${duration}ms`);
    
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('should validate contracts with >95% success rate', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'andromeda-validation-bench-'));
    
    // Create 100 valid modules
    const modulePromises = [];
    for (let i = 0; i < 100; i++) {
      const modulePath = path.join(tmp, `module-${i}`);
      modulePromises.push(fs.mkdir(modulePath, { recursive: true }).then(() => {
        const manifest = `id: mod-${i}
name: Module ${i}
group: bench
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
        return fs.writeFile(path.join(modulePath, 'module.manifest.yaml'), manifest);
      }));
    }
    
    await Promise.all(modulePromises);
    
    // Discover
    const discoverRes = await request(server.server).post('/api/modules/discover').send({ rootPath: tmp });
    expect(discoverRes.status).toBe(200);
    
    // Validate all
    const validationPromises = discoverRes.body.registered.map((mod: any) => 
      request(server.server).post(`/api/modules/${mod.id}/validate`)
    );
    
    const validationResults = await Promise.all(validationPromises);
    const passed = validationResults.filter((res: any) => res.status === 200 && res.body.valid).length;
    const successRate = (passed / 100) * 100;
    
    expect(successRate).toBeGreaterThan(95); // SC-002: >95% success rate
    
    console.log(`Validation success rate: ${successRate}%`);
    
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('should load modules with average time <2 seconds', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'andromeda-load-bench-'));
    
    // Create 10 modules for loading benchmark
    const modulePromises = [];
    for (let i = 0; i < 10; i++) {
      const modulePath = path.join(tmp, `module-${i}`);
      modulePromises.push(fs.mkdir(modulePath, { recursive: true }).then(() => {
        const manifest = `id: mod-${i}
name: Module ${i}
group: bench
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
        return fs.writeFile(path.join(modulePath, 'module.manifest.yaml'), manifest);
      }));
    }
    
    await Promise.all(modulePromises);
    
    // Discover and prepare
    const discoverRes = await request(server.server).post('/api/modules/discover').send({ rootPath: tmp });
    expect(discoverRes.status).toBe(200);
    
    // Validate all
    const validatePromises = discoverRes.body.registered.map((mod: any) => 
      request(server.server).post(`/api/modules/${mod.id}/validate`)
    );
    await Promise.all(validatePromises);
    
    // Load all and measure time
    const loadStartTime = Date.now();
    const loadPromises = discoverRes.body.registered.map((mod: any) => 
      request(server.server).post(`/api/modules/${mod.id}/load`)
    );
    await Promise.all(loadPromises);
    const loadEndTime = Date.now();
    const avgLoadTime = (loadEndTime - loadStartTime) / 10;
    
    expect(avgLoadTime).toBeLessThan(2000); // SC-003: <2 seconds average
    
    console.log(`Average load time: ${avgLoadTime}ms`);
    
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('should maintain consistent state with 100 modules lifecycle', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'andromeda-state-bench-'));
    
    // Create 100 modules
    const modulePromises = [];
    for (let i = 0; i < 100; i++) {
      const modulePath = path.join(tmp, `module-${i}`);
      modulePromises.push(fs.mkdir(modulePath, { recursive: true }).then(() => {
        const manifest = `id: mod-${i}
name: Module ${i}
group: bench
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
        return fs.writeFile(path.join(modulePath, 'module.manifest.yaml'), manifest);
      }));
    }
    
    await Promise.all(modulePromises);
    
    // Discover
    const discoverRes = await request(server.server).post('/api/modules/discover').send({ rootPath: tmp });
    expect(discoverRes.status).toBe(200);
    expect(discoverRes.body.registered).toHaveLength(100);
    
    // Validate/load/start/status with controlled concurrency to avoid socket resets under heavy load
    await runInBatches(discoverRes.body.registered, 20, async (mod: any) => {
      await request(server.server).post(`/api/modules/${mod.id}/validate`);
    });

    await runInBatches(discoverRes.body.registered, 20, async (mod: any) => {
      await request(server.server).post(`/api/modules/${mod.id}/load`);
    });

    await runInBatches(discoverRes.body.registered, 20, async (mod: any) => {
      await request(server.server).post(`/api/modules/${mod.id}/start`);
    });

    const statusResults: any[] = [];
    await runInBatches(discoverRes.body.registered, 20, async (mod: any) => {
      const res = await request(server.server).get(`/api/modules/${mod.id}/status`);
      statusResults.push(res);
    });
    
    const runningCount = statusResults.filter((res: any) => res.body.state === 'running').length;
    expect(runningCount).toBe(100); // SC-004: consistent state
    
    console.log(`All 100 modules in consistent running state`);
    
    await fs.rm(tmp, { recursive: true, force: true });
  });
});