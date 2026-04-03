import { z } from 'zod';
import pino from 'pino';
const logger = pino({ name: 'contractValidator' });
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
    logger.debug({ contracts }, 'Validating contract');
    const errors = [];
    try {
        contractPathsSchema.parse(contracts);
        logger.debug('Contract validation successful');
    }
    catch (err) {
        if (err instanceof z.ZodError) {
            errors.push(...err.errors.map(e => `${e.path.join('.')}: ${e.message}`));
            logger.warn({ errors }, 'Contract validation failed');
        }
        else {
            errors.push(`Invalid contracts: ${err}`);
            logger.error({ error: err.message }, 'Contract validation error');
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
        logger.error({ errors: result.errors }, 'Contract validation failed, throwing error');
        throw new ContractValidationError(result.errors.join('; '));
    }
}
//# sourceMappingURL=contractValidator.js.map