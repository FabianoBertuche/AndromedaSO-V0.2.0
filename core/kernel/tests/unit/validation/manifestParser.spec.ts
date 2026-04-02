import { describe, it, expect } from 'vitest';
import { parseModuleManifestString } from '../../../src/validation/manifestParser';

const validYaml = `
id: mod-1
name: Module One
group: core
variant: default
version: 1.0.0
entrypoint: ./dist/index.js
contracts:
  input: ./contracts/input.ts
  output: ./contracts/output.ts
`; 

describe('manifest parser', () => {
  it('parses valid YAML manifest', () => {
    const result = parseModuleManifestString(validYaml);
    expect(result).toMatchObject({ id: 'mod-1', status: 'active', critical: false });
  });

  it('throws for invalid manifest', () => {
    const invalidYaml = 'id: mod-2\nname: NoVersion';
    expect(() => parseModuleManifestString(invalidYaml)).toThrow();
  });
});
