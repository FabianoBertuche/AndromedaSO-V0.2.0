import { describe, expect, it } from 'vitest';
import { ProviderVariantCatalogService } from '../providerVariantCatalog.service.js';

describe('ProviderVariantCatalogService', () => {
  it('reads variants from manifests and filters the console v1 set', async () => {
    const service = new ProviderVariantCatalogService();
    const result = await service.listSupportedVariants();

    expect(result.group).toBe('providers');
    expect(result.variants.map((item) => item.variant)).toEqual(['ollama', 'openai-api', 'openai-oauth']);
    expect(result.variants.every((item) => item.group === 'providers')).toBe(true);
  });

  it('preserves manifest variant names without leaking legacy runtime names', async () => {
    const service = new ProviderVariantCatalogService();
    const result = await service.listSupportedVariants();

    expect(result.variants.map((item) => item.variant)).toEqual(['ollama', 'openai-api', 'openai-oauth']);
    expect(result.variants.map((item) => item.displayName)).toEqual(['Ollama', 'OpenAI API', 'OpenAI OAuth']);
    expect(result.variants.map((item) => item.variant)).not.toContain('openai' as never);
    expect(result.variants.map((item) => item.variant)).not.toContain('openai-codex' as never);
  });
});
