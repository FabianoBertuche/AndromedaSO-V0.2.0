import type { ModelCatalogItem } from '../../domain/entities/provider.entity';

export interface ProviderAdapter {
  listModels(): Promise<Array<Omit<ModelCatalogItem, 'id' | 'providerId'>>>;
  ping(): Promise<{ ok: boolean; latencyMs: number }>;
}

export type AdapterFactory = (apiKey?: string, baseUrl?: string) => ProviderAdapter;
