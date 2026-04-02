import { LifecycleStateMachine } from './stateMachine';
import { ModuleRegistryRecord } from '../registry/inMemoryRegistry';
export declare class LoadModuleError extends Error {
    moduleId: string;
    constructor(moduleId: string, message: string);
}
export declare function validateAndLoadModule(module: ModuleRegistryRecord, allModules: ModuleRegistryRecord[]): Promise<{
    valid: boolean;
    error?: string;
}>;
export declare function loadModule(module: ModuleRegistryRecord, stateMachine: LifecycleStateMachine): Promise<{
    state: "discovered" | "registered" | "validated" | "loaded" | "initialized" | "running" | "stopped" | "failed";
}>;
