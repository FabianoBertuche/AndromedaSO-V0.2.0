import type { ModelBenchmarkResult, ModelCatalogItem, Provider } from '../../domain/entities/provider.entity';
import type { OpenAiCodexOAuthSession, ProviderRepository } from '../../domain/repositories/provider.repository';

export class ProviderRepositoryMemory implements ProviderRepository {
  private readonly providers = new Map<string, Provider>();
  private readonly providerIdsByNameAndType = new Map<string, string>();
  private readonly catalogs = new Map<string, ModelCatalogItem[]>();
  private readonly benchmarks: ModelBenchmarkResult[] = [];
  private readonly routingDecisions: Array<{ taskType: string; selectedModel: string; score: number; createdAt: string }> = [];
  private readonly oauthSessions = new Map<string, OpenAiCodexOAuthSession>();
  private readonly oauthSessionIdsByStateHash = new Map<string, string>();

  private createProviderLookupKey(name: string, type: Provider['type']): string {
    return `${name.trim().toLowerCase()}::${type}`;
  }

  private deleteProviderLookup(provider: Provider | undefined): void {
    if (!provider) {
      return;
    }

    this.providerIdsByNameAndType.delete(this.createProviderLookupKey(provider.name, provider.type));
  }

  private setProviderLookup(provider: Provider): void {
    this.providerIdsByNameAndType.set(this.createProviderLookupKey(provider.name, provider.type), provider.id);
  }

  async create(provider: Provider): Promise<Provider> {
    this.providers.set(provider.id, provider);
    this.setProviderLookup(provider);
    return provider;
  }

  async update(provider: Provider): Promise<Provider> {
    this.deleteProviderLookup(this.providers.get(provider.id));
    this.providers.set(provider.id, provider);
    this.setProviderLookup(provider);
    return provider;
  }

  async findById(id: string): Promise<Provider | null> {
    return this.providers.get(id) ?? null;
  }

  async findByName(name: string, type?: Provider['type']): Promise<Provider | null> {
    if (!type) {
      const normalizedName = name.trim().toLowerCase();
      return [...this.providers.values()].find((provider) => provider.name === normalizedName) ?? null;
    }

    const id = this.providerIdsByNameAndType.get(this.createProviderLookupKey(name, type));
    return id ? this.providers.get(id) ?? null : null;
  }

  async list(): Promise<Provider[]> {
    return [...this.providers.values()];
  }

  async setCatalog(providerId: string, models: ModelCatalogItem[]): Promise<void> {
    this.catalogs.set(providerId, models);
  }

  async getCatalog(providerId: string): Promise<ModelCatalogItem[]> {
    return this.catalogs.get(providerId) ?? [];
  }

  async addBenchmark(result: ModelBenchmarkResult): Promise<void> {
    this.benchmarks.unshift(result);
  }

  async listBenchmarks(): Promise<ModelBenchmarkResult[]> {
    return [...this.benchmarks];
  }

  async addRoutingDecision(decision: { taskType: string; selectedModel: string; score: number; createdAt: string }): Promise<void> {
    this.routingDecisions.unshift(decision);
  }

  async listRoutingDecisions(): Promise<Array<{ taskType: string; selectedModel: string; score: number; createdAt: string }>> {
    return [...this.routingDecisions];
  }

  async createOAuthSession(session: OpenAiCodexOAuthSession): Promise<OpenAiCodexOAuthSession> {
    this.oauthSessions.set(session.id, session);
    this.oauthSessionIdsByStateHash.set(session.stateHash, session.id);
    return session;
  }

  async findOAuthSessionByStateHash(stateHash: string): Promise<OpenAiCodexOAuthSession | null> {
    const sessionId = this.oauthSessionIdsByStateHash.get(stateHash);
    if (!sessionId) {
      return null;
    }

    return this.oauthSessions.get(sessionId) ?? null;
  }

  async claimOAuthSessionByStateHash(
    stateHash: string,
    providerType: OpenAiCodexOAuthSession['providerType'],
    consumedAt: string,
    now: string
  ): Promise<OpenAiCodexOAuthSession | null> {
    const sessionId = this.oauthSessionIdsByStateHash.get(stateHash);
    if (!sessionId) {
      return null;
    }

    const session = this.oauthSessions.get(sessionId);
    if (!session) {
      return null;
    }

    if (
      session.providerType !== providerType
      || Boolean(session.consumedAt)
      || Date.parse(session.expiresAt) <= Date.parse(now)
    ) {
      return null;
    }

    const claimedSession = {
      ...session,
      consumedAt
    };

    this.oauthSessions.set(sessionId, claimedSession);
    return claimedSession;
  }

  async consumeOAuthSession(sessionId: string, consumedAt: string): Promise<boolean> {
    const session = this.oauthSessions.get(sessionId);
    if (!session || session.consumedAt) {
      return false;
    }

    this.oauthSessions.set(sessionId, {
      ...session,
      consumedAt
    });

    return true;
  }

  async deleteExpiredOAuthSessions(now: string): Promise<void> {
    const nowTimestamp = Date.parse(now);

    for (const [sessionId, session] of this.oauthSessions.entries()) {
      if (Date.parse(session.expiresAt) > nowTimestamp) {
        continue;
      }

      this.oauthSessions.delete(sessionId);
      this.oauthSessionIdsByStateHash.delete(session.stateHash);
    }
  }

  async delete(id: string): Promise<void> {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error('Provider not found');
    }
    this.providers.delete(id);
    this.deleteProviderLookup(provider);
    this.catalogs.delete(id);
  }

  async reset(): Promise<void> {
    this.providers.clear();
    this.providerIdsByNameAndType.clear();
    this.catalogs.clear();
    this.benchmarks.length = 0;
    this.routingDecisions.length = 0;
    this.oauthSessions.clear();
    this.oauthSessionIdsByStateHash.clear();
  }
}

export const providerRepository = new ProviderRepositoryMemory();
