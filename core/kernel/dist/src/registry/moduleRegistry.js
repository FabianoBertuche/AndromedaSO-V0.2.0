import { InMemoryRegistry } from './inMemoryRegistry';
import { registerModule as persistModule, getModuleById as persistGetModuleById } from '../store/postgresRegistry';
export class ModuleRegistryService {
    constructor() {
        this.memoryRegistry = new InMemoryRegistry();
    }
    async discoverAndRegister(manifests) {
        const registered = [];
        for (const manifest of manifests) {
            if (manifest.status !== 'active') {
                continue; // skip non-active modules
            }
            const record = this.memoryRegistry.register(manifest, 'registered');
            await persistModule({
                moduleId: manifest.id,
                groupName: manifest.group,
                variantName: manifest.variant,
                version: manifest.version,
                status: record.state,
                capabilities: manifest.capabilities,
                contracts: manifest.contracts
            });
            registered.push(record);
        }
        return registered;
    }
    list() {
        return this.memoryRegistry.list();
    }
    async get(id) {
        const inMemory = this.memoryRegistry.get(id);
        if (inMemory) {
            return inMemory;
        }
        const persisted = await persistGetModuleById(id);
        if (persisted.length > 0) {
            const row = persisted[0];
            return {
                id: row.moduleId,
                name: row.groupName,
                group: row.groupName,
                variant: row.variantName,
                version: row.version,
                entrypoint: '',
                contracts: row.contracts,
                capabilities: row.capabilities,
                status: row.status,
                critical: false,
                dependencies: [],
                state: row.status
            };
        }
        return null;
    }
    setState(id, state) {
        return this.memoryRegistry.setState(id, state);
    }
}
//# sourceMappingURL=moduleRegistry.js.map