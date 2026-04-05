import { pgTable, uuid, text, varchar, jsonb, timestamp, uniqueIndex, real, integer, boolean } from 'drizzle-orm-pg';
import { sql } from 'drizzle-orm';

export const modulesRegistry = pgTable('modules_registry', {
  id: uuid('id').primaryKey(),
  moduleId: varchar('module_id', { length: 255 }).notNull(),
  groupName: varchar('group_name', { length: 255 }).notNull(),
  variantName: varchar('variant_name', { length: 255 }).notNull(),
  version: varchar('version', { length: 50 }).notNull(),
  status: text('status').notNull(),
  capabilities: jsonb('capabilities').notNull(),
  contracts: jsonb('contracts').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  moduleIdUnique: uniqueIndex('modules_registry_module_id_idx').on(table.moduleId)
}));

export const lifecycleEvents = pgTable('lifecycle_events', {
  id: uuid('id').primaryKey(),
  moduleId: varchar('module_id', { length: 255 }).notNull(),
  stateFrom: text('state_from').notNull(),
  stateTo: text('state_to').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  reason: text('reason'),
  context: jsonb('context')
});

export const providers = pgTable('providers', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  apiBase: varchar('api_base', { length: 500 }),
  baseUrl: varchar('base_url', { length: 500 }),
  apiKeyEnc: text('api_key_enc'),
  health: varchar('health', { length: 20 }).notNull().default('warning'),
  selectedModelIds: jsonb('selected_model_ids').notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  providerNameTypeUnique: uniqueIndex('providers_name_type_idx').on(table.name, table.type)
}));

export const modelCatalogItems = pgTable('model_catalog_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  providerId: uuid('provider_id').notNull().references(() => providers.id, { onDelete: 'cascade' }),
  modelId: varchar('model_id', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  capabilities: jsonb('capabilities').notNull().default([]),
  score: real('score').notNull().default(0),
  latencyMs: integer('latency_ms').notNull().default(0),
  costUsd: real('cost_usd'),
  priceLabel: varchar('price_label', { length: 100 }),
  contextWindow: varchar('context_window', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const modelBenchmarkResults = pgTable('model_benchmark_results', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  modelId: varchar('model_id', { length: 255 }).notNull(),
  taskType: varchar('task_type', { length: 50 }).notNull().default('chat'),
  score: real('score').notNull(),
  latencyMs: integer('latency_ms').notNull(),
  tokensIn: integer('tokens_in').notNull().default(0),
  tokensOut: integer('tokens_out').notNull().default(0),
  costUsd: real('cost_usd'),
  success: boolean('success').notNull().default(true),
  simulated: boolean('simulated').notNull().default(true),
  executedAt: timestamp('executed_at').defaultNow().notNull()
});

export const routingDecisions = pgTable('routing_decisions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  taskType: varchar('task_type', { length: 50 }).notNull(),
  selectedModel: varchar('selected_model', { length: 255 }).notNull(),
  score: real('score').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
