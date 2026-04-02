import { describe, it, expect } from 'vitest';
import { validateModuleManifest } from '../../../src/contracts/moduleManifest.schema';

describe('module manifest schema', () => {
  it('validates a correct manifest', () => {
    const manifest = {
      id: 'mod-1',
      name: 'Module One',
      group: 'core',
      variant: 'default',
      version: '1.0.0',
      entrypoint: './dist/index.js',
      contracts: { input: './contracts/input.schema.ts', output: './contracts/output.schema.ts' },
      capabilities: ['run', 'api'],
      status: 'active',
      critical: true,
      dependencies: ['mod-2']
    };

    const result = validateModuleManifest(manifest);
    expect(result).toEqual(expect.objectContaining({ id: 'mod-1', status: 'active' }));
  });

  it('rejects manifest without required fields', () => {
    const manifest = {
      name: 'Missing ID',
      group: 'core',
      variant: 'default',
      version: '1.0.0',
      entrypoint: './index.js'
    };

    expect(() => validateModuleManifest(manifest)).toThrow();
  });

  it('rejects invalid semver version', () => {
    const manifest = {
      id: 'mod-2',
      name: 'Bad Semver',
      group: 'core',
      variant: 'default',
      version: '1.0',
      entrypoint: './index.js'
    };

    expect(() => validateModuleManifest(manifest)).toThrow();
  });
});
