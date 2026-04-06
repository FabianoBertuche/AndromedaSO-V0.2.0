import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { agentConfigResolver } from '../domain/services/agentConfigResolver.js';
import { agentTemplateDiscovery } from '../domain/services/agentTemplateDiscovery.js';
import { getAgentRepository } from '../infrastructure/repositories/agent.repository.factory.js';
import { getProviderOrchestratorService } from '../../providers/services/providerOrchestratorService.js';
import { AgentApplicationService } from '../services/agentApplicationService.js';

const createAgentRequestSchema = z.object({
  templateId: z.string().min(1),
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  visibility: z.enum(['private', 'team', 'public']).optional(),
  overrides: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    role: z.string().min(1).optional(),
    goal: z.string().min(1).optional(),
    personality: z.string().min(1).optional(),
    tone: z.string().min(1).optional(),
    responseStyle: z.string().min(1).optional(),
    systemInstructions: z.array(z.string().min(1)).optional(),
    restrictions: z.array(z.string().min(1)).optional(),
    securityRules: z.array(z.string().min(1)).optional(),
    defaultLanguage: z.string().min(1).optional(),
    tags: z.array(z.string().min(1)).optional(),
    preferredModel: z.string().min(1).nullable().optional(),
    compatibleModelStrategy: z.string().min(1).nullable().optional(),
    allowedChannels: z.array(z.string().min(1)).optional(),
    enabledCapabilities: z.array(z.string().min(1)).optional(),
    operationalParameters: z.record(z.string(), z.unknown()).optional()
  }).optional(),
  status: z.enum(['active', 'disabled']).optional()
});

const updateAgentRequestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  visibility: z.enum(['private', 'team', 'public']).optional(),
  overrides: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    role: z.string().min(1).optional(),
    goal: z.string().min(1).optional(),
    personality: z.string().min(1).optional(),
    tone: z.string().min(1).optional(),
    responseStyle: z.string().min(1).optional(),
    systemInstructions: z.array(z.string().min(1)).optional(),
    restrictions: z.array(z.string().min(1)).optional(),
    securityRules: z.array(z.string().min(1)).optional(),
    defaultLanguage: z.string().min(1).optional(),
    tags: z.array(z.string().min(1)).optional(),
    preferredModel: z.string().min(1).nullable().optional(),
    compatibleModelStrategy: z.string().min(1).nullable().optional(),
    allowedChannels: z.array(z.string().min(1)).optional(),
    enabledCapabilities: z.array(z.string().min(1)).optional(),
    operationalParameters: z.record(z.string(), z.unknown()).optional()
  }).optional(),
  status: z.enum(['active', 'disabled']).optional()
});

const duplicateAgentRequestSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional()
});

const loadAgentRequestSchema = z.object({
  bindings: z.object({
    provider: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    channel: z.string().min(1).optional()
  }).optional(),
  operationalParameters: z.record(z.string(), z.unknown()).optional()
});

const agentChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })),
  stream: z.boolean().optional()
});

const agentChatResponseSchema = z.object({
  message: z.object({
    role: z.enum(['assistant']),
    content: z.string()
  }),
  metadata: z.object({
    agentId: z.string(),
    modelUsed: z.string(),
    timestamp: z.string()
  }).optional()
});

let servicePromise: Promise<AgentApplicationService> | null = null;

export function resetAgentRoutesService(): void {
  servicePromise = null;
}

async function getAgentApplicationService(): Promise<AgentApplicationService> {
  if (!servicePromise) {
    const repository = await getAgentRepository();
    const providerOrchestratorService = await getProviderOrchestratorService();
    servicePromise = Promise.resolve(
      new AgentApplicationService(repository, agentTemplateDiscovery, agentConfigResolver, providerOrchestratorService)
    );
  }
  return servicePromise;
}

