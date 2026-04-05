import { describe, it, expect, beforeEach } from 'vitest';
import { join } from 'node:path';
import { AgentApplicationService } from '../agentApplicationService.js';
import { AgentRepositoryMemory } from '../../infrastructure/repositories/agent.repository.memory.js';
import { AgentTemplateDiscovery } from '../../domain/services/agentTemplateDiscovery.js';
import { AgentConfigResolver } from '../../domain/services/agentConfigResolver.js';
import type { CreateAgentInput, UpdateAgentInput } from '../../../../contracts/agentModule.schema.js';

const PROJECT_ROOT = join(process.cwd(), '..', '..');

describe('AgentApplicationService', () => {
  let service: AgentApplicationService;
  let repository: AgentRepositoryMemory;
  let discovery: AgentTemplateDiscovery;
  let resolver: AgentConfigResolver;

  beforeEach(async () => {
    repository = new AgentRepositoryMemory();
    discovery = new AgentTemplateDiscovery();
    discovery.reset();
    resolver = new AgentConfigResolver();
    service = new AgentApplicationService(repository, discovery, resolver);
    await discovery.listTemplates(PROJECT_ROOT);
  });

  describe('listTemplates', () => {
    it('should list available templates', async () => {
      const templates = await service.listTemplates();

      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some((t) => t.templateId === 'assistant')).toBe(true);
      expect(templates.some((t) => t.templateId === 'reviewer')).toBe(true);
    });
  });

  describe('createAgent', () => {
    it('should create agent from template', async () => {
      const input: CreateAgentInput = {
        templateId: 'assistant',
        name: 'My Assistant'
      };

      const agent = await service.createAgent(input);

      expect(agent.id).toBeDefined();
      expect(agent.name).toBe('My Assistant');
      expect(agent.templateId).toBe('assistant');
      expect(agent.sourceTemplateId).toBe('assistant');
      expect(agent.status).toBe('active');
    });

    it('should throw error for non-existent template', async () => {
      const input: CreateAgentInput = {
        templateId: 'non-existent'
      };

      await expect(service.createAgent(input)).rejects.toThrow('Template not found');
    });

    it('should generate slug from name', async () => {
      const input: CreateAgentInput = {
        templateId: 'assistant',
        name: 'My Test Agent'
      };

      const agent = await service.createAgent(input);

      expect(agent.slug).toBe('my-test-agent');
    });

    it('should use provided slug', async () => {
      const input: CreateAgentInput = {
        templateId: 'assistant',
        name: 'My Agent',
        slug: 'custom-slug'
      };

      const agent = await service.createAgent(input);

      expect(agent.slug).toBe('custom-slug');
    });

    it('should reject duplicate slug', async () => {
      const input: CreateAgentInput = {
        templateId: 'assistant',
        name: 'First Agent'
      };

      await service.createAgent(input);
      await expect(service.createAgent({ templateId: 'assistant', name: 'First Agent' })).rejects.toThrow('already exists');
    });

    it('should apply overrides from input', async () => {
      const input: CreateAgentInput = {
        templateId: 'assistant',
        name: 'Custom Assistant',
        overrides: {
          role: 'custom-role',
          goal: 'Custom goal'
        }
      };

      const agent = await service.createAgent(input);

      expect(agent.role).toBe('custom-role');
      expect(agent.goal).toBe('Custom goal');
    });
  });

  describe('listAgents', () => {
    it('should list all active agents', async () => {
      await service.createAgent({ templateId: 'assistant', name: 'Agent 1' });
      await service.createAgent({ templateId: 'assistant', name: 'Agent 2' });

      const agents = await service.listAgents();

      expect(agents.length).toBe(2);
    });
  });

  describe('getAgentById', () => {
    it('should return agent by id', async () => {
      const created = await service.createAgent({ templateId: 'assistant', name: 'Test' });

      const agent = await service.getAgentById(created.id);

      expect(agent.id).toBe(created.id);
    });

    it('should throw error for non-existent agent', async () => {
      await expect(service.getAgentById('non-existent')).rejects.toThrow('Agent not found');
    });

    it('should throw error for deleted agent', async () => {
      const created = await service.createAgent({ templateId: 'assistant', name: 'Test' });
      await service.deleteAgent(created.id);

      await expect(service.getAgentById(created.id)).rejects.toThrow('Agent not found');
    });
  });

  describe('updateAgent', () => {
    it('should update agent', async () => {
      const created = await service.createAgent({ templateId: 'assistant', name: 'Test' });
      const input: UpdateAgentInput = { name: 'Updated Name' };

      const updated = await service.updateAgent(created.id, input);

      expect(updated.name).toBe('Updated Name');
      expect(updated.version).toBe(created.version + 1);
    });

    it('should apply overrides', async () => {
      const created = await service.createAgent({ templateId: 'assistant', name: 'Test' });
      const input: UpdateAgentInput = {
        overrides: { role: 'new-role' }
      };

      const updated = await service.updateAgent(created.id, input);

      expect(updated.role).toBe('new-role');
    });
  });

  describe('duplicateAgent', () => {
    it('should duplicate agent with new id', async () => {
      const original = await service.createAgent({ templateId: 'assistant', name: 'Original' });

      const duplicated = await service.duplicateAgent(original.id);

      expect(duplicated.id).not.toBe(original.id);
      expect(duplicated.name).toContain('Copy');
    });

    it('should use provided name for duplicate', async () => {
      const original = await service.createAgent({ templateId: 'assistant', name: 'Original' });

      const duplicated = await service.duplicateAgent(original.id, { name: 'My Copy' });

      expect(duplicated.name).toBe('My Copy');
    });

    it('should reset version to 1', async () => {
      const original = await service.createAgent({ templateId: 'assistant', name: 'Original' });

      const duplicated = await service.duplicateAgent(original.id);

      expect(duplicated.version).toBe(1);
    });

    it('should set status to active', async () => {
      const original = await service.createAgent({ templateId: 'assistant', name: 'Original' });
      await service.deactivateAgent(original.id);

      const duplicated = await service.duplicateAgent(original.id);

      expect(duplicated.status).toBe('active');
    });
  });

  describe('activateAgent', () => {
    it('should activate agent', async () => {
      const created = await service.createAgent({ templateId: 'assistant', name: 'Test' });
      await service.deactivateAgent(created.id);

      const activated = await service.activateAgent(created.id);

      expect(activated.status).toBe('active');
    });
  });

  describe('deactivateAgent', () => {
    it('should deactivate agent', async () => {
      const created = await service.createAgent({ templateId: 'assistant', name: 'Test' });

      const deactivated = await service.deactivateAgent(created.id);

      expect(deactivated.status).toBe('disabled');
    });
  });

  describe('deleteAgent', () => {
    it('should soft delete agent', async () => {
      const created = await service.createAgent({ templateId: 'assistant', name: 'Test' });

      await service.deleteAgent(created.id);

      await expect(service.getAgentById(created.id)).rejects.toThrow('Agent not found');
    });
  });

  describe('loadAgent', () => {
    it('should return resolved agent config', async () => {
      const created = await service.createAgent({ templateId: 'assistant', name: 'Test' });

      const resolved = await service.loadAgent(created.id);

      expect(resolved.agentId).toBe(created.id);
      expect(resolved.templateId).toBe(created.templateId);
      expect(resolved.role).toBeDefined();
      expect(resolved.goal).toBeDefined();
      expect(resolved.configHash).toBeDefined();
      expect(resolved.resolutionTrace).toBeDefined();
    });

    it('should throw error for disabled agent', async () => {
      const created = await service.createAgent({ templateId: 'assistant', name: 'Test' });
      await service.deactivateAgent(created.id);

      await expect(service.loadAgent(created.id)).rejects.toThrow('Agent is disabled');
    });

    it('should include operational parameters', async () => {
      const created = await service.createAgent({ templateId: 'assistant', name: 'Test' });

      const resolved = await service.loadAgent(created.id);

      expect(resolved.operationalParameters).toBeDefined();
      expect(resolved.operationalParameters.temperature).toBeDefined();
    });

    it('should apply explicit operational parameters', async () => {
      const created = await service.createAgent({ templateId: 'assistant', name: 'Test' });

      const resolved = await service.loadAgent(created.id, {
        operationalParameters: { temperature: 0.9 }
      });

      expect(resolved.operationalParameters.temperature).toBe(0.9);
    });

    it('should apply bindings', async () => {
      const created = await service.createAgent({ templateId: 'assistant', name: 'Test' });

      const resolved = await service.loadAgent(created.id, {
        bindings: { provider: 'openai', model: 'gpt-4' }
      });

      expect(resolved.bindings.provider).toBe('openai');
      expect(resolved.bindings.model).toBe('gpt-4');
    });
  });
});
