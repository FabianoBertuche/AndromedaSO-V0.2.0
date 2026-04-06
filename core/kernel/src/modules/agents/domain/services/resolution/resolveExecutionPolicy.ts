import pino from 'pino';
import type { RetryPolicy } from '../../../../../contracts/schemas';

const log = pino({ name: 'agents:resolve-execution-policy' });

export interface ExecutionPolicyInputs {
  temperature?: number;
  topP?: number;
  maxTokens?: number | null;
  responseFormat?: string;
  reasoningMode?: string | null;
  timeoutMs?: number;
  retryPolicy?: RetryPolicy;
}

export interface EffectiveExecutionPolicy {
  temperature: number;
  topP: number;
  maxTokens: number | null;
  responseFormat: string;
  reasoningMode: string | null;
  timeoutMs: number;
  retryPolicy: RetryPolicy;
}

/**
 * Resolve o effectiveExecutionPolicy consolidando:
 * - temperature (default: 0.7)
 * - topP (default: 1.0)
 * - maxTokens (default: null)
 * - responseFormat (default: "markdown")
 * - reasoningMode (default: null)
 * - timeoutMs (default: 30000)
 * - retryPolicy (default: { maxRetries: 0, backoffMs: 0, strategy: "none" })
 */
export function resolveEffectiveExecutionPolicy(inputs: ExecutionPolicyInputs): EffectiveExecutionPolicy {
  const defaultRetryPolicy: RetryPolicy = {
    maxRetries: 0,
    backoffMs: 0,
    strategy: 'none'
  };

  const result: EffectiveExecutionPolicy = {
    temperature: inputs.temperature ?? 0.7,
    topP: inputs.topP ?? 1.0,
    maxTokens: inputs.maxTokens ?? null,
    responseFormat: inputs.responseFormat ?? 'markdown',
    reasoningMode: inputs.reasoningMode ?? null,
    timeoutMs: inputs.timeoutMs ?? 30000,
    retryPolicy: inputs.retryPolicy ?? defaultRetryPolicy
  };

  log.debug({
    temperature: result.temperature,
    topP: result.topP,
    maxTokens: result.maxTokens,
    responseFormat: result.responseFormat,
    reasoningMode: result.reasoningMode,
    timeoutMs: result.timeoutMs,
    retryPolicy: result.retryPolicy
  }, 'Resolved effective execution policy');

  return result;
}
