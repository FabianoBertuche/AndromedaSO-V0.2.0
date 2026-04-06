import pino from 'pino';

const log = pino({ name: 'agents:resolve-system-prompt' });

export interface SystemPromptInputs {
  systemPrompt: string;
  operatingInstructions?: string[];
  doRules?: string[];
  dontRules?: string[];
}

/**
 * Resolve o effectiveSystemPrompt fazendo merge determinístico de:
 * - systemPrompt (base)
 * - operatingInstructions (complementares)
 * - doRules (regras positivas)
 * - dontRules (regras negativas)
 */
export function resolveEffectiveSystemPrompt(inputs: SystemPromptInputs): string {
  const parts: string[] = [];

  // 1. System prompt base
  if (inputs.systemPrompt && inputs.systemPrompt.trim()) {
    parts.push(`# Base Instructions\n${inputs.systemPrompt.trim()}`);
  }

  // 2. Operating instructions
  if (inputs.operatingInstructions && inputs.operatingInstructions.length > 0) {
    const instructionsText = inputs.operatingInstructions
      .map((inst, idx) => `${idx + 1}. ${inst}`)
      .join('\n');
    parts.push(`# Operating Instructions\n${instructionsText}`);
  }

  // 3. Do rules
  if (inputs.doRules && inputs.doRules.length > 0) {
    const doText = inputs.doRules
      .map((rule) => `- ${rule}`)
      .join('\n');
    parts.push(`# You MUST\n${doText}`);
  }

  // 4. Don't rules
  if (inputs.dontRules && inputs.dontRules.length > 0) {
    const dontText = inputs.dontRules
      .map((rule) => `- ${rule}`)
      .join('\n');
    parts.push(`# You MUST NOT\n${dontText}`);
  }

  const result = parts.join('\n\n');
  
  log.debug({ 
    hasSystemPrompt: !!inputs.systemPrompt,
    instructionCount: inputs.operatingInstructions?.length ?? 0,
    doRulesCount: inputs.doRules?.length ?? 0,
    dontRulesCount: inputs.dontRules?.length ?? 0,
    resultLength: result.length
  }, 'Resolved effective system prompt');

  return result;
}
