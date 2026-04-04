import { Pool } from 'pg';
import type { ModelBenchmarkResult, ModelCatalogItem, Provider } from '../../domain/entities/provider.entity';
import type { ProviderRepository } from '../../domain/repositories/provider.repository';

const parseJsonArray = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }

  return [];
};

export class ProviderRepositoryPostgres implements ProviderRepository {
  private readonly pool: Pool;
  private initialized = false;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS provider_state (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        api_key_enc TEXT,
        base_url TEXT,
        health TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        selected_model_ids JSONB NOT NULL DEFAULT '[]'::jsonb
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS provider_model_catalog (
        id TEXT PRIMARY KEY,
        provider_id TEXT NOT NULL REFERENCES provider_state(id) ON DELETE CASCADE,
        model_id TEXT NOT NULL,
        display_name TEXT NOT NULL,
        context_window TEXT NOT NULL,
        capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
        price_label TEXT NOT NULL,
        score DOUBLE PRECISION NOT NULL,
        latency_ms INTEGER NOT NULL
      )
    `);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_provider_model_catalog_provider_id
      ON provider_model_catalog(provider_id)
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS provider_model_benchmark (
        id TEXT PRIMARY KEY,
        model_id TEXT NOT NULL,
        task_type TEXT NOT NULL,
        score DOUBLE PRECISION NOT NULL,
        latency_ms INTEGER NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS provider_routing_decision (
        id BIGSERIAL PRIMARY KEY,
        task_type TEXT NOT NULL,
        selected_model TEXT NOT NULL,
        score DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      )
    `);

    this.initialized = true;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  async create(provider: Provider): Promise<Provider> {
    await this.ensureInitialized();
    await this.pool.query(
      `
      INSERT INTO provider_state(id, name, type, api_key_enc, base_url, health, created_at, selected_model_ids)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
      `,
      [
        provider.id,
        provider.name,
        provider.type,
        provider.apiKeyEnc ?? null,
        provider.baseUrl ?? null,
        provider.health,
        provider.createdAt,
        JSON.stringify(provider.selectedModelIds ?? [])
      ]
    );

    return provider;
  }

  async update(provider: Provider): Promise<Provider> {
    await this.ensureInitialized();
    await this.pool.query(
      `
      UPDATE provider_state
      SET name = $2,
          type = $3,
          api_key_enc = $4,
          base_url = $5,
          health = $6,
          selected_model_ids = $7::jsonb
      WHERE id = $1
      `,
      [
        provider.id,
        provider.name,
        provider.type,
        provider.apiKeyEnc ?? null,
        provider.baseUrl ?? null,
        provider.health,
        JSON.stringify(provider.selectedModelIds ?? [])
      ]
    );

    return provider;
  }

