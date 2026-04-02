import { z } from 'zod';
export class ContractValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ContractValidationError';
    }
}
// Schema to validate contract paths (input and output are file paths)
const contractPathsSchema = z.object({
    input: z.string().min(1, 'input contract path must not be empty'),
    output: z.string().min(1, 'output contract path must not be empty'),
    version: z.string().optional()
});
export function validateContract(contracts) {
    const errors = [];
    try {
        contractPathsSchema.parse(contracts);
    }
    catch (err) {
        if (err instanceof z.ZodError) {
            errors.push(...err.errors.map(e => `${e.path.join('.')}: ${e.message}`));
        }
        else {
            errors.push(`Invalid contracts: ${err}`);
        }
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
export function ensureContractValid(contracts) {
    const result = validateContract(contracts);
    if (!result.valid) {
        throw new ContractValidationError(result.errors.join('; '));
    }
}
//# sourceMappingURL=contractValidator.js.map