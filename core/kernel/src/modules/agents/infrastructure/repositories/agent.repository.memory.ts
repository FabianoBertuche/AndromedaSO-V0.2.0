import type { AgentInstance } from '../../../../contracts/agentModule.schema';
import type { AgentRepository } from '../../domain/repositories/agent.repository.js';

export class AgentRepositoryMemory implements AgentRepository {
  private readonly agents = new Map<string, AgentInstance>();
  private readonly slugs = new Map<string, string>();

  async list(includeDeleted = false): Promise<AgentInstance[]> {
    const agents = [...this.agents.values()];
    if (includeDeleted) {
      return agents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return agents
      .filter((agent) => agent.deletedAt === null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getById(id: string): Promise<AgentInstance | null> {
    return this.agents.get(id) ?? null;
  }

  async create(agent: AgentInstance): Promise<AgentInstance> {
    this.agents.set(agent.id, agent);
    this.slugs.set(agent.slug, agent.id);
    return agent;
  }

  async update(agent: AgentInstance): Promise<AgentInstance> {
    const existing = this.agents.get(agent.id);
    if (!existing) {
      throw new Error('Agent not found');
    }
    if (existing.slug !== agent.slug) {
      this.slugs.delete(existing.slug);
      this.slugs.set(agent.slug, agent.id);
    }
    this.agents.set(agent.id, agent);
    return agent;
  }

  async softDelete(id: string): Promise<void> {
    const agent = this.agents.get(id);
    if (!agent) {
      throw new Error('Agent not found');
    }
    const deletedAgent: AgentInstance = {
      ...agent,
      deletedAt: new Date().toISOString()
    };
    this.agents.set(id, deletedAgent);
  }

  async findBySlug(slug: string): Promise<AgentInstance | null> {
    const id = this.slugs.get(slug);
    if (!id) {
      return null;
    }
    return this.agents.get(id) ?? null;
  }

  reset(): void {
    this.agents.clear();
    this.slugs.clear();
  }
}

export const agentRepositoryMemory = new AgentRepositoryMemory();
