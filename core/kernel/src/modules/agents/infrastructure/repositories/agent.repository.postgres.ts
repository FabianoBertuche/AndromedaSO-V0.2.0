import { Pool } from 'pg';
import type { AgentInstance } from '../../../../contracts/agentModule.schema';
import type { AgentRepository } from '../../domain/repositories/agent.repository.js';

interface AgentRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  template_id: string;
  source_template_id: string;
  status: string;
  visibility: string;
  role: string;
  goal: string;
  personality: string;
  tone: string;
  response_style: string;
  system_instructions: unknown;
  restrictions: unknown;
  security_rules: unknown;
  default_language: string;
  tags: unknown;
  preferred_model: string | null;
  compatible_model_strategy: string | null;
  allowed_channels: unknown;
  enabled_capabilities: unknown;
  overrides: unknown;
  deleted_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

function parseJsonArray<T>(value: unknown): T[] {
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
}

function rowToAgent(row: AgentRow): AgentInstance {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    templateId: row.template_id,
    sourceTemplateId: row.source_template_id,
    status: row.status as 'active' | 'disabled',
    visibility: row.visibility as 'private' | 'team' | 'public',
    role: row.role,
    goal: row.goal,
    personality: row.personality,
    tone: row.tone,
    responseStyle: row.response_style,
    systemInstructions: parseJsonArray<string>(row.system_instructions),
    restrictions: parseJsonArray<string>(row.restrictions),
    securityRules: parseJsonArray<string>(row.security_rules),
    defaultLanguage: row.default_language,
    tags: parseJsonArray<string>(row.tags),
    preferredModel: row.preferred_model ?? undefined,
    compatibleModelStrategy: row.compatible_model_strategy ?? undefined,
    allowedChannels: parseJsonArray<string>(row.allowed_channels),
    enabledCapabilities: parseJsonArray<string>(row.enabled_capabilities),
    overrides: typeof row.overrides === 'string' ? JSON.parse(row.overrides) : (row.overrides ?? {}),
    deletedAt: row.deleted_at,
    version: row.version,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

export class AgentRepositoryPostgres implements AgentRepository {
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
      CREATE TABLE IF NOT EXISTS agent_instances (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        template_id TEXT NOT NULL,
        source_template_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        visibility TEXT NOT NULL DEFAULT 'private',
        role TEXT NOT NULL,
        goal TEXT NOT NULL,
        personality TEXT NOT NULL,
        tone TEXT NOT NULL,
        response_style TEXT NOT NULL,
        system_instructions JSONB NOT NULL DEFAULT '[]',
        restrictions JSONB NOT NULL DEFAULT '[]',
        security_rules JSONB NOT NULL DEFAULT '[]',
        default_language TEXT NOT NULL DEFAULT 'pt-BR',
        tags JSONB NOT NULL DEFAULT '[]',
        preferred_model TEXT,
        compatible_model_strategy TEXT,
        allowed_channels JSONB NOT NULL DEFAULT '[]',
        enabled_capabilities JSONB NOT NULL DEFAULT '[]',
        overrides JSONB NOT NULL DEFAULT '{}',
        deleted_at TIMESTAMPTZ,
        version INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT agent_instances_slug_unique UNIQUE (slug)
      )
    `);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_instances_template_id
      ON agent_instances(template_id)
    `);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_instances_status
      ON agent_instances(status)
    `);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_instances_deleted_at
      ON agent_instances(deleted_at)
    `);

    this.initialized = true;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  async list(includeDeleted = false): Promise<AgentInstance[]> {
    await this.ensureInitialized();
    const query = includeDeleted
      ? `SELECT * FROM agent_instances ORDER BY created_at DESC`
      : `SELECT * FROM agent_instances WHERE deleted_at IS NULL ORDER BY created_at DESC`;

    const result = await this.pool.query<AgentRow>(query);
    return result.rows.map(rowToAgent);
  }

  async getById(id: string): Promise<AgentInstance | null> {
    await this.ensureInitialized();
    const result = await this.pool.query<AgentRow>(
      `SELECT * FROM agent_instances WHERE id = $1`,
      [id]
    );
    if (result.rowCount === 0) {
      return null;
    }
    return rowToAgent(result.rows[0]);
  }

  async create(agent: AgentInstance): Promise<AgentInstance> {
    await this.ensureInitialized();
    await this.pool.query(
      `
      INSERT INTO agent_instances(
        id, name, slug, description, template_id, source_template_id,
        status, visibility, role, goal, personality, tone, response_style,
        system_instructions, restrictions, security_rules, default_language,
        tags, preferred_model, compatible_model_strategy, allowed_channels,
        enabled_capabilities, overrides, deleted_at, version, created_at, updated_at
      )
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15::jsonb, $16::jsonb, $17, $18::jsonb, $19, $20, $21::jsonb, $22::jsonb, $23::jsonb, $24, $25, $26, $27)
      `,
      [
        agent.id,
        agent.name,
        agent.slug,
        agent.description,
        agent.templateId,
        agent.sourceTemplateId,
        agent.status,
        agent.visibility,
        agent.role,
        agent.goal,
        agent.personality,
        agent.tone,
        agent.responseStyle,
        JSON.stringify(agent.systemInstructions),
        JSON.stringify(agent.restrictions),
        JSON.stringify(agent.securityRules),
        agent.defaultLanguage,
        JSON.stringify(agent.tags),
        agent.preferredModel ?? null,
        agent.compatibleModelStrategy ?? null,
        JSON.stringify(agent.allowedChannels),
        JSON.stringify(agent.enabledCapabilities),
        JSON.stringify(agent.overrides),
        agent.deletedAt,
        agent.version,
        agent.createdAt,
        agent.updatedAt
      ]
    );
    return agent;
  }

  async update(agent: AgentInstance): Promise<AgentInstance> {
    await this.ensureInitialized();
    const result = await this.pool.query(
      `
      UPDATE agent_instances
      SET name = $2,
          slug = $3,
          description = $4,
          template_id = $5,
          source_template_id = $6,
          status = $7,
          visibility = $8,
          role = $9,
          goal = $10,
          personality = $11,
          tone = $12,
          response_style = $13,
          system_instructions = $14::jsonb,
          restrictions = $15::jsonb,
          security_rules = $16::jsonb,
          default_language = $17,
          tags = $18::jsonb,
          preferred_model = $19,
          compatible_model_strategy = $20,
          allowed_channels = $21::jsonb,
          enabled_capabilities = $22::jsonb,
          overrides = $23::jsonb,
          deleted_at = $24,
          version = $25,
          updated_at = $26
      WHERE id = $1
      `,
      [
        agent.id,
        agent.name,
        agent.slug,
        agent.description,
        agent.templateId,
        agent.sourceTemplateId,
        agent.status,
        agent.visibility,
        agent.role,
        agent.goal,
        agent.personality,
        agent.tone,
        agent.responseStyle,
        JSON.stringify(agent.systemInstructions),
        JSON.stringify(agent.restrictions),
        JSON.stringify(agent.securityRules),
        agent.defaultLanguage,
        JSON.stringify(agent.tags),
        agent.preferredModel ?? null,
        agent.compatibleModelStrategy ?? null,
        JSON.stringify(agent.allowedChannels),
        JSON.stringify(agent.enabledCapabilities),
        JSON.stringify(agent.overrides),
        agent.deletedAt,
        agent.version,
        agent.updatedAt
      ]
    );
    if (result.rowCount === 0) {
      throw new Error('Agent not found');
    }
    return agent;
  }

  async softDelete(id: string): Promise<void> {
    await this.ensureInitialized();
    const result = await this.pool.query(
      `UPDATE agent_instances SET deleted_at = $2, updated_at = $2 WHERE id = $1`,
      [id, new Date().toISOString()]
    );
    if (result.rowCount === 0) {
      throw new Error('Agent not found');
    }
  }

  async findBySlug(slug: string): Promise<AgentInstance | null> {
    await this.ensureInitialized();
    const result = await this.pool.query<AgentRow>(
      `SELECT * FROM agent_instances WHERE slug = $1 AND deleted_at IS NULL`,
      [slug]
    );
    if (result.rowCount === 0) {
      return null;
    }
    return rowToAgent(result.rows[0]);
  }
}
