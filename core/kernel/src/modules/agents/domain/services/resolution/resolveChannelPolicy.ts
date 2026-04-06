import pino from 'pino';
import type { ChannelBehavior } from '../../../../../contracts/schemas/channelBehavior.schema.js';

const log = pino({ name: 'agents:resolve-channel-policy' });

export interface ChannelPolicyInputs {
  allowedChannels?: string[];
  defaultChannelBehavior?: ChannelBehavior;
  channelOverrides?: Record<string, ChannelBehavior>;
  channelConstraints?: string[];
}

export interface EffectiveChannelPolicy {
  allowedChannels: string[];
  defaultChannelBehavior: ChannelBehavior;
  channelOverrides: Record<string, ChannelBehavior>;
  constraints: string[];
}

/**
 * Resolve o effectiveChannelPolicy consolidando:
 * - allowedChannels (default: [])
 * - defaultChannelBehavior (default: {})
 * - channelOverrides (default: {})
 * - constraints (default: [])
 */
export function resolveEffectiveChannelPolicy(inputs: ChannelPolicyInputs): EffectiveChannelPolicy {
  const result: EffectiveChannelPolicy = {
    allowedChannels: inputs.allowedChannels ?? [],
    defaultChannelBehavior: inputs.defaultChannelBehavior ?? {},
    channelOverrides: inputs.channelOverrides ?? {},
    constraints: inputs.channelConstraints ?? []
  };

  log.debug({
    channelCount: result.allowedChannels.length,
    hasDefaultBehavior: Object.keys(result.defaultChannelBehavior).length > 0,
    hasOverrides: Object.keys(result.channelOverrides).length > 0,
    constraintsCount: result.constraints.length
  }, 'Resolved effective channel policy');

  return result;
}
