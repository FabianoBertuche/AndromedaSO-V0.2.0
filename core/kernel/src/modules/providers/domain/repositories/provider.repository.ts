import type { ModelBenchmarkResult, ModelCatalogItem, Provider } from '../entities/provider.entity';

export type OpenAiCodexOAuthSession = {
  id: string;
  providerType: 'openai-codex';
  stateHash: string;
  codeVerifier: string;
  redirectUri: string;
  origin: string;
  expiresAt: string;
  consumedAt?: string;
  createdAt: string;
};

export interface ProviderRepository {
  create(provider: Provider): Promise<Provider>;
  update(provider: Provider): Promise<Provider>;
  findById(id: string): Promise<Provider | null>;
  findByName(name: string, type?: Provider['type']): Promise<Provider | null>;
  list(): Promise<Provider[]>;
  setCatalog(providerId: string, models: ModelCatalogItem[]): Promise<void>;
  getCatalog(providerId: string): Promise<ModelCatalogItem[]>;
  addBenchmark(result: ModelBenchmarkResult): Promise<void>;
  listBenchmarks(): Promise<ModelBenchmarkResult[]>;
  addRoutingDecision(decision: { taskType: string; selectedModel: string; score: number; createdAt: string }): Promise<void>;
  listRoutingDecisions(): Promise<Array<{ taskType: string; selectedModel: string; score: number; createdAt: string }>>;
  createOAuthSession(session: OpenAiCodexOAuthSession): Promise<OpenAiCodexOAuthSession>;
  findOAuthSessionByStateHash(stateHash: string): Promise<OpenAiCodexOAuthSession | null>;
  claimOAuthSessionByStateHash(
    stateHash: string,
    providerType: OpenAiCodexOAuthSession['providerType'],
    consumedAt: string,
    now: string
  ): Promise<OpenAiCodexOAuthSession | null>;
  consumeOAuthSession(sessionId: string, consumedAt: string): Promise<boolean>;
  deleteExpiredOAuthSessions(now: string): Promise<void>;
  reset(): Promise<void>;
  delete(id: string): Promise<void>;
}
