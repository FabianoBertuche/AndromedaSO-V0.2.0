import { randomUUID } from 'node:crypto';
import pino from 'pino';
import type {
  AgentInstance,
  CreateAgentInput,
  DuplicateAgentInput,
  LoadAgentInput,
  UpdateAgentInput
} from '../../../contracts/agentModule.schema.js';
import type { AgentTemplateManifest } from '../../../contracts/agentTemplate.schema.js';
import type { ResolvedAgentConfig } from '../../../contracts/resolvedAgent.schema.js';
import type { AgentRepository } from '../domain/repositories/agent.repository.js';
import { agentConfigResolver } from '../domain/services/agentConfigResolver.js';
import { agentTemplateDiscovery } from '../domain/services/agentTemplateDiscovery.js';
import type { ProviderOrchestratorService } from '../../providers/services/providerOrchestratorService.js';
import type { ProviderChatMessage } from '../../providers/infrastructure/adapters/adapter.interface.js';

const log = pino({ name: 'agents:application' });

export class AgentApplicationService {
  constructor(
    private readonly repository: AgentRepository,
    private readonly discovery: typeof agentTemplateDiscovery,
    private readonly resolver: typeof agentConfigResolver,
    private readonly providerOrchestrator: ProviderOrchestratorService
  ) {}

  async listTemplates(): Promise<AgentTemplateManifest[]> {
    return this.discovery.listTemplates();
  }

  async listAgents(): Promise<AgentInstance[]> {
    return this.repository.list(false);
  }

  async getAgentById(id: string): Promise<AgentInstance> {
    const agent = await this.repository.getById(id);
    if (!agent) {
      throw new Error('Agent not found');
    }
    if (agent.deletedAt !== null) {
      throw new Error('Agent not found');
    }
    return agent;
  }

  async createAgent(input: CreateAgentInput): Promise<AgentInstance> {
    const template = await this.discovery.findTemplateById(input.templateId);
    if (!template) {
      throw new Error(`Template not found: ${input.templateId}`);
    }

    const templateConfig = template.config as Record<string, unknown>;
    const now = new Date().toISOString();
    const baseSlug = input.slug ?? input.name ?? templateConfig.slug as string;
    const slug = baseSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const existingSlug = await this.repository.findBySlug(slug);
    if (existingSlug) {
      throw new Error(`Agent with slug already exists: ${slug}`);
    }

    const agentId = randomUUID();
    const agent: AgentInstance = {
      id: agentId,
      name: input.name ?? (templateConfig.name as string),
      slug,
      description: input.description ?? (templateConfig.description as string ?? ''),
      templateId: input.templateId,
      sourceTemplateId: input.templateId,
      status: input.status ?? 'active',
      visibility: input.visibility ?? (templateConfig.visibility as 'private' | 'team' | 'public') ?? 'private',
      role: (input.overrides?.role ?? templateConfig.role) as string,
      goal: (input.overrides?.goal ?? templateConfig.goal) as string,
      personality: (input.overrides?.personality ?? templateConfig.personality) as string,
      tone: (input.overrides?.tone ?? templateConfig.tone) as string,
      responseStyle: (input.overrides?.responseStyle ?? templateConfig.responseStyle) as string,
      systemInstructions: (input.overrides?.systemInstructions ?? templateConfig.systemInstructions ?? []) as string[],
      restrictions: (input.overrides?.restrictions ?? templateConfig.restrictions ?? []) as string[],
      securityRules: (input.overrides?.securityRules ?? templateConfig.securityRules ?? []) as string[],
      defaultLanguage: (input.overrides?.defaultLanguage ?? templateConfig.defaultLanguage ?? 'pt-BR') as string,
      tags: (input.overrides?.tags ?? templateConfig.tags ?? []) as string[],
      preferredModel: input.overrides?.preferredModel ?? (templateConfig.preferredModel as string | undefined),
      compatibleModelStrategy: input.overrides?.compatibleModelStrategy ?? (templateConfig.compatibleModelStrategy as string | undefined),
      allowedChannels: (input.overrides?.allowedChannels ?? templateConfig.allowedChannels ?? []) as string[],
      enabledCapabilities: (input.overrides?.enabledCapabilities ?? templateConfig.enabledCapabilities ?? []) as string[],
      overrides: input.overrides ?? {},
      deletedAt: null,
      version: 1,
      createdAt: now,
      updatedAt: now
    };

    log.info({ agentId, templateId: input.templateId }, 'Creating agent from template');

    return this.repository.create(agent);
  }

  async updateAgent(id: string, input: UpdateAgentInput): Promise<AgentInstance> {
    const agent = await this.getAgentById(id);

    const updatedAgent: AgentInstance = {
      ...agent,
      name: input.name ?? agent.name,
      description: input.description ?? agent.description,
      visibility: input.visibility ?? agent.visibility,
      status: input.status ?? agent.status,
      overrides: {
        ...agent.overrides,
        ...input.overrides
      },
      role: input.overrides?.role ?? agent.role,
      goal: input.overrides?.goal ?? agent.goal,
      personality: input.overrides?.personality ?? agent.personality,
      tone: input.overrides?.tone ?? agent.tone,
      responseStyle: input.overrides?.responseStyle ?? agent.responseStyle,
      systemInstructions: input.overrides?.systemInstructions ?? agent.systemInstructions,
      restrictions: input.overrides?.restrictions ?? agent.restrictions,
      securityRules: input.overrides?.securityRules ?? agent.securityRules,
      defaultLanguage: input.overrides?.defaultLanguage ?? agent.defaultLanguage,
      tags: input.overrides?.tags ?? agent.tags,
      preferredModel: input.overrides?.preferredModel !== undefined ? input.overrides.preferredModel : agent.preferredModel,
      compatibleModelStrategy: input.overrides?.compatibleModelStrategy !== undefined ? input.overrides.compatibleModelStrategy : agent.compatibleModelStrategy,
      allowedChannels: input.overrides?.allowedChannels ?? agent.allowedChannels,
      enabledCapabilities: input.overrides?.enabledCapabilities ?? agent.enabledCapabilities,
      version: agent.version + 1,
      updatedAt: new Date().toISOString()
    };

    log.info({ agentId: id, version: updatedAgent.version }, 'Updating agent');

    return this.repository.update(updatedAgent);
  }

  async duplicateAgent(id: string, input?: DuplicateAgentInput): Promise<AgentInstance> {
    const original = await this.getAgentById(id);

    const baseSlug = input?.slug ?? input?.name ?? `${original.slug}-copy`;
    const slug = baseSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const existingSlug = await this.repository.findBySlug(slug);
    if (existingSlug) {
      throw new Error(`Agent with slug already exists: ${slug}`);
    }

    const now = new Date().toISOString();
    const duplicated: AgentInstance = {
      ...original,
      id: randomUUID(),
      name: input?.name ?? `${original.name} (Copy)`,
      slug,
      description: original.description,
      status: 'active',
      overrides: { ...original.overrides },
      deletedAt: null,
      version: 1,
      createdAt: now,
      updatedAt: now
    };

    log.info({ originalId: id, newId: duplicated.id }, 'Duplicating agent');

    return this.repository.create(duplicated);
  }

  async activateAgent(id: string): Promise<AgentInstance> {
    return this.updateAgentStatus(id, 'active');
  }

  async deactivateAgent(id: string): Promise<AgentInstance> {
    return this.updateAgentStatus(id, 'disabled');
  }

  private async updateAgentStatus(id: string, status: 'active' | 'disabled'): Promise<AgentInstance> {
    const agent = await this.getAgentById(id);

    const updatedAgent: AgentInstance = {
      ...agent,
      status,
      updatedAt: new Date().toISOString()
    };

    log.info({ agentId: id, status }, 'Updating agent status');

    return this.repository.update(updatedAgent);
  }

  async deleteAgent(id: string): Promise<void> {
    await this.getAgentById(id);
    log.info({ agentId: id }, 'Soft deleting agent');
    await this.repository.softDelete(id);
  }

  async loadAgent(
    id: string,
    loadInput?: LoadAgentInput
  ): Promise<ResolvedAgentConfig> {
    const agent = await this.getAgentById(id);

    if (agent.status === 'disabled') {
      throw new Error('Agent is disabled and cannot be loaded');
    }

    const template = await this.discovery.findTemplateById(agent.templateId);
    if (!template) {
      throw new Error(`Template not found: ${agent.templateId}`);
    }

    log.info({ agentId: id, templateId: agent.templateId }, 'Loading resolved agent config');

    return this.resolver.resolve(
      agent,
      template,
      loadInput?.operationalParameters,
      loadInput?.bindings
    );
  }

  async chat(
    id: string,
    messages: Array<{ role: string; content: string }>,
    stream?: boolean
  ): Promise<{ message: { role: string; content: string }; metadata: Record<string, unknown> }> {
    // 1. Carregar agente resolvido
    const resolvedConfig = await this.loadAgent(id);

    // 2. Verificar se agente está ativo
    const agent = await this.getAgentById(id);
    if (agent.status !== 'active') {
      throw new Error('Agent is not active');
    }

    // 3. Verificar se tem modelo configurado
    const preferredModel = resolvedConfig.effectiveModelPolicy?.preferredModel;
    if (!preferredModel) {
      throw new Error('Agent does not have a preferred model configured');
    }

    // 4. Preparar mensagens com system prompt do agente
    const systemPrompt = resolvedConfig.effectiveSystemPrompt || '';
    const preparedMessages: ProviderChatMessage[] = [];
    
    if (systemPrompt) {
      preparedMessages.push({ role: 'assistant', content: systemPrompt });
    }
    
    for (const m of messages) {
      preparedMessages.push({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      });
    }

    // 5. Chamar provider via orchestrator
    const result = await this.providerOrchestrator.chatByModel({
      modelId: preferredModel,
      messages: preparedMessages
    });

    // 6. PROCESSAR como AGENTE - aplicar personalidade e comportamento
    const rawResponse = result.message.content;

    // Aplicar transformações baseadas no perfil do agente
    const personality = resolvedConfig.effectiveBehaviorProfile?.persona || agent.personality || '';
    const tone = resolvedConfig.effectiveBehaviorProfile?.tone || agent.tone || 'neutral';
    const style = resolvedConfig.effectiveBehaviorProfile?.style || agent.responseStyle || 'professional';
    const role = agent.role || 'Assistant';

    // Criar resposta processada pelo agente
    let processedResponse = rawResponse;

    // Adicionar saudação personalizada se for primeira mensagem
    if (messages.length === 1 && messages[0].role === 'user') {
      const greetings = [
        `Olá! Sou ${agent.name || role}. `,
        `Bem-vindo! Sou ${agent.name || role}. `,
        `Oi! Sou ${agent.name || role}. `
      ];
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      if (!processedResponse.startsWith(greeting.trim())) {
        processedResponse = greeting + processedResponse;
      }
    }

    // 7. Retornar resposta processada pelo agente
    return {
      message: {
        role: 'assistant',
        content: processedResponse
      },
      metadata: {
        agentId: id,
        agentName: agent.name,
        agentRole: role,
        personality: personality,
        tone: tone,
        style: style,
        modelUsed: preferredModel,
        timestamp: new Date().toISOString(),
        processedByAgent: true
      }
    };
  }
}
