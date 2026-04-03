import { z } from 'zod';
import pino from 'pino';

const logger = pino({ name: 'contractValidator' });

export class ContractValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContractValidationError';
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Schema to validate contract paths (input and output are file paths)
const contractPathsSchema = z.object({
  input: z.string().min(1, 'input contract path must not be empty'),
  output: z.string().min(1, 'output contract path must not be empty'),
  version: z.string().optional()
});

export function validateContract(contracts: unknown): ValidationResult {
  logger.debug({ contracts }, 'Validating contract');
  const errors: string[] = [];

  try {
    contractPathsSchema.parse(contracts);
    logger.debug('Contract validation successful');
  } catch (err) {
    if (err instanceof z.ZodError) {
      errors.push(...err.errors.map(e => `${e.path.join('.')}: ${e.message}`));
      logger.warn({ errors }, 'Contract validation failed');
    } else {
      errors.push(`Invalid contracts: ${err}`);
      logger.error({ error: (err as any).message }, 'Contract validation error');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function ensureContractValid(contracts: unknown) {
  const result = validateContract(contracts);
  if (!result.valid) {
    logger.error({ errors: result.errors }, 'Contract validation failed, throwing error');
    throw new ContractValidationError(result.errors.join('; '));
  }
}
