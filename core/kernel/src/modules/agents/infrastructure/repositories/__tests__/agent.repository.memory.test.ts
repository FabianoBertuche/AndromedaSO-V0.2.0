import { describe, it, expect, beforeEach } from 'vitest';
import { AgentRepositoryMemory } from '../agent.repository.memory.js';
import type { AgentInstance } from '../../../../../contracts/agentModule.schema.js';

describe('AgentRepositoryMemory', () => {
  let repository: AgentRepositoryMemory;

  const createTestAgent = (overrides: Partial<AgentInstance> = {}): AgentInstance => ({
    id: `agent-${Math.random().toString(36).substring(7)}`,
    name: 'Test Agent',
    slug: `test-agent-${Math.random().toString(36).substring(7)}`,
    description: 'A test agent',
    templateId: 'assistant',
    sourceTemplateId: 'assistant',
    status: 'active',
    visibility: 'private',
    role: 'assistant',
    goal: 'Help with tasks',
    personality: 'helpful',
    tone: 'friendly',
    responseStyle: 'clear',
    systemInstructions: ['Be helpful'],
    restrictions: ['Do not guess'],
    securityRules: ['Validate inputs'],
    defaultLanguage: 'en-US',
    tags: [],
    allowedChannels: ['chat'],
    enabledCapabilities: ['reasoning'],
    overrides: {},
    deletedAt: null,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  });

  beforeEach(() => {
    repository = new AgentRepositoryMemory();
  });

  describe('create', () => {
    it('should create an agent', async () => {
      const agent = createTestAgent();
      const created = await repository.create(agent);

      expect(created.id).toBe(agent.id);
      expect(created.name).toBe(agent.name);
    });

    it('should persist the agent', async () => {
      const agent = createTestAgent();
      await repository.create(agent);

      const found = await repository.getById(agent.id);
      expect(found).not.toBeNull();
      expect(found?.name).toBe(agent.name);
    });

    it('should allow finding by slug', async () => {
      const agent = createTestAgent();
      await repository.create(agent);

      const found = await repository.findBySlug(agent.slug);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(agent.id);
    });
  });

  describe('list', () => {
    it('should list all active agents', async () => {
      const agent1 = createTestAgent();
      const agent2 = createTestAgent({ slug: 'agent-2' });
      await repository.create(agent1);
      await repository.create(agent2);

      const agents = await repository.list();

      expect(agents.length).toBe(2);
    });

    it('should not include deleted agents by default', async () => {
      const agent = createTestAgent();
      await repository.create(agent);
      await repository.softDelete(agent.id);

      const agents = await repository.list();

      expect(agents.length).toBe(0);
    });

    it('should include deleted agents when includeDeleted is true', async () => {
      const agent = createTestAgent();
      await repository.create(agent);
      await repository.softDelete(agent.id);

      const agents = await repository.list(true);

      expect(agents.length).toBe(1);
    });
  });

  describe('getById', () => {
    it('should return agent by id', async () => {
      const agent = createTestAgent();
      await repository.create(agent);

      const found = await repository.getById(agent.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(agent.id);
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.getById('non-existent');

      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an agent', async () => {
      const agent = createTestAgent();
      await repository.create(agent);

      const updated: AgentInstance = {
        ...agent,
        name: 'Updated Name',
        version: agent.version + 1,
        updatedAt: new Date().toISOString()
      };
      const result = await repository.update(updated);

      expect(result.name).toBe('Updated Name');
      const found = await repository.getById(agent.id);
      expect(found?.name).toBe('Updated Name');
    });

    it('should throw error for non-existent agent', async () => {
      const agent = createTestAgent({ id: 'non-existent' });

      await expect(repository.update(agent)).rejects.toThrow('Agent not found');
    });

    it('should update slug lookup on slug change', async () => {
      const agent = createTestAgent();
      await repository.create(agent);

      const updated: AgentInstance = {
        ...agent,
        slug: 'new-slug',
        updatedAt: new Date().toISOString()
      };
      await repository.update(updated);

      const foundByOldSlug = await repository.findBySlug(agent.slug);
      const foundByNewSlug = await repository.findBySlug('new-slug');

      expect(foundByOldSlug).toBeNull();
      expect(foundByNewSlug).not.toBeNull();
    });
  });

  describe('softDelete', () => {
    it('should soft delete an agent', async () => {
      const agent = createTestAgent();
      await repository.create(agent);
      await repository.softDelete(agent.id);

      const found = await repository.getById(agent.id);
      expect(found?.deletedAt).not.toBeNull();
    });

    it('should throw error for non-existent agent', async () => {
      await expect(repository.softDelete('non-existent')).rejects.toThrow('Agent not found');
    });
  });

  describe('findBySlug', () => {
    it('should find agent by slug', async () => {
      const agent = createTestAgent();
      await repository.create(agent);

      const found = await repository.findBySlug(agent.slug);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(agent.id);
    });

    it('should return null for non-existent slug', async () => {
      const found = await repository.findBySlug('non-existent');

      expect(found).toBeNull();
    });
  });

  describe('reset', () => {
    it('should clear all agents', async () => {
      const agent1 = createTestAgent();
      const agent2 = createTestAgent({ slug: 'agent-2' });
      await repository.create(agent1);
      await repository.create(agent2);

      repository.reset();

      const agents = await repository.list();
      expect(agents.length).toBe(0);
    });
  });
});
