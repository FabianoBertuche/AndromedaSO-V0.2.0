import { z } from 'zod';

export const retryStrategyEnum = z.enum(['none', 'fixed', 'exponential']);
export type RetryStrategy = z.infer<typeof retryStrategyEnum>;

export const retryPolicySchema = z.object({
  maxRetries: z.number().int().min(0).default(0),
  backoffMs: z.number().int().min(0).default(0),
  strategy: retryStrategyEnum.default('none')
});
export type RetryPolicy = z.infer<typeof retryPolicySchema>;
