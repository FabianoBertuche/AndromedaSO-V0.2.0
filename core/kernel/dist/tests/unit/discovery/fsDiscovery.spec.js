import { describe, it, expect } from 'vitest';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import { discoverModules } from '../../../src/discovery/fsDiscovery';
describe('filesystem discovery', () => {
    it('finds and parses module.manifest.yaml files recursively', async () => {
        const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'andromeda-discovery-'));
        const moduleDir = path.join(tmp, 'module-a');
        await fs.mkdir(moduleDir, { recursive: true });
        await fs.writeFile(path.join(moduleDir, 'module.manifest.yaml'), `id: mod-a\nname: Module A\ngroup: test\nvariant: default\nversion: 1.0.0\nentrypoint: ./index.js\n`);
        const found = await discoverModules(tmp);
        expect(found).toHaveLength(1);
        expect(found[0]).toMatchObject({ id: 'mod-a', name: 'Module A' });
        await fs.rm(tmp, { recursive: true, force: true });
    });
});
//# sourceMappingURL=fsDiscovery.spec.js.map