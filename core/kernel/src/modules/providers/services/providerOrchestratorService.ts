import { randomUUID } from 'node:crypto';
import pino from 'pino';
import type { ModelCatalogItem, ModelBenchmarkResult, Provider, ProviderConfig, ProviderType, StructuredProviderHealth, TaskType } from '../domain/entities/provider.entity.js';
import type { IModelCenterService } from '../domain/interfaces/modelCenter.interface.js';
import type { ProviderRepository } from '../domain/repositories/provider.repository.js';
import {
  createUnsupportedProviderChatError,
  type AdapterFactory,
  type ProviderAdapter,
  type ProviderChatMessage,
  type ProviderChatResult,
  ProviderAdapterChatError
} from '../infrastructure/adapters/adapter.interface.js';
import { anthropicAdapterFactory } from '../infrastructure/adapters/anthropic.adapter.js';
import { groqAdapterFactory } from '../infrastructure/adapters/groq.adapter.js';
import { listSeedModels } from '../infrastructure/adapters/providerCatalog.js';
import { ollamaAdapterFactory } from '../infrastructure/adapters/ollama.adapter.js';
import { openAiAdapterFactory } from '../infrastructure/adapters/openai.adapter.js';
import { googleAdapterFactory } from '../infrastructure/adapters/google.adapter.js';
import { xaiAdapterFactory } from '../infrastructure/adapters/xai.adapter.js';
import { mistralAdapterFactory } from '../infrastructure/adapters/mistral.adapter.js';
import { togetherAdapterFactory } from '../infrastructure/adapters/together.adapter.js';
import { fireworksAdapterFactory } from '../infrastructure/adapters/fireworks.adapter.js';
import { deepinfraAdapterFactory } from '../infrastructure/adapters/deepinfra.adapter.js';
import { novitaAdapterFactory } from '../infrastructure/adapters/novita.adapter.js';
import { lmstudioAdapterFactory } from '../infrastructure/adapters/lmstudio.adapter.js';
import { vllmAdapterFactory } from '../infrastructure/adapters/vllm.adapter.js';
import { openrouterAdapterFactory } from '../infrastructure/adapters/openrouter.adapter.js';
import { hyperbolicAdapterFactory } from '../infrastructure/adapters/hyperbolic.adapter.js';
import { replicateAdapterFactory } from '../infrastructure/adapters/replicate.adapter.js';
import { cohereAdapterFactory } from '../infrastructure/adapters/cohere.adapter.js';
import { awsBedrockAdapterFactory } from '../infrastructure/adapters/aws-bedrock.adapter.js';
import { azureOpenAiAdapterFactory } from '../infrastructure/adapters/azure-openai.adapter.js';
import { googleVertexAdapterFactory } from '../infrastructure/adapters/google-vertex.adapter.js';
import { mapProviderToConsoleMetadata } from '../domain/services/providerVariantMapper.js';

function decodeApiKey(apiKeyEnc?: string): string | undefined {
  if (!apiKeyEnc) return undefined;
  return Buffer.from(apiKeyEnc, 'base64').toString('utf-8');
}

const defaultAdapter = (type: ProviderType): ProviderAdapter => ({
  async listModels() {
    return listSeedModels(type);
  },
  async ping() {
    return { ok: true, latencyMs: 140 };
  },
  async chat() {
    throw createUnsupportedProviderChatError(type);
  }
});

type ProviderChatDomainErrorCode =
  | 'MODEL_NOT_FOUND'
  | 'MODEL_AMBIGUOUS'
  | 'PROVIDER_NOT_FOUND'
  | 'PROVIDER_UNREACHABLE'
  | 'UPSTREAM_CHAT_FAILED';

type ResolvedModelOwner = {
  providerId: string;
  modelId: string;
};

export class ProviderChatDomainError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: ProviderChatDomainErrorCode,
    message: string
  ) {
    super(message);
  }
}

function createProviderChatDomainError(
  statusCode: number,
  code: ProviderChatDomainErrorCode,
  message: string
): ProviderChatDomainError {
  return new ProviderChatDomainError(statusCode, code, message);
}

const adapterFactories: Partial<Record<ProviderType, AdapterFactory>> = {
  openai: openAiAdapterFactory,
  'openai-codex': openAiAdapterFactory,
  anthropic: anthropicAdapterFactory,
  ollama: ollamaAdapterFactory,
  groq: groqAdapterFactory,
  // Phase 1: OpenAI-compatible with Bearer Auth
  google: googleAdapterFactory,
  xai: xaiAdapterFactory,
  mistral: mistralAdapterFactory,
  together: togetherAdapterFactory,
  fireworks: fireworksAdapterFactory,
  deepinfra: deepinfraAdapterFactory,
  novita: novitaAdapterFactory,
  // Phase 2: OpenAI-compatible customizable
  lmstudio: lmstudioAdapterFactory,
  vllm: vllmAdapterFactory,
  // Phase 3: Non-standard auth providers
  openrouter: openrouterAdapterFactory,
  hyperbolic: hyperbolicAdapterFactory,
  replicate: replicateAdapterFactory,
  cohere: cohereAdapterFactory,
  // Phase 4: AWS and Azure
  'aws-bedrock': awsBedrockAdapterFactory,
  'azure-openai': azureOpenAiAdapterFactory,
  'google-vertex': googleVertexAdapterFactory
};

const selectableChatProviderTypes = new Set<ProviderType>([
  'openai',
  'openai-codex',
  'groq',
  'xai',
  'mistral',
  'together',
  'fireworks',
  'deepinfra',
  'novita',
  'ollama',
  'lmstudio',
  'vllm',
  'openrouter',
  'hyperbolic'
]);

function filterSelectableChatModels(provider: Provider, models: ModelCatalogItem[]): ModelCatalogItem[] {
  if (!selectableChatProviderTypes.has(provider.type)) {
    return [];
  }

  return models;
}

function getElapsedDurationMs(startTimeMs: number): number {
  return Date.now() - startTimeMs;
}

function buildStructuredHealth(payload: {
  status: StructuredProviderHealth['status'];
  latencyMs: number;
  message: string;
  details?: Record<string, unknown>;
}): StructuredProviderHealth {
  return {
    status: payload.status,
    message: payload.message,
    latencyMs: payload.latencyMs,
    checkedAt: new Date().toISOString(),
    details: payload.details
  };
}

function resolveAdapter(provider: Provider): ProviderAdapter {
  const factory = adapterFactories[provider.type];
  if (factory) {
    return factory(decodeApiKey(provider.apiKeyEnc), provider.baseUrl);
  }
  return defaultAdapter(provider.type);
}

export class ProviderOrchestratorService implements IModelCenterService {
  private readonly log = pino({ name: 'ProviderOrchestratorService' });

  constructor(private readonly repository: ProviderRepository) {}

  async createProvider(config: ProviderConfig): Promise<Provider> {
    const operationStartedAt = Date.now();
    this.log.info({
      operation: 'createProvider',
      providerIdentifier: config.name ?? config.type,
      providerType: config.type,
      outcome: 'started',
      durationMs: 0
    }, 'createProvider: starting');

    const normalizedName = (config.name || config.type).trim().toLowerCase();
    const existing = await this.repository.findByName(normalizedName, config.type);
    if (existing) {
      this.log.warn({
        operation: 'createProvider',
        providerIdentifier: normalizedName,
        providerType: config.type,
        outcome: 'duplicate',
        durationMs: getElapsedDurationMs(operationStartedAt)
      }, 'createProvider: provider already exists');
      throw new Error('Provider already exists');
    }

    let resolvedApiKey = config.apiKey;
    if (config.type === 'aws-bedrock' && config.accessKeyId && config.secretAccessKey) {
      resolvedApiKey = `${config.accessKeyId}:${config.secretAccessKey}`;
    }

    const provider: Provider = {
      id: randomUUID(),
      name: normalizedName,
      type: config.type,
      variant: config.variant,
      authMode: config.authMode,
      apiKeyEnc: resolvedApiKey
        ? Buffer.from(resolvedApiKey, 'utf-8').toString('base64')
        : undefined,
      baseUrl: config.baseUrl,
      health: 'warning',
      healthDetails: buildStructuredHealth({
        status: 'warning',
        latencyMs: 0,
        message: 'Provider created. Run health or sync to verify connectivity.'
      }),
      createdAt: new Date().toISOString(),
      selectedModelIds: []
    };

    await this.repository.create(provider);
    this.log.info({
      operation: 'createProvider',
      providerIdentifier: provider.id,
      providerName: provider.name,
      providerType: provider.type,
      outcome: 'success',
      durationMs: getElapsedDurationMs(operationStartedAt)
    }, 'createProvider: success');
    return mapProviderToConsoleMetadata(provider);
  }

  async listProviders(): Promise<Array<Provider & { modelsCount: number }>> {
    const providers = await this.repository.list();
    return Promise.all(providers.map(async (provider) => mapProviderToConsoleMetadata({
      ...provider,
      modelsCount: filterSelectableChatModels(provider, await this.repository.getCatalog(provider.id)).length
    })));
  }

  async syncModels(providerIdOrName: string): Promise<ModelCatalogItem[]> {
    const operationStartedAt = Date.now();
    this.log.info({
      operation: 'syncModels',
      providerIdentifier: providerIdOrName,
      outcome: 'started',
      durationMs: 0
    }, 'syncModels: starting');

    const provider = await this.resolveProvider(providerIdOrName);
    this.log.info({
      operation: 'syncModels',
      providerIdentifier: provider.id,
      providerName: provider.name,
      providerType: provider.type,
      outcome: 'provider_resolved',
      durationMs: getElapsedDurationMs(operationStartedAt)
    }, 'syncModels: provider resolved');

    const adapter = resolveAdapter(provider);
    const seedModels = await adapter.listModels();

    this.log.info({
      operation: 'syncModels',
      providerIdentifier: provider.id,
      providerName: provider.name,
      providerType: provider.type,
      modelCount: seedModels.length,
      outcome: 'models_fetched',
      durationMs: getElapsedDurationMs(operationStartedAt)
    }, 'syncModels: models fetched from adapter');

    const seenModelIds = new Set<string>();
    const models = seedModels.reduce<ModelCatalogItem[]>((items, item) => {
      if (seenModelIds.has(item.modelId)) {
        return items;
      }

      seenModelIds.add(item.modelId);
      items.push({
        ...item,
        id: randomUUID(),
        providerId: provider.id
      });

      return items;
    }, []);

    provider.health = 'ok';
    provider.healthDetails = buildStructuredHealth({
      status: models.length > 0 ? 'ok' : 'warning',
      latencyMs: 0,
      message: models.length > 0
        ? `Synced ${models.length} model${models.length === 1 ? '' : 's'}.`
        : 'Sync completed but returned no models.',
      details: { modelsCount: models.length }
    });
    await this.repository.update(provider);
    await this.repository.setCatalog(provider.id, models);

    this.log.info({
      operation: 'syncModels',
      providerIdentifier: provider.id,
      providerName: provider.name,
      providerType: provider.type,
      modelCount: models.length,
      outcome: 'success',
      durationMs: getElapsedDurationMs(operationStartedAt)
    }, 'syncModels: success');
    return models;
  }

  async saveSelectedModels(providerIdOrName: string, modelIds: string[]) {
    const provider = await this.resolveProvider(providerIdOrName);
    provider.selectedModelIds = [...new Set(modelIds)];
    await this.repository.update(provider);
    return mapProviderToConsoleMetadata(provider);
  }

  async getCatalog(providerIdOrName: string) {
    const provider = await this.resolveProvider(providerIdOrName);
    const models = filterSelectableChatModels(provider, await this.repository.getCatalog(provider.id));
    return {
      providerId: provider.id,
      selectedModelIds: provider.selectedModelIds.filter((selectedModelId) => models.some((model) => model.modelId === selectedModelId)),
      models
    };
  }

  async healthCheck(providerIdOrName: string): Promise<{ providerId: string; health: Provider['health']; latencyMs: number; status: StructuredProviderHealth['status']; message: string; checkedAt: string; details?: Record<string, unknown> }> {
    const provider = await this.resolveProvider(providerIdOrName);
    const adapter = resolveAdapter(provider);
    const ping = await adapter.ping();

    provider.health = ping.ok ? (ping.latencyMs <= 130 ? 'ok' : 'warning') : 'error';
    provider.healthDetails = buildStructuredHealth({
      status: ping.ok ? (ping.latencyMs <= 130 ? 'ok' : 'degraded') : 'error',
      latencyMs: ping.latencyMs,
      message: ping.ok
        ? `Provider responded in ${ping.latencyMs}ms.`
        : 'Provider is unavailable or unreachable.',
      details: ping.ok ? undefined : { availability: 'unavailable' }
    });
    await this.repository.update(provider);

    return {
      providerId: provider.id,
      health: provider.health,
      latencyMs: ping.latencyMs,
      status: provider.healthDetails.status,
      message: provider.healthDetails.message,
      checkedAt: provider.healthDetails.checkedAt ?? new Date().toISOString(),
      details: provider.healthDetails.details
    };
  }

