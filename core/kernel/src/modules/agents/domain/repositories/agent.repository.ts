import type { AgentInstance } from '../../../../contracts/agentModule.schema';

export interface AgentRepository {
  list(includeDeleted?: boolean): Promise<AgentInstance[]>;
  getById(id: string): Promise<AgentInstance | null>;
  create(agent: AgentInstance): Promise<AgentInstance>;
  update(agent: AgentInstance): Promise<AgentInstance>;
  softDelete(id: string): Promise<void>;
  findBySlug(slug: string): Promise<AgentInstance | null>;
}
