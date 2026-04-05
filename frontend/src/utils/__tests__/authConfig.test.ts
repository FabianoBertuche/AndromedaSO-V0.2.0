import * as fc from 'fast-check';
import { getAuthConfig } from '../authConfig.js';
import type { AuthMode, ProviderType } from '../../types/model.js';

// All provider types
const ALL_PROVIDERS: ProviderType[] = [
  'openai',
  'openai-codex',
  'anthropic',
  'google',
  'xai',
  'mistral',
  'groq',
  'together',
  'fireworks',
  'deepinfra',
  'novita',
  'ollama',
  'lmstudio',
  'vllm',
  'openrouter',
  'hyperbolic',
  'replicate',
  'aws-bedrock',
  'azure-openai',
  'google-vertex',
  'cohere'
];

// Providers by expected AuthMode group
const PROVIDERS_BY_MODE: Record<AuthMode, ProviderType[]> = {
  none: ['openai-codex', 'ollama', 'lmstudio', 'vllm'],
  'api-key': ['openai', 'anthropic', 'groq', 'mistral', 'together', 'fireworks', 'deepinfra', 'novita', 'openrouter', 'hyperbolic', 'replicate', 'cohere', 'xai'],
  'api-key-baseurl': ['azure-openai', 'google-vertex'],
  'oauth-apikey': ['google'],
  'aws-credentials': ['aws-bedrock']
};

// Providers that have specific placeholders (not generic "API Key")
const SPECIFIC_PLACEHOLDERS: Array<{ provider: ProviderType; expectedPlaceholder: string }> = [
  { provider: 'anthropic', expectedPlaceholder: 'sk-ant-...' },
  { provider: 'groq', expectedPlaceholder: 'gsk_...' },
  { provider: 'openai', expectedPlaceholder: 'sk-...' },
  { provider: 'openrouter', expectedPlaceholder: 'sk-or-...' },
  { provider: 'replicate', expectedPlaceholder: 'r8_...' },
  { provider: 'xai', expectedPlaceholder: 'xai-...' }
];

// Providers that require authentication (mode !== 'none')
const PROVIDERS_WITH_AUTH: ProviderType[] = ALL_PROVIDERS.filter(
  (p) => !(['openai-codex', 'ollama', 'lmstudio', 'vllm'] as ProviderType[]).includes(p)
);

describe('getAuthConfig', () => {
  // Property 1: each provider returns the correct AuthMode
  describe('Property 1: AuthMode mapping is correct for all providers', () => {
    it.each(PROVIDERS_BY_MODE.none)('provider %s has mode none', (provider) => {
      expect(getAuthConfig(provider).mode).toBe('none');
    });

    it.each(PROVIDERS_BY_MODE['api-key'])('provider %s has mode api-key', (provider) => {
      expect(getAuthConfig(provider).mode).toBe('api-key');
    });

    it.each(PROVIDERS_BY_MODE['api-key-baseurl'])('provider %s has mode api-key-baseurl', (provider) => {
      expect(getAuthConfig(provider).mode).toBe('api-key-baseurl');
    });

    it.each(PROVIDERS_BY_MODE['oauth-apikey'])('provider %s has mode oauth-apikey', (provider) => {
      expect(getAuthConfig(provider).mode).toBe('oauth-apikey');
    });

    it.each(PROVIDERS_BY_MODE['aws-credentials'])('provider %s has mode aws-credentials', (provider) => {
      expect(getAuthConfig(provider).mode).toBe('aws-credentials');
    });
  });

  // Property 2: fallback for unknown type using fast-check
  describe('Property 2: Fallback for unknown provider type (fast-check)', () => {
    it('property: any unknown string returns mode api-key as fallback (100 iterations)', () => {
      // Filter out all known providers to generate truly unknown strings
      const unknownStringArb = fc.string().filter(
        (s) => !ALL_PROVIDERS.includes(s as ProviderType)
      );

      fc.assert(
        fc.property(unknownStringArb, (unknownType) => {
          const config = getAuthConfig(unknownType);
          // Fallback must return api-key mode
          expect(config.mode).toBe('api-key');
          // Fallback must not have OAuth
          expect(config.hasOAuth).toBe(false);
          // Fallback must not require baseUrl
          expect(config.baseUrlRequired).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property 3: specific placeholders for certain providers
  describe('Property 3: Specific placeholders for anthropic, groq, openai, openrouter, replicate, xai', () => {
    it.each(SPECIFIC_PLACEHOLDERS)(
      'provider $provider has placeholder "$expectedPlaceholder"',
      ({ provider, expectedPlaceholder }) => {
        const config = getAuthConfig(provider);
        expect(config.apiKeyPlaceholder).toBe(expectedPlaceholder);
      }
    );
  });

  // Property 4: all providers with auth have credentialUrl defined
  describe('Property 4: All providers with auth have credentialUrl defined', () => {
    it('property: every provider with mode !== none has credentialUrl as a valid URL string (100 iterations)', () => {
      const providerArb = fc.constantFrom(...PROVIDERS_WITH_AUTH);

      fc.assert(
        fc.property(providerArb, (provider) => {
          const config = getAuthConfig(provider);
          // Must have credentialUrl defined
          expect(config.credentialUrl).toBeDefined();
          // Must be a non-empty string
          expect(typeof config.credentialUrl).toBe('string');
          expect(config.credentialUrl!.length).toBeGreaterThan(0);
          // Must be a valid URL format (starts with http)
          expect(config.credentialUrl).toMatch(/^https?:\/\//);
        }),
        { numRuns: 100 }
      );
    });
  });
});