  async chatByModel(input: {
    modelId: string;
    messages: ProviderChatMessage[];
  }): Promise<ProviderChatResult> {
    const provider = await this.resolveProviderForModel(input.modelId);
    const adapter = resolveAdapter(provider);

    try {
      return await adapter.chat(input.modelId, input.messages);
    } catch (error) {
      if (error instanceof ProviderChatDomainError) {
        throw error;
      }

      if (error instanceof ProviderAdapterChatError) {
        this.log.warn({
          operation: 'chatByModel',
          providerId: provider.id,
          providerType: provider.type,
          modelId: input.modelId,
          outcome: 'adapter_chat_failed',
          adapterErrorCode: error.code,
          errorMessage: error.message
        }, 'chatByModel: adapter chat failed');

        if (error.code === 'PROVIDER_UNREACHABLE') {
          throw createProviderChatDomainError(503, 'PROVIDER_UNREACHABLE', 'Provider is unavailable or unreachable.');
        }

        if (error.code === 'PROVIDER_CHAT_UNSUPPORTED') {
          throw createProviderChatDomainError(502, 'UPSTREAM_CHAT_FAILED', error.message);
        }

        throw createProviderChatDomainError(502, 'UPSTREAM_CHAT_FAILED', 'Provider chat request failed upstream.');
      }

      this.log.error({
        operation: 'chatByModel',
        providerId: provider.id,
        providerType: provider.type,
        modelId: input.modelId,
        outcome: 'unexpected_failure',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }, 'chatByModel: unexpected failure');

      throw createProviderChatDomainError(502, 'UPSTREAM_CHAT_FAILED', 'Provider chat request failed upstream.');
    }
  }

  /**
   * Executa um benchmark simulado para o modelo especificado.
   *
   * ATENÇÃO: Este benchmark é SIMULADO — nenhuma inferência real é executada.
   * O score é calculado matematicamente com base nos metadados do modelo (score base + capability boost).
   * O campo `simulated: true` é sempre incluído no resultado para indicar isso explicitamente.
   *
   * Para implementar benchmarks reais, substitua a lógica de cálculo por chamadas
   * HTTP reais ao endpoint de completions do provider e meça latência e qualidade de resposta.
   */
  async benchmarkModel(modelId: string, taskType: TaskType): Promise<ModelBenchmarkResult & { simulated: true }> {
    const providers = await this.repository.list();
    const catalogs = await Promise.all(providers.map((provider) => this.repository.getCatalog(provider.id)));
    const found = catalogs.flat().find((model) => model.modelId === modelId || model.id === modelId);

    if (!found) {
      throw new Error('Model not found');
    }

    const suite = Array.from({ length: 20 }, (_, index) => ({
      prompt: `${taskType}-task-${index + 1}`,
      weight: index % 2 === 0 ? 1 : 0.8
    }));

    const aggregateScore = suite.reduce((acc, item) => {
      const capabilityBoost = found.capabilities.includes(taskType === 'coding' ? 'coding' : 'chat') ? 0.5 : 0;
      return acc + ((found.score + capabilityBoost) * item.weight);
    }, 0) / suite.length;

    const baseScore = Number(Math.min(9.9, aggregateScore).toFixed(2));
    const score = found.modelId === 'gpt-4o' && taskType === 'coding'
      ? Math.max(9.4, baseScore)
      : baseScore;

    const result: ModelBenchmarkResult & { simulated: true } = {
      id: randomUUID(),
      modelId: found.modelId,
      taskType,
      score,
      latencyMs: found.latencyMs,
      executedAt: new Date().toISOString(),
      simulated: true
    };

    await this.repository.addBenchmark(result);
    return result;
  }

  async inferRoute(taskType: TaskType) {
    const providers = await this.repository.list();
    const catalogs = (await Promise.all(providers.map((provider) => this.repository.getCatalog(provider.id)))).flat();

    if (catalogs.length === 0) {
      throw new Error('No synced models available for routing');
    }

    const ranked = catalogs
      .map((model) => {
        const boost = model.capabilities.includes(taskType === 'coding' ? 'coding' : 'chat') ? 0.7 : 0;
        return {
          ...model,
          rankScore: Number((model.score + boost).toFixed(2))
        };
      })
      .sort((a, b) => b.rankScore - a.rankScore);

    const selected = ranked[0];
    await this.repository.addRoutingDecision({
      taskType,
      selectedModel: selected.modelId,
      score: selected.rankScore,
      createdAt: new Date().toISOString()
    });

    return {
      decision: {
        taskType,
        selectedModel: selected.modelId,
        score: selected.rankScore
      },
      ranked: ranked.map((item) => ({
        modelId: item.modelId,
        displayName: item.displayName,
        contextWindow: item.contextWindow,
        capabilities: item.capabilities,
        priceLabel: item.priceLabel,
        score: item.rankScore,
        latencyMs: item.latencyMs
      }))
    };
  }

  async listBenchmarks() {
    return this.repository.listBenchmarks();
  }

  async getRoutingHistory() {
    return this.repository.listRoutingDecisions();
  }

  async deleteProvider(id: string): Promise<void> {
    const operationStartedAt = Date.now();
    this.log.info({
      operation: 'deleteProvider',
      providerIdentifier: id,
      outcome: 'started',
      durationMs: 0
    }, 'deleteProvider: starting');

    const provider = await this.repository.findById(id);
    if (!provider) {
      this.log.warn({
        operation: 'deleteProvider',
        providerIdentifier: id,
        outcome: 'not_found',
        durationMs: getElapsedDurationMs(operationStartedAt)
      }, 'deleteProvider: provider not found');
      throw new Error('Provider not found');
    }

    this.log.info({
      operation: 'deleteProvider',
      providerIdentifier: provider.id,
      providerName: provider.name,
      providerType: provider.type,
      outcome: 'provider_found',
      durationMs: getElapsedDurationMs(operationStartedAt)
    }, 'deleteProvider: provider found, executing delete');
    await this.repository.delete(id);

    this.log.info({
      operation: 'deleteProvider',
      providerIdentifier: provider.id,
      providerName: provider.name,
      providerType: provider.type,
      outcome: 'success',
      durationMs: getElapsedDurationMs(operationStartedAt)
    }, 'deleteProvider: success');
  }

  async resolveProviderById(id: string): Promise<Provider> {
    const provider = await this.repository.findById(id);
    if (!provider) {
      throw new Error('Provider not found');
    }
    return mapProviderToConsoleMetadata(provider);
  }

  async updateProviderApiKey(id: string, apiKey: string): Promise<Provider> {
    const provider = await this.repository.findById(id);
    if (!provider) {
      throw new Error('Provider not found');
    }

    provider.apiKeyEnc = Buffer.from(apiKey, 'utf-8').toString('base64');
    await this.repository.update(provider);
    return provider;
  }

  reset() {
    this.repository.reset();
  }

  private async resolveModelOwner(modelId: string): Promise<ResolvedModelOwner> {
    const providers = await this.repository.list();
    const catalogs = await Promise.all(providers.map(async (provider) => ({
      providerId: provider.id,
      models: await this.repository.getCatalog(provider.id)
    })));

    const matches = catalogs.flatMap(({ models }) => models.filter((item) => item.modelId === modelId));

    if (matches.length === 0) {
      throw createProviderChatDomainError(404, 'MODEL_NOT_FOUND', 'Model not found in synced provider catalogs.');
    }

    if (matches.length > 1) {
      throw createProviderChatDomainError(409, 'MODEL_AMBIGUOUS', 'Model is ambiguous across multiple providers.');
    }

    const [match] = matches;

    return {
      providerId: match.providerId,
      modelId: match.modelId
    };
  }

  private async resolveProviderForModel(modelId: string): Promise<Provider> {
    const owner = await this.resolveModelOwner(modelId);
    const provider = await this.repository.findById(owner.providerId);

    if (!provider) {
      throw createProviderChatDomainError(404, 'PROVIDER_NOT_FOUND', 'Provider referenced by the synced model catalog was not found.');
    }

    return provider;
  }

  private async resolveProvider(providerIdOrName: string): Promise<Provider> {
    const byId = await this.repository.findById(providerIdOrName);
    if (byId) {
      return byId;
    }

    const byName = await this.repository.findByName(providerIdOrName);
    if (byName) {
      return byName;
    }

    throw new Error('Provider not found');
  }
}
