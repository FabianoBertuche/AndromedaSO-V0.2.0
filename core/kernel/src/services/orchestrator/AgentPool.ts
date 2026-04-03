import { agentEvolutionService } from '../../evolution/evolutionService';
import type { DecomposedSubtask } from './TaskDecomposer';

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

const AGENT_PROFILES: AgentProfile[] = [
  { agentId: 'agent-planner', role: 'planner', capabilities: ['planning', 'review'] },
  { agentId: 'agent-design', role: 'designer', capabilities: ['design', 'ux'] },
  { agentId: 'agent-copy', role: 'copywriter', capabilities: ['copy', 'content'] },
  { agentId: 'agent-code', role: 'coder', capabilities: ['code', 'integration'] },
  { agentId: 'agent-review', role: 'reviewer', capabilities: ['review', 'qa'] }
];

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

  private pickAgentForCapability(capability: string): AgentAssignment {
    const candidates = AGENT_PROFILES.filter((profile) => profile.capabilities.includes(capability));
    const fallback = AGENT_PROFILES;
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

    const best = ranked[0]?.profile ?? AGENT_PROFILES[0];
    const bestReputation = ranked[0]?.reputation ?? 0;

    return {
      agentId: best.agentId,
      role: best.role,
      capability,
      reputation: bestReputation
    };
  }

  private pickAgentById(agentId: string): AgentAssignment {
    const profile = AGENT_PROFILES.find((item) => item.agentId === agentId) ?? AGENT_PROFILES[0];
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
