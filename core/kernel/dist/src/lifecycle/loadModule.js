import { ensureContractValid } from '../validation/contractValidator';
import { detectCircularDependencies } from '../validation/dependencyValidator';
export class LoadModuleError extends Error {
    constructor(moduleId, message) {
        super(message);
        this.moduleId = moduleId;
        this.name = 'LoadModuleError';
    }
}
export async function validateAndLoadModule(module, allModules) {
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
    }
    catch (err) {
        return { valid: false, error: err.message };
    }
}
export async function loadModule(module, stateMachine) {
    try {
        stateMachine.transition('loaded');
        return { state: stateMachine.current() };
    }
    catch (err) {
        throw new LoadModuleError(module.id, err.message);
    }
}
//# sourceMappingURL=loadModule.js.map