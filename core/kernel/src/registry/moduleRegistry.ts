import { InMemoryRegistry, ModuleRegistryRecord } from './inMemoryRegistry';
import { registerModule as persistModule, getModuleById as persistGetModuleById } from '../store/postgresRegistry';
import { ModuleManifest } from '../contracts/moduleManifest.schema';
import { LifecycleState } from '../contracts/lifecycle.schema';

export class ModuleRegistryService {
  private readonly memoryRegistry = new InMemoryRegistry();

  async discoverAndRegister(manifests: ModuleManifest[]): Promise<ModuleRegistryRecord[]> {
    const registered: ModuleRegistryRecord[] = [];

    for (const manifest of manifests) {
      if (manifest.status !== 'active') {
        continue; // skip non-active modules
      }

      const record = this.memoryRegistry.register(manifest, 'registered');

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
      } catch (error) {
        // If persistence is temporarily unavailable, keep working with in-memory registry
      }

      registered.push(record);
    }

    return registered;
  }

  list() {
    return this.memoryRegistry.list();
  }

  async get(id: string) {
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
        state: row.status as LifecycleState
      } as ModuleRegistryRecord;
    }

    return null;
  }

  setState(id: string, state: LifecycleState) {
    return this.memoryRegistry.setState(id, state);
  }
}
