import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { join } from 'node:path';
import Fastify, { type FastifyInstance } from 'fastify';
import { agentRoutes, resetAgentRoutesService } from '../agentRoutes.js';
import { agentTemplateDiscovery } from '../../domain/services/agentTemplateDiscovery.js';
import { resetAgentRepositoryFactory } from '../../infrastructure/repositories/agent.repository.factory.js';

const PROJECT_ROOT = join(process.cwd(), '..', '..');

describe('AgentRoutes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify();
    await app.register(agentRoutes, { prefix: '/api/agents' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    process.env.AGENT_REPOSITORY_MODE = 'memory';
    agentTemplateDiscovery.reset();
    resetAgentRepositoryFactory();
    resetAgentRoutesService();
    await agentTemplateDiscovery.listTemplates(PROJECT_ROOT);
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/agents/health'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
      expect(body.module).toBe('agents');
    });
  });

  describe('GET /templates', () => {
    it('should return list of templates', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/agents/templates'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.templates).toBeDefined();
      expect(Array.isArray(body.templates)).toBe(true);
    });

    it('should include assistant template', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/agents/templates'
      });

      const body = JSON.parse(response.body);
      const assistantTemplate = body.templates.find((t: { templateId: string }) => t.templateId === 'assistant');
      expect(assistantTemplate).toBeDefined();
      expect(assistantTemplate.name).toBe('Assistant Base');
    });

    it('should include reviewer template', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/agents/templates'
      });

      const body = JSON.parse(response.body);
      const reviewerTemplate = body.templates.find((t: { templateId: string }) => t.templateId === 'reviewer');
      expect(reviewerTemplate).toBeDefined();
      expect(reviewerTemplate.name).toBe('Code Reviewer');
    });
  });

  describe('GET /', () => {
    it('should return empty list initially', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/agents/'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.agents).toBeDefined();
      expect(Array.isArray(body.agents)).toBe(true);
    });
  });

  describe('POST /', () => {
    it('should create agent from assistant template', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/agents/',
        payload: {
          templateId: 'assistant',
          name: 'My Assistant'
        }
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBeDefined();
      expect(body.name).toBe('My Assistant');
      expect(body.templateId).toBe('assistant');
      expect(body.status).toBe('active');
    });

    it('should return 404 for non-existent template', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/agents/',
        payload: {
          templateId: 'non-existent',
          name: 'Test'
        }
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('Template not found');
    });

    it('should return 400 for invalid payload', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/agents/',
        payload: {}
      });

      expect(response.statusCode).toBe(400);
    });

    it('should create agent with overrides', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/agents/',
        payload: {
          templateId: 'assistant',
          name: 'Custom Assistant',
          overrides: {
            role: 'custom-role',
            goal: 'Custom goal'
          }
        }
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.role).toBe('custom-role');
      expect(body.goal).toBe('Custom goal');
    });
  });

  describe('GET /:id', () => {
    it('should return agent by id', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/agents/',
        payload: {
          templateId: 'assistant',
          name: 'Test Agent'
        }
      });
      const created = JSON.parse(createResponse.body);

      const response = await app.inject({
        method: 'GET',
        url: `/api/agents/${created.id}`
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe(created.id);
      expect(body.name).toBe('Test Agent');
    });

    it('should return 404 for non-existent id', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/agents/non-existent-id'
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PUT /:id', () => {
    it('should update agent', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/agents/',
        payload: {
          templateId: 'assistant',
          name: 'Original Name'
        }
      });
      const created = JSON.parse(createResponse.body);

      const response = await app.inject({
        method: 'PUT',
        url: `/api/agents/${created.id}`,
        payload: {
          name: 'Updated Name'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('Updated Name');
      expect(body.version).toBe(2);
    });

    it('should apply overrides on update', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/agents/',
        payload: {
          templateId: 'assistant',
          name: 'Test'
        }
      });
      const created = JSON.parse(createResponse.body);

      const response = await app.inject({
        method: 'PUT',
        url: `/api/agents/${created.id}`,
        payload: {
          overrides: {
            role: 'updated-role'
          }
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.role).toBe('updated-role');
    });
  });

  describe('DELETE /:id', () => {
    it('should soft delete agent', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/agents/',
        payload: {
          templateId: 'assistant',
          name: 'To Delete'
        }
      });
      const created = JSON.parse(createResponse.body);

      const deleteResponse = await app.inject({
        method: 'DELETE',
        url: `/api/agents/${created.id}`
      });

      expect(deleteResponse.statusCode).toBe(204);

      const getResponse = await app.inject({
        method: 'GET',
        url: `/api/agents/${created.id}`
      });

      expect(getResponse.statusCode).toBe(404);
    });

    it('should return 404 for non-existent id', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/agents/non-existent-id'
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /:id/duplicate', () => {
    it('should duplicate agent', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/agents/',
        payload: {
          templateId: 'assistant',
          name: 'Original'
        }
      });
      const created = JSON.parse(createResponse.body);

      const response = await app.inject({
        method: 'POST',
        url: `/api/agents/${created.id}/duplicate`
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).not.toBe(created.id);
      expect(body.name).toContain('Copy');
    });

    it('should use custom name for duplicate', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/agents/',
        payload: {
          templateId: 'assistant',
          name: 'Original'
        }
      });
      const created = JSON.parse(createResponse.body);

      const response = await app.inject({
        method: 'POST',
        url: `/api/agents/${created.id}/duplicate`,
        payload: {
          name: 'My Copy'
        }
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('My Copy');
    });
  });

  describe('POST /:id/activate', () => {
    it('should activate agent', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/agents/',
        payload: {
          templateId: 'assistant',
          name: 'Test'
        }
      });
      const created = JSON.parse(createResponse.body);

      const response = await app.inject({
        method: 'POST',
        url: `/api/agents/${created.id}/deactivate`
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).status).toBe('disabled');

      const activateResponse = await app.inject({
        method: 'POST',
        url: `/api/agents/${created.id}/activate`
      });

      expect(activateResponse.statusCode).toBe(200);
      expect(JSON.parse(activateResponse.body).status).toBe('active');
    });
  });

  describe('POST /:id/deactivate', () => {
    it('should deactivate agent', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/agents/',
        payload: {
          templateId: 'assistant',
          name: 'Test'
        }
      });
      const created = JSON.parse(createResponse.body);

      const response = await app.inject({
        method: 'POST',
        url: `/api/agents/${created.id}/deactivate`
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('disabled');
    });
  });

  describe('POST /:id/load', () => {
    it('should load resolved agent config', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/agents/',
        payload: {
          templateId: 'assistant',
          name: 'Test'
        }
      });
      const created = JSON.parse(createResponse.body);

      const response = await app.inject({
        method: 'POST',
        url: `/api/agents/${created.id}/load`
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.agentId).toBe(created.id);
      expect(body.templateId).toBe('assistant');
      expect(body.configHash).toBeDefined();
      expect(body.resolutionTrace).toBeDefined();
    });

    it('should return 400 for disabled agent', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/agents/',
        payload: {
          templateId: 'assistant',
          name: 'Test'
        }
      });
      const created = JSON.parse(createResponse.body);

      await app.inject({
        method: 'POST',
        url: `/api/agents/${created.id}/deactivate`
      });

      const response = await app.inject({
        method: 'POST',
        url: `/api/agents/${created.id}/load`
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('disabled');
    });

    it('should apply bindings on load', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/agents/',
        payload: {
          templateId: 'assistant',
          name: 'Test'
        }
      });
      const created = JSON.parse(createResponse.body);

      const response = await app.inject({
        method: 'POST',
        url: `/api/agents/${created.id}/load`,
        payload: {
          bindings: {
            provider: 'openai',
            model: 'gpt-4'
          }
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.bindings.provider).toBe('openai');
      expect(body.bindings.model).toBe('gpt-4');
    });

    it('should apply operational parameters on load', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/agents/',
        payload: {
          templateId: 'assistant',
          name: 'Test'
        }
      });
      const created = JSON.parse(createResponse.body);

      const response = await app.inject({
        method: 'POST',
        url: `/api/agents/${created.id}/load`,
        payload: {
          operationalParameters: {
            temperature: 0.9
          }
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.operationalParameters.temperature).toBe(0.9);
    });
  });
});
