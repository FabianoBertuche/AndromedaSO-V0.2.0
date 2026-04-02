import { ModuleRegistryRecord } from './inMemoryRegistry';
import { ModuleManifest } from '../contracts/moduleManifest.schema';
import { LifecycleState } from '../contracts/lifecycle.schema';
export declare class ModuleRegistryService {
    private readonly memoryRegistry;
    discoverAndRegister(manifests: ModuleManifest[]): Promise<ModuleRegistryRecord[]>;
    list(): ModuleRegistryRecord[];
    get(id: string): Promise<ModuleRegistryRecord | null>;
    setState(id: string, state: LifecycleState): ModuleRegistryRecord;
}
