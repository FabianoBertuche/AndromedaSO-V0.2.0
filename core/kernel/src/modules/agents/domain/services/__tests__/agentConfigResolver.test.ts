import { describe, it, expect, beforeEach } from 'vitest';
import { AgentConfigResolver } from '../agentConfigResolver.js';
import type { AgentInstance } from '../../../../../contracts/agentModule.schema.js';
import type { AgentTemplateManifest } from '../../../../../contracts/agentTemplate.schema.js';

describe('AgentConfigResolver', () => {
  let resolver: AgentConfigResolver;

  const baseTemplate: AgentTemplateManifest = {
    templateId: 'test-template',
    name: 'Test Agent',
    group: 'default',
    variant: 'base',
    version: '1.0.0',
    status: 'active',
    metadata: {},
    config: {
      name: 'test-agent',
      slug: 'test-agent',
      role: 'assistant',
      goal: 'Help with tasks',
      personality: 'helpful',
      tone: 'friendly',
      responseStyle: 'clear',
      systemInstructions: ['Be helpful', 'Be accurate'],
      restrictions: ['Do not guess', 'Ask for clarification'],
      securityRules: ['Validate inputs', 'Log errors'],
      defaultLanguage: 'en-US',
      visibility: 'private',
      preferredModel: null,
      compatibleModelStrategy: 'any-compatible',
      allowedChannels: ['chat', 'api'],
      enabledCapabilities: ['reasoning', 'chat']
    },
    defaults: {
      operationalParameters: {
        temperature: 0.7,
        maxTokens: 1000
      }
    },
    tests: {},
    scenarios: {}
  };

  const baseAgent: AgentInstance = {
    id: 'agent-123',
    name: 'My Test Agent',
    slug: 'my-test-agent',
    description: 'A test agent',
    templateId: 'test-template',
    sourceTemplateId: 'test-template',
    status: 'active',
    visibility: 'private',
    role: 'assistant',
    goal: 'Help with tasks',
    personality: 'helpful',
    tone: 'friendly',
    responseStyle: 'clear',
    systemInstructions: ['Be helpful', 'Be accurate'],
    restrictions: ['Do not guess', 'Ask for clarification'],
    securityRules: ['Validate inputs', 'Log errors'],
    defaultLanguage: 'en-US',
    tags: [],
    allowedChannels: ['chat', 'api'],
    enabledCapabilities: ['reasoning', 'chat'],
    overrides: {},
    deletedAt: null,
    version: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    resolver = new AgentConfigResolver();
  });

  describe('resolve', () => {
    it('should resolve agent config from template', () => {
      const resolved = resolver.resolve(baseAgent, baseTemplate);

      expect(resolved.agentId).toBe(baseAgent.id);
      expect(resolved.templateId).toBe(baseTemplate.templateId);
      expect(resolved.sourceTemplateId).toBe(baseAgent.sourceTemplateId);
      expect(resolved.role).toBe(baseTemplate.config.role);
      expect(resolved.goal).toBe(baseTemplate.config.goal);
    });

    it('should include resolution trace with all sources', () => {
      const resolved = resolver.resolve(baseAgent, baseTemplate);

      expect(resolved.resolutionTrace).toBeDefined();
      expect(resolved.resolutionTrace.length).toBeGreaterThan(0);
      expect(resolved.resolutionTrace[0].sourceType).toBe('template');
      expect(resolved.resolutionTrace[0].sourceId).toBe(baseTemplate.templateId);
    });

    it('should generate deterministic config hash', () => {
      const resolved1 = resolver.resolve(baseAgent, baseTemplate);
      const resolved2 = resolver.resolve(baseAgent, baseTemplate);

      expect(resolved1.configHash).toBe(resolved2.configHash);
    });

    it('should include template defaults in operational parameters', () => {
      const resolved = resolver.resolve(baseAgent, baseTemplate);

      expect(resolved.operationalParameters).toBeDefined();
      expect(resolved.operationalParameters.temperature).toBe(0.7);
      expect(resolved.operationalParameters.maxTokens).toBe(1000);
    });

    it('should merge system instructions', () => {
      const agentWithOverrides: AgentInstance = {
        ...baseAgent,
        overrides: {
          systemInstructions: ['Additional instruction']
        }
      };

      const resolved = resolver.resolve(agentWithOverrides, baseTemplate);

      expect(resolved.systemInstructions).toContain('Be helpful');
      expect(resolved.systemInstructions).toContain('Additional instruction');
    });

    it('should deduplicate and preserve order for arrays', () => {
      const agentWithOverrides: AgentInstance = {
        ...baseAgent,
        overrides: {
          systemInstructions: ['Be helpful', 'Be accurate', 'New instruction']
        }
      };

      const resolved = resolver.resolve(agentWithOverrides, baseTemplate);

      expect(resolved.systemInstructions).toEqual(['Be helpful', 'Be accurate', 'New instruction']);
    });

    it('should apply explicit operational parameters', () => {
      const resolved = resolver.resolve(baseAgent, baseTemplate, { temperature: 0.5, customParam: 'value' });

      expect(resolved.operationalParameters.temperature).toBe(0.5);
      expect(resolved.operationalParameters.customParam).toBe('value');
      expect(resolved.operationalParameters.maxTokens).toBe(1000);
    });

    it('should include bindings in resolution trace when provided', () => {
      const resolved = resolver.resolve(
        baseAgent,
        baseTemplate,
        undefined,
        { provider: 'openai', model: 'gpt-4' }
      );

      const bindingsEntry = resolved.resolutionTrace.find((e) => e.sourceType === 'bindings');
      expect(bindingsEntry).toBeDefined();
      expect(resolved.bindings.provider).toBe('openai');
      expect(resolved.bindings.model).toBe('gpt-4');
    });

    it('should not include bindings entry in trace when bindings are empty', () => {
      const resolved = resolver.resolve(baseAgent, baseTemplate, undefined, {});

      const bindingsEntry = resolved.resolutionTrace.find((e) => e.sourceType === 'bindings');
      expect(bindingsEntry).toBeUndefined();
    });

    it('should override template values with agent overrides', () => {
      const agentWithOverrides: AgentInstance = {
        ...baseAgent,
        overrides: {
          role: 'super-assistant',
          goal: 'Super help with tasks'
        }
      };

      const resolved = resolver.resolve(agentWithOverrides, baseTemplate);

      expect(resolved.role).toBe('super-assistant');
      expect(resolved.goal).toBe('Super help with tasks');
    });

    it('should concatenate restrictions from template and overrides', () => {
      const agentWithOverrides: AgentInstance = {
        ...baseAgent,
        overrides: {
          restrictions: ['New restriction']
        }
      };

      const resolved = resolver.resolve(agentWithOverrides, baseTemplate);

      expect(resolved.restrictions).toContain('Do not guess');
      expect(resolved.restrictions).toContain('New restriction');
    });

    it('should concatenate security rules from template and overrides', () => {
      const agentWithOverrides: AgentInstance = {
        ...baseAgent,
        overrides: {
          securityRules: ['New security rule']
        }
      };

      const resolved = resolver.resolve(agentWithOverrides, baseTemplate);

      expect(resolved.securityRules).toContain('Validate inputs');
      expect(resolved.securityRules).toContain('New security rule');
    });
  });

  describe('determinism', () => {
    it('should produce same result for same input', () => {
      const resolved1 = resolver.resolve(baseAgent, baseTemplate);
      const resolved2 = resolver.resolve(baseAgent, baseTemplate);

      expect(resolved1.configHash).toBe(resolved2.configHash);
      expect(resolved1.resolutionTrace.length).toBe(resolved2.resolutionTrace.length);
    });

    it('should produce different hash when overrides change', () => {
      const resolved1 = resolver.resolve(baseAgent, baseTemplate);
      const resolved2 = resolver.resolve(baseAgent, baseTemplate, { temperature: 0.9 });

      expect(resolved1.configHash).not.toBe(resolved2.configHash);
    });
  });
});
