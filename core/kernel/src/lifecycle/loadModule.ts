import { LifecycleStateMachine } from './stateMachine';
import { ensureContractValid } from '../validation/contractValidator';
import { ModuleRegistryRecord } from '../registry/inMemoryRegistry';
import { detectCircularDependencies } from '../validation/dependencyValidator';

export class LoadModuleError extends Error {
  constructor(public moduleId: string, message: string) {
    super(message);
    this.name = 'LoadModuleError';
  }
}

export async function validateAndLoadModule(
  module: ModuleRegistryRecord,
  allModules: ModuleRegistryRecord[]
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Validate contracts exist and have required fields
    if (!module.contracts) {
      return { valid: false, error: 'Module missing contracts definition' };
    }

    ensureContractValid(module.contracts);

    // Check for circular dependencies
    if (detectCircularDependencies(allModules)) {
      return { valid: false, error: 'Circular dependencies detected' };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, error: (err as any).message };
  }
}

export async function loadModule(module: ModuleRegistryRecord, stateMachine: LifecycleStateMachine) {
  try {
    stateMachine.transition('loaded');
    return { state: stateMachine.current() };
  } catch (err) {
    throw new LoadModuleError(module.id, (err as any).message);
  }
}
