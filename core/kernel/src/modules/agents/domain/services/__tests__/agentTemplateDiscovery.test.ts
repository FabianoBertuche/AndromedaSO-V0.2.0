import { describe, it, expect, beforeEach } from 'vitest';
import { join } from 'node:path';
import { AgentTemplateDiscovery } from '../agentTemplateDiscovery.js';

const PROJECT_ROOT = join(process.cwd(), '..', '..');

describe('AgentTemplateDiscovery', () => {
  let discovery: AgentTemplateDiscovery;

  beforeEach(() => {
    discovery = new AgentTemplateDiscovery();
    discovery.reset();
  });

  describe('listTemplates', () => {
    it('should discover templates from the filesystem', async () => {
      const templates = await discovery.listTemplates(PROJECT_ROOT);
      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
    });

    it('should return at least the assistant and reviewer templates', async () => {
      const templates = await discovery.listTemplates(PROJECT_ROOT);
      const templateIds = templates.map((t) => t.templateId);
      expect(templateIds).toContain('assistant');
      expect(templateIds).toContain('reviewer');
    });

    it('should return templates sorted by group, variant, and templateId', async () => {
      const templates = await discovery.listTemplates(PROJECT_ROOT);
      for (let i = 1; i < templates.length; i++) {
        const prev = templates[i - 1];
        const curr = templates[i];
        if (prev.group === curr.group && prev.variant === curr.variant) {
          expect(prev.templateId <= curr.templateId).toBe(true);
        }
      }
    });
  });

  describe('findTemplateById', () => {
    it('should find the assistant template', async () => {
      const template = await discovery.findTemplateById('assistant', PROJECT_ROOT);
      expect(template).not.toBeNull();
      expect(template?.templateId).toBe('assistant');
      expect(template?.name).toBe('Assistant Base');
    });

    it('should find the reviewer template', async () => {
      const template = await discovery.findTemplateById('reviewer', PROJECT_ROOT);
      expect(template).not.toBeNull();
      expect(template?.templateId).toBe('reviewer');
      expect(template?.name).toBe('Code Reviewer');
    });

    it('should return null for non-existent template', async () => {
      const template = await discovery.findTemplateById('non-existent', PROJECT_ROOT);
      expect(template).toBeNull();
    });
  });

  describe('catalog caching', () => {
    it('should cache the catalog after first call', async () => {
      const first = await discovery.listTemplates(PROJECT_ROOT);
      const second = await discovery.listTemplates(PROJECT_ROOT);
      expect(first).toBe(second);
    });

    it('should reset the catalog when reset is called', async () => {
      await discovery.listTemplates(PROJECT_ROOT);
      discovery.reset();
      const discovery2 = new AgentTemplateDiscovery();
      const templates = await discovery2.listTemplates(PROJECT_ROOT);
      expect(templates).toBeDefined();
    });
  });

  describe('template structure', () => {
    it('should return templates with required fields', async () => {
      const templates = await discovery.listTemplates(PROJECT_ROOT);
      for (const template of templates) {
        expect(template.templateId).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.group).toBeDefined();
        expect(template.variant).toBeDefined();
        expect(template.version).toBeDefined();
        expect(template.config).toBeDefined();
      }
    });

    it('should have valid config for each template', async () => {
      const templates = await discovery.listTemplates(PROJECT_ROOT);
      for (const template of templates) {
        expect(template.config).toHaveProperty('role');
        expect(template.config).toHaveProperty('goal');
        expect(template.config).toHaveProperty('personality');
        expect(template.config).toHaveProperty('tone');
        expect(template.config).toHaveProperty('responseStyle');
        expect(template.config).toHaveProperty('systemInstructions');
        expect(template.config).toHaveProperty('restrictions');
        expect(template.config).toHaveProperty('securityRules');
      }
    });
  });
});
