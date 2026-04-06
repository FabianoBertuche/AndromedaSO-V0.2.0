import pino from 'pino';

const log = pino({ name: 'agents:resolve-behavior-profile' });

export interface BehaviorProfileInputs {
  persona: string;
  tone?: string;
  style?: string;
  interactionMode?: string;
  behaviorProfile?: string;
}

export interface EffectiveBehaviorProfile {
  persona: string;
  tone: string;
  style: string;
  interactionMode: string;
  behaviorProfile: string;
}

/**
 * Resolve o effectiveBehaviorProfile consolidando:
 * - persona (obrigatório)
 * - tone (default: "neutro")
 * - style (default: "claro-e-objetivo")
 * - interactionMode (default: "guided")
 * - behaviorProfile (default: "default")
 */
export function resolveEffectiveBehaviorProfile(inputs: BehaviorProfileInputs): EffectiveBehaviorProfile {
  const result: EffectiveBehaviorProfile = {
    persona: inputs.persona,
    tone: inputs.tone ?? 'neutro',
    style: inputs.style ?? 'claro-e-objetivo',
    interactionMode: inputs.interactionMode ?? 'guided',
    behaviorProfile: inputs.behaviorProfile ?? 'default'
  };

  log.debug({
    hasPersona: !!inputs.persona,
    tone: result.tone,
    style: result.style,
    interactionMode: result.interactionMode,
    behaviorProfile: result.behaviorProfile
  }, 'Resolved effective behavior profile');

  return result;
}