  async findById(id: string): Promise<Provider | null> {
    await this.ensureInitialized();
    const result = await this.pool.query(
      `
      SELECT id, name, type, api_key_enc, base_url, health, created_at, selected_model_ids
      FROM provider_state
      WHERE id = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      apiKeyEnc: row.api_key_enc ?? undefined,
      baseUrl: row.base_url ?? undefined,
      health: row.health,
      createdAt: new Date(row.created_at).toISOString(),
      selectedModelIds: parseJsonArray<string>(row.selected_model_ids)
    };
  }

  async findByName(name: string): Promise<Provider | null> {
    await this.ensureInitialized();
    const result = await this.pool.query(
      `
      SELECT id
      FROM provider_state
      WHERE lower(name) = lower($1)
      LIMIT 1
      `,
      [name]
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.findById(result.rows[0].id);
  }

  async list(): Promise<Provider[]> {
    await this.ensureInitialized();
    const result = await this.pool.query(
      `
      SELECT id, name, type, api_key_enc, base_url, health, created_at, selected_model_ids
      FROM provider_state
      ORDER BY created_at DESC
      `
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      apiKeyEnc: row.api_key_enc ?? undefined,
      baseUrl: row.base_url ?? undefined,
      health: row.health,
      createdAt: new Date(row.created_at).toISOString(),
      selectedModelIds: parseJsonArray<string>(row.selected_model_ids)
    }));
  }

  async setCatalog(providerId: string, models: ModelCatalogItem[]): Promise<void> {
    await this.ensureInitialized();
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM provider_model_catalog WHERE provider_id = $1', [providerId]);

      for (const model of models) {
        await client.query(
          `
          INSERT INTO provider_model_catalog(
            id,
            provider_id,
            model_id,
            display_name,
            context_window,
            capabilities,
            price_label,
            score,
            latency_ms
          )
          VALUES($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9)
          `,
          [
            model.id,
            model.providerId,
            model.modelId,
            model.displayName,
            model.contextWindow,
            JSON.stringify(model.capabilities),
            model.priceLabel,
            model.score,
            model.latencyMs
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getCatalog(providerId: string): Promise<ModelCatalogItem[]> {
    await this.ensureInitialized();
    const result = await this.pool.query(
      `
      SELECT id, provider_id, model_id, display_name, context_window, capabilities, price_label, score, latency_ms
      FROM provider_model_catalog
      WHERE provider_id = $1
      ORDER BY score DESC, display_name ASC
      `,
      [providerId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      providerId: row.provider_id,
      modelId: row.model_id,
      displayName: row.display_name,
      contextWindow: row.context_window,
      capabilities: parseJsonArray<'coding' | 'chat' | 'analysis' | 'reasoning'>(row.capabilities),
      priceLabel: row.price_label,
      score: Number(row.score),
      latencyMs: Number(row.latency_ms)
    }));
  }

  async addBenchmark(result: ModelBenchmarkResult): Promise<void> {
    await this.ensureInitialized();
    await this.pool.query(
      `
      INSERT INTO provider_model_benchmark(id, model_id, task_type, score, latency_ms, executed_at)
      VALUES($1, $2, $3, $4, $5, $6)
      `,
      [result.id, result.modelId, result.taskType, result.score, result.latencyMs, result.executedAt]
    );
  }

  async listBenchmarks(): Promise<ModelBenchmarkResult[]> {
    await this.ensureInitialized();
    const result = await this.pool.query(
      `
      SELECT id, model_id, task_type, score, latency_ms, executed_at
      FROM provider_model_benchmark
      ORDER BY executed_at DESC
      LIMIT 200
      `
    );

    return result.rows.map((row) => ({
      id: row.id,
      modelId: row.model_id,
      taskType: row.task_type,
      score: Number(row.score),
      latencyMs: Number(row.latency_ms),
      executedAt: new Date(row.executed_at).toISOString()
    }));
  }

  async addRoutingDecision(decision: { taskType: string; selectedModel: string; score: number; createdAt: string }): Promise<void> {
    await this.ensureInitialized();
    await this.pool.query(
      `
      INSERT INTO provider_routing_decision(task_type, selected_model, score, created_at)
      VALUES($1, $2, $3, $4)
      `,
      [decision.taskType, decision.selectedModel, decision.score, decision.createdAt]
    );
  }

  async listRoutingDecisions(): Promise<Array<{ taskType: string; selectedModel: string; score: number; createdAt: string }>> {
    await this.ensureInitialized();
    const result = await this.pool.query(
      `
      SELECT task_type, selected_model, score, created_at
      FROM provider_routing_decision
      ORDER BY created_at DESC
      LIMIT 200
      `
    );

    return result.rows.map((row) => ({
      taskType: row.task_type,
      selectedModel: row.selected_model,
      score: Number(row.score),
      createdAt: new Date(row.created_at).toISOString()
    }));
  }

  async reset(): Promise<void> {
    // No-op for postgres repository. Tests should use memory mode.
  }

  async delete(id: string): Promise<void> {
    await this.ensureInitialized();
    const result = await this.pool.query(
      'DELETE FROM provider_state WHERE id = $1',
      [id]
    );
    if (result.rowCount === 0) {
      throw new Error('Provider not found');
    }
  }
}
