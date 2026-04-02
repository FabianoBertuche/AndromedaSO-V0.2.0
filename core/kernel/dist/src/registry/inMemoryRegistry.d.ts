import { ModuleManifest } from '../contracts/moduleManifest.schema';
import { LifecycleState } from '../contracts/lifecycle.schema';
export interface ModuleRegistryRecord extends ModuleManifest {
    state: LifecycleState;
}
export declare class InMemoryRegistry {
    private readonly modules;
    register(manifest: ModuleManifest, initialState?: LifecycleState): ModuleRegistryRecord;
    get(moduleId: string): ModuleRegistryRecord | null;
    list(): ModuleRegistryRecord[];
    setState(moduleId: string, state: LifecycleState): ModuleRegistryRecord;
}
