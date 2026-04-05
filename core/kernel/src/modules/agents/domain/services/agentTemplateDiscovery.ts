import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import pino from 'pino';
import { parse as parseYaml } from 'yaml';
import { agentTemplateManifestSchema } from '../../../../contracts/agentTemplate.schema.js';

const log = pino({ name: 'agents:discovery' });

const TEMPLATE_MANIFEST_FILENAME = 'template.manifest.yaml';

export class AgentTemplateDiscovery {
  private catalog: ReturnType<typeof agentTemplateManifestSchema.parse>[] | null = null;

  private parseYamlContent(content: string): Record<string, unknown> {
    // Use the yaml package for proper YAML parsing with nested objects
    return parseYaml(content, { strict: true }) as Record<string, unknown>;
  }

  private discoverTemplatesFromPath(basePath: string): ReturnType<typeof agentTemplateManifestSchema.parse>[] {
    const templates: ReturnType<typeof agentTemplateManifestSchema.parse>[] = [];
    const seenTemplateIds = new Set<string>();

    const processTemplateFile = (manifestPath: string): void => {
      try {
        const content = readFileSync(manifestPath, 'utf-8');
        const parsed = this.parseYamlContent(content);
        const validated = agentTemplateManifestSchema.parse(parsed);

        if (seenTemplateIds.has(validated.templateId)) {
          throw new Error(`Duplicate templateId: ${validated.templateId}`);
        }

        seenTemplateIds.add(validated.templateId);
        templates.push(validated);
        log.info({ templateId: validated.templateId, path: manifestPath }, 'Template discovered');
      } catch (error) {
        log.error({ error: (error as Error).message, path: manifestPath }, 'Failed to parse template manifest');
      }
    };

    // Use glob-style pattern matching for efficiency
    // Pattern: modules/agents/groups/*/variants/*/templates/*/template.manifest.yaml
    const groupsPath = join(basePath, 'modules', 'agents', 'groups');
    if (!existsSync(groupsPath)) {
      log.warn({ path: groupsPath }, 'Groups directory not found');
      return [];
    }

    try {
      const groups = readdirSync(groupsPath);
      for (const group of groups) {
        const variantsPath = join(groupsPath, group, 'variants');
        if (!existsSync(variantsPath)) continue;

        const variants = readdirSync(variantsPath);
        for (const variant of variants) {
          const templatesPath = join(variantsPath, variant, 'templates');
          if (!existsSync(templatesPath)) continue;

          const templateDirs = readdirSync(templatesPath);
          for (const templateDir of templateDirs) {
            const manifestPath = join(templatesPath, templateDir, TEMPLATE_MANIFEST_FILENAME);
            if (existsSync(manifestPath)) {
              processTemplateFile(manifestPath);
            }
          }
        }
      }
    } catch (error) {
      log.warn({ error: (error as Error).message, path: groupsPath }, 'Failed to scan template directories');
    }

    return templates.sort((a, b) => {
      if (a.group !== b.group) return a.group.localeCompare(b.group);
      if (a.variant !== b.variant) return a.variant.localeCompare(b.variant);
      return a.templateId.localeCompare(b.templateId);
    });
  }

  async listTemplates(basePath?: string): Promise<ReturnType<typeof agentTemplateManifestSchema.parse>[]> {
    if (this.catalog !== null) {
      return this.catalog;
    }

    const discoveryPath = basePath 
      ?? process.env.AGENT_TEMPLATES_PATH 
      ?? process.cwd();
    this.catalog = this.discoverTemplatesFromPath(discoveryPath);
    log.info({ count: this.catalog.length, path: discoveryPath }, 'Template catalog built');

    return this.catalog;
  }

  async findTemplateById(templateId: string, basePath?: string): Promise<ReturnType<typeof agentTemplateManifestSchema.parse> | null> {
    const catalog = await this.listTemplates(basePath);
    return catalog.find((t) => t.templateId === templateId) ?? null;
  }

  reset(): void {
    this.catalog = null;
  }
}

export const agentTemplateDiscovery = new AgentTemplateDiscovery();
