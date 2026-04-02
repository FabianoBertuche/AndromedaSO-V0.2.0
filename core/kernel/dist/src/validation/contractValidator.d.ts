export declare class ContractValidationError extends Error {
    constructor(message: string);
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
export declare function validateContract(contracts: unknown): ValidationResult;
export declare function ensureContractValid(contracts: unknown): void;
