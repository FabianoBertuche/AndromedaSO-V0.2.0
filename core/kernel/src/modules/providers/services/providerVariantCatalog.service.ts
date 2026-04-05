import { readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PublicProviderVariant } from '../domain/entities/provider.entity.js';
import { parseModuleManifestFile } from '../../../validation/manifestParser.js';
import { getConsoleVariantDefinition, isConsoleVariant } from '../domain/services/providerVariantMapper.js';

type ProviderVariantCatalogItem = {
  variant: PublicProviderVariant;
  moduleId: string;
  group: 'providers';
  authMode: 'api-key' | 'base-url' | 'oauth-manual';
  displayName: string;
  description: string;
  capabilities: string[];
  requiredFields: string[];
  optionalFields: string[];
  status: string;
  saveAllowsDegradedHealth: boolean;
};

export type ProviderVariantCatalogResponse = {
  group: 'providers';
  variants: ProviderVariantCatalogItem[];
};

export class ProviderVariantCatalogService {
  private readonly variantsDirectory = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../../../modules/providers/variants'
  );

  async listSupportedVariants(): Promise<ProviderVariantCatalogResponse> {
    const entries = await readdir(this.variantsDirectory, { withFileTypes: true });

    const manifests = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => parseModuleManifestFile(resolve(this.variantsDirectory, entry.name, 'module.manifest.yaml')))
    );

    const variants = manifests
      .filter((manifest) => manifest.group === 'providers')
      .filter((manifest): manifest is typeof manifest & { variant: PublicProviderVariant } => isConsoleVariant(manifest.variant))
      .map((manifest) => {
        const definition = getConsoleVariantDefinition(manifest.variant);

        return {
          variant: manifest.variant,
          moduleId: manifest.id,
          group: 'providers' as const,
          authMode: definition.authMode,
          displayName: definition.displayName,
          description: definition.description,
          capabilities: [...(manifest.capabilities ?? [])],
          requiredFields: [...definition.requiredFields],
          optionalFields: [...definition.optionalFields],
          status: manifest.status,
          saveAllowsDegradedHealth: definition.saveAllowsDegradedHealth
        } satisfies ProviderVariantCatalogItem;
      })
      .sort((a, b) => a.variant.localeCompare(b.variant));

    return {
      group: 'providers',
      variants
    };
  }
}