export const agentRoutes: FastifyPluginAsync = async function agentRoutes(server) {
  server.get('/health', async function handleHealth() {
    return { status: 'ok', module: 'agents' };
  });

  server.get('/templates', async function handleListTemplates() {
    const service = await getAgentApplicationService();
    return { templates: await service.listTemplates() };
  });

  server.get('/', async function handleListAgents() {
    const service = await getAgentApplicationService();
    return { agents: await service.listAgents() };
  });

  server.get('/:id', async function handleGetAgent(request, reply) {
    const { id } = request.params as { id: string };
    const service = await getAgentApplicationService();
    try {
      return await service.getAgentById(id);
    } catch (error) {
      const message = (error as Error).message;
      return reply.status(404).send({ error: message });
    }
  });

  server.post('/', async function handleCreateAgent(request, reply) {
    const service = await getAgentApplicationService();
    const parsed = createAgentRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid request body',
        details: parsed.error.issues
      });
    }

    try {
      const agent = await service.createAgent(parsed.data);
      return reply.status(201).send(agent);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ error: message });
      }
      if (message.includes('already exists')) {
        return reply.status(409).send({ error: message });
      }
      return reply.status(500).send({ error: message });
    }
  });

  server.put('/:id', async function handleUpdateAgent(request, reply) {
    const { id } = request.params as { id: string };
    const service = await getAgentApplicationService();
    const parsed = updateAgentRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid request body',
        details: parsed.error.issues
      });
    }

    try {
      const agent = await service.updateAgent(id, parsed.data);
      return agent;
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ error: message });
      }
      return reply.status(500).send({ error: message });
    }
  });

  server.delete('/:id', async function handleDeleteAgent(request, reply) {
    const { id } = request.params as { id: string };
    const service = await getAgentApplicationService();
    try {
      await service.deleteAgent(id);
      return reply.status(204).send();
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ error: message });
      }
      return reply.status(500).send({ error: message });
    }
  });

  server.post('/:id/duplicate', async function handleDuplicateAgent(request, reply) {
    const { id } = request.params as { id: string };
    const service = await getAgentApplicationService();
    const parsed = duplicateAgentRequestSchema.safeParse(request.body ?? {});

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid request body',
        details: parsed.error.issues
      });
    }

    try {
      const agent = await service.duplicateAgent(id, parsed.data);
      return reply.status(201).send(agent);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ error: message });
      }
      if (message.includes('already exists')) {
        return reply.status(409).send({ error: message });
      }
      return reply.status(500).send({ error: message });
    }
  });

  server.post('/:id/activate', async function handleActivateAgent(request, reply) {
    const { id } = request.params as { id: string };
    const service = await getAgentApplicationService();
    try {
      const agent = await service.activateAgent(id);
      return agent;
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ error: message });
      }
      return reply.status(500).send({ error: message });
    }
  });

  server.post('/:id/deactivate', async function handleDeactivateAgent(request, reply) {
    const { id } = request.params as { id: string };
    const service = await getAgentApplicationService();
    try {
      const agent = await service.deactivateAgent(id);
      return agent;
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ error: message });
      }
      return reply.status(500).send({ error: message });
    }
  });

  server.post('/:id/load', async function handleLoadAgent(request, reply) {
    const { id } = request.params as { id: string };
    const service = await getAgentApplicationService();
    const parsed = loadAgentRequestSchema.safeParse(request.body ?? {});

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid request body',
        details: parsed.error.issues
      });
    }

    try {
      const resolved = await service.loadAgent(id, parsed.data);
      return resolved;
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ error: message });
      }
      if (message.includes('disabled')) {
        return reply.status(400).send({ error: message });
      }
      return reply.status(500).send({ error: message });
    }
  });

  server.post('/:id/chat', async function handleAgentChat(request, reply) {
    const { id } = request.params as { id: string };
    const service = await getAgentApplicationService();
    const parsed = agentChatRequestSchema.safeParse(request.body ?? {});

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Invalid request body',
        details: parsed.error.issues
      });
    }

    try {
      const result = await service.chat(id, parsed.data.messages, parsed.data.stream);
      return result;
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found')) {
        return reply.status(404).send({ error: message });
      }
      if (message.includes('not active')) {
        return reply.status(400).send({ error: message });
      }
      if (message.includes('does not have a preferred model')) {
        return reply.status(400).send({ error: message });
      }
      return reply.status(500).send({ error: message });
    }
  });
};
