import { InMemoryRegistry } from './inMemoryRegistry';
import { registerModule as persistModule, getModuleById as persistGetModuleById } from '../store/postgresRegistry';
import pino from 'pino';
import { SAFETY } from '../config/safety';
const logger = pino({ name: 'moduleRegistry' });
export class ModuleRegistryService {
    constructor() {
        this.memoryRegistry = new InMemoryRegistry();
    }
    async discoverAndRegister(manifests) {
        logger.info({ count: manifests.length }, 'Starting module discovery and registration');
        const registered = [];
        for (const manifest of manifests) {
            if (manifest.status !== 'active') {
                logger.debug({ moduleId: manifest.id, status: manifest.status }, 'Skipping non-active module');
                continue; // skip non-active modules
            }
            const record = this.memoryRegistry.register(manifest, 'registered');
            logger.info({ moduleId: manifest.id, group: manifest.group, variant: manifest.variant }, 'Registered module in memory');
            try {
                await persistModule({
                    moduleId: manifest.id,
                    groupName: manifest.group,
                    variantName: manifest.variant,
                    version: manifest.version,
                    status: record.state,
                    capabilities: manifest.capabilities,
                    contracts: manifest.contracts
                });
                logger.debug({ moduleId: manifest.id }, 'Persisted module to database');
            }
            catch (error) {
                if (SAFETY.PG_REQUIRED) {
                    throw new Error('PG required');
                }
                logger.warn({ moduleId: manifest.id, error: error.message }, 'Failed to persist module, continuing with in-memory registry');
            }
            registered.push(record);
        }
        const registrySize = this.memoryRegistry.list().length;
        if (registrySize > 100) {
            logger.warn({ registrySize, threshold: 100 }, 'Registry size exceeds threshold');
        }
        logger.info({ registeredCount: registered.length }, 'Completed module discovery and registration');
        return registered;
    }
    list() {
        const modules = this.memoryRegistry.list();
        logger.debug({ count: modules.length }, 'Listed modules');
        return modules;
    }
    async get(id) {
        logger.debug({ moduleId: id }, 'Retrieving module');
        const inMemory = this.memoryRegistry.get(id);
        if (inMemory) {
            logger.debug({ moduleId: id }, 'Retrieved from memory');
            return inMemory;
        }
        const persisted = await persistGetModuleById(id);
        if (persisted.length > 0) {
            const row = persisted[0];
            const module = {
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
            logger.debug({ moduleId: id }, 'Retrieved from database');
            return module;
        }
        logger.warn({ moduleId: id }, 'Module not found');
        return null;
    }
    setState(id, state) {
        logger.info({ moduleId: id, state }, 'Setting module state');
        return this.memoryRegistry.setState(id, state);
    }
}
//# sourceMappingURL=moduleRegistry.js.map