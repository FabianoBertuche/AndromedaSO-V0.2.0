import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import pino from 'pino';
import { agentEvolutionService } from '../../evolution/evolutionService';
import type { DecomposedSubtask } from './TaskDecomposer';

const logger = pino({ name: 'AgentPool' });

export type AgentAssignment = {
  agentId: string;
  role: 'planner' | 'designer' | 'copywriter' | 'coder' | 'reviewer';
  capability: string;
  reputation: number;
};

type AgentProfile = {
  agentId: string;
  role: AgentAssignment['role'];
  capabilities: string[];
};

const AgentProfileSchema = z.object({
  agentId: z.string().min(1),
  role: z.enum(['planner', 'designer', 'copywriter', 'coder', 'reviewer']),
  capabilities: z.array(z.string()).min(1)
});

const AGENT_PROFILES: AgentProfile[] = [
  { agentId: 'agent-planner', role: 'planner', capabilities: ['planning', 'review'] },
  { agentId: 'agent-design', role: 'designer', capabilities: ['design', 'ux'] },
  { agentId: 'agent-copy', role: 'copywriter', capabilities: ['copy', 'content'] },
  { agentId: 'agent-code', role: 'coder', capabilities: ['code', 'integration'] },
  { agentId: 'agent-review', role: 'reviewer', capabilities: ['review', 'qa'] }
];

function loadAgentProfiles(): AgentProfile[] {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const profilesPath = join(__dirname, '../../config/agentProfiles.json');

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(profilesPath, 'utf-8'));
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      logger.warn('agentProfiles.json não encontrado, usando perfis padrão');
    } else {
      logger.warn({ err }, 'Erro ao ler agentProfiles.json, usando perfis padrão');
    }
    return AGENT_PROFILES;
  }

  if (!Array.isArray(raw)) {
    logger.warn('agentProfiles.json não contém um array, usando perfis padrão');
    return AGENT_PROFILES;
  }

  const valid: AgentProfile[] = [];
  for (let index = 0; index < raw.length; index++) {
    const result = AgentProfileSchema.safeParse(raw[index]);
    if (result.success) {
      valid.push(result.data);
    } else {
      logger.error({ index }, 'Perfil de agente inválido ignorado');
    }
  }

  if (valid.length === 0) {
    logger.warn('Nenhum perfil válido encontrado, usando perfis padrão');
    return AGENT_PROFILES;
  }

  return valid;
}

const activeProfiles = loadAgentProfiles();

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export class AgentPool {
  assign(subtasks: DecomposedSubtask[]): AgentAssignment[] {
    const assigned = subtasks.map((subtask) => this.pickAgentForCapability(subtask.capability));

    // Always include planner for orchestration-level coordination.
    const planner = this.pickAgentById('agent-planner');
    return [planner, ...assigned.filter((item) => item.agentId !== planner.agentId)];
  }

  pickAgentForCapability(capability: string): AgentAssignment {
    const candidates = activeProfiles.filter((profile) => profile.capabilities.includes(capability));
    const fallback = activeProfiles;
    const pool = candidates.length > 0 ? candidates : fallback;

    const ranked = pool
      .map((profile) => {
        const reputationMap = agentEvolutionService.getReputation(profile.agentId);
        const repValues = Object.values(reputationMap);
        const reputation = Number(average(repValues).toFixed(4));
        return {
          profile,
          reputation
        };
      })
      .sort((a, b) => b.reputation - a.reputation);

    const best = ranked[0]?.profile ?? activeProfiles[0];
    const bestReputation = ranked[0]?.reputation ?? 0;

    return {
      agentId: best.agentId,
      role: best.role,
      capability,
      reputation: bestReputation
    };
  }

  pickAgentById(agentId: string): AgentAssignment {
    const profile = activeProfiles.find((item) => item.agentId === agentId) ?? activeProfiles[0];
    const reputationMap = agentEvolutionService.getReputation(profile.agentId);
    return {
      agentId: profile.agentId,
      role: profile.role,
      capability: profile.capabilities[0],
      reputation: Number(average(Object.values(reputationMap)).toFixed(4))
    };
  }
}

export const agentPool = new AgentPool();
