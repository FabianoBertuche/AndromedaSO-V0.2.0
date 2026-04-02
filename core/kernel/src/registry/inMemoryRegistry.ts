import { ModuleManifest } from '../contracts/moduleManifest.schema';
import { LifecycleState } from '../contracts/lifecycle.schema';

export interface ModuleRegistryRecord extends ModuleManifest {
  state: LifecycleState;
}

export class InMemoryRegistry {
  private readonly modules = new Map<string, ModuleRegistryRecord>();

  register(manifest: ModuleManifest, initialState: LifecycleState = 'discovered') {
    if (this.modules.has(manifest.id)) {
      throw new Error(`Module ${manifest.id} is already registered`);
    }

    const record: ModuleRegistryRecord = { ...manifest, state: initialState };
    this.modules.set(manifest.id, record);
    return record;
  }

  get(moduleId: string) {
    return this.modules.get(moduleId) ?? null;
  }

  list() {
    return Array.from(this.modules.values());
  }

  setState(moduleId: string, state: LifecycleState) {
    const record = this.modules.get(moduleId);
    if (!record) {
      throw new Error(`Module ${moduleId} not registered`);
    }

    record.state = state;
    this.modules.set(moduleId, record);
    return record;
  }
}
