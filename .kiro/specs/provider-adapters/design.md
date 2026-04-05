# Provider Adapters Completos — Design

## Overview

Implementar adapters HTTP seguindo o padrão existente em `core/kernel/src/modules/providers/infrastructure/adapters/`.

## Adapter Pattern

Cada adapter implementa a interface `ProviderAdapter`:

```typescript
interface ProviderAdapter {
  listModels(): Promise<ModelCatalogItem[]>;
  ping(): Promise<{ ok: boolean; latencyMs: number }>;
}
```

### Base Structure

```typescript
// google.adapter.ts
import { fetchWithTimeout, pingWithTimeout } from '../../utils/http.utils.js';

export const googleAdapterFactory: AdapterFactory = (apiKey?: string) => ({
  async listModels() {
    if (!apiKey) return getSeedModels('google');
    try {
      const res = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      const data = await res.json() as { models?: Array<{ name: string; displayName?: string }> };
      return (data.models ?? []).map(m => ({
        modelId: m.name,
        displayName: m.displayName ?? m.name,
        contextWindow: 0,
        capabilities: ['chat'] as const,
        priceLabel: 'unknown'
      }));
    } catch {
      return getSeedModels('google');
    }
  },

  async ping() {
    if (!apiKey) return { ok: false, latencyMs: 0 };
    return pingWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  }
});
```

## File Structure

```
core/kernel/src/modules/providers/infrastructure/adapters/
├── google.adapter.ts      # Task 1.1
├── xai.adapter.ts         # Task 1.2
├── mistral.adapter.ts     # Task 1.3
├── together.adapter.ts    # Task 1.4
├── fireworks.adapter.ts   # Task 1.5
├── deepinfra.adapter.ts   # Task 1.6
├── novita.adapter.ts      # Task 1.7
├── lmstudio.adapter.ts    # Task 2.1
├── vllm.adapter.ts        # Task 2.2
├── openrouter.adapter.ts  # Task 3.1
├── hyperbolic.adapter.ts  # Task 3.2
├── replicate.adapter.ts   # Task 3.3
├── cohere.adapter.ts      # Task 3.4
├── aws-bedrock.adapter.ts # Task 4.1
├── azure-openai.adapter.ts # Task 4.2
└── google-vertex.adapter.ts # Task 4.3
```

## Update resolveAdapter

Em `providerOrchestratorService.ts`, adicionar todos os factories:

```typescript
const adapterFactories: Partial<Record<ProviderType, AdapterFactory>> = {
  openai: openAiAdapterFactory,
  anthropic: anthropicAdapterFactory,
  groq: groqAdapterFactory,
  ollama: ollamaAdapterFactory,
  // NEW:
  google: googleAdapterFactory,
  xai: xaiAdapterFactory,
  mistral: mistralAdapterFactory,
  together: togetherAdapterFactory,
  fireworks: fireworksAdapterFactory,
  deepinfra: deepinfraAdapterFactory,
  novita: novitaAdapterFactory,
  lmstudio: lmstudioAdapterFactory,
  vllm: vllmAdapterFactory,
  openrouter: openrouterAdapterFactory,
  hyperbolic: hyperbolicAdapterFactory,
  replicate: replicateAdapterFactory,
  cohere: cohereAdapterFactory,
  azureOpenai: azureOpenAiAdapterFactory,
  googleVertex: googleVertexAdapterFactory,
  awsBedrock: awsBedrockAdapterFactory,
};
```

## Seed Fallback

Todos os adapters devem retornar seed data quando:
- API key não fornecida
- Chamada HTTP falha (timeout, network error, non-OK response)

```typescript
try {
  // real API call
} catch {
  return getSeedModels(providerType); // fallback
}
```

## Verification

```bash
cd core/kernel && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```
