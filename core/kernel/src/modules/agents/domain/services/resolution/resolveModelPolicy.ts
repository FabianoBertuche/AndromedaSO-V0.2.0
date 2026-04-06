import pino from 'pino';

const log = pino({ name: 'agents:resolve-model-policy' });

export interface ModelPolicyInputs {
  preferredModel?: string | null;
  allowedModels?: string[];
  providerConstraints?: string[];
  reasoningMode?: string | null;
}

export interface EffectiveModelPolicy {
  preferredModel: string | null;
  allowedModels: string[];
  providerConstraints: string[];
  reasoningMode: string | null;
}

/**
 * Resolve o effectiveModelPolicy consolidando:
 * - preferredModel (default: null)
 * - allowedModels (default: [])
 * - providerConstraints (default: [])
 * - reasoningMode (default: null)
 */
export function resolveEffectiveModelPolicy(inputs: ModelPolicyInputs): EffectiveModelPolicy {
  const result: EffectiveModelPolicy = {
    preferredModel: inputs.preferredModel ?? null,
    allowedModels: inputs.allowedModels ?? [],
    providerConstraints: inputs.providerConstraints ?? [],
    reasoningMode: inputs.reasoningMode ?? null
  };

  log.debug({
    preferredModel: result.preferredModel,
    allowedModelsCount: result.allowedModels.length,
    providerConstraintsCount: result.providerConstraints.length,
    reasoningMode: result.reasoningMode
  }, 'Resolved effective model policy');

  return result;
}
