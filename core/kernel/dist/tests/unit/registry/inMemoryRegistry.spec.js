import { describe, it, expect } from 'vitest';
import { InMemoryRegistry } from '../../../src/registry/inMemoryRegistry';
describe('in-memory registry', () => {
    it('registers and retrieves modules', () => {
        const registry = new InMemoryRegistry();
        const manifest = {
            id: 'mod-x',
            name: 'Module X',
            group: 'test',
            variant: 'default',
            version: '1.0.0',
            entrypoint: './index.js',
            contracts: { input: 'a', output: 'b' },
            capabilities: ['c'],
            status: 'active',
            critical: false,
            dependencies: []
        };
        const record = registry.register(manifest);
        expect(record.state).toBe('discovered');
        expect(registry.get('mod-x')).toEqual(record);
        expect(registry.list()).toHaveLength(1);
        const updated = registry.setState('mod-x', 'registered');
        expect(updated.state).toBe('registered');
    });
    it('prevents double registration', () => {
        const registry = new InMemoryRegistry();
        const manifest = { id: 'mod-x', name: 'x', group: 'g', variant: 'd', version: '1.0.0', entrypoint: './x', contracts: { input: 'i', output: 'o' }, capabilities: [], status: 'active', critical: false, dependencies: [] };
        registry.register(manifest);
        expect(() => registry.register(manifest)).toThrow();
    });
});
//# sourceMappingURL=inMemoryRegistry.spec.js.map