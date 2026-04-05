import type { ModelCatalogItem, ProviderType } from '../../domain/entities/provider.entity';

const common = {
  contextWindow: '128k',
  capabilities: ['chat', 'analysis'] as Array<'coding' | 'chat' | 'analysis' | 'reasoning'>,
  priceLabel: '$0.02',
  score: 8.4,
  latencyMs: 150
};

function model(modelId: string, displayName: string, overrides: Partial<ModelCatalogItem>): Omit<ModelCatalogItem, 'id' | 'providerId'> {
  return {
    modelId,
    displayName,
    contextWindow: common.contextWindow,
    capabilities: common.capabilities,
    priceLabel: common.priceLabel,
    score: common.score,
    latencyMs: common.latencyMs,
    ...overrides
  };
}

const openAiModels = [
  model('gpt-4o', 'GPT-4o', { capabilities: ['coding', 'chat', 'analysis', 'reasoning'], score: 9.4, latencyMs: 120, priceLabel: '$0.02', contextWindow: '128k' }),
  model('gpt-4.1', 'GPT-4.1', { capabilities: ['coding', 'chat', 'analysis'], score: 9.1, latencyMs: 130, priceLabel: '$0.03', contextWindow: '128k' }),
  model('gpt-4.1-mini', 'GPT-4.1 mini', { capabilities: ['coding', 'chat'], score: 8.6, latencyMs: 95, priceLabel: '$0.01', contextWindow: '128k' }),
  model('gpt-4o-mini', 'GPT-4o mini', { capabilities: ['chat', 'analysis'], score: 8.3, latencyMs: 80, priceLabel: '$0.005', contextWindow: '128k' }),
  model('o3', 'o3', { capabilities: ['coding', 'reasoning'], score: 9.2, latencyMs: 170, priceLabel: '$0.04', contextWindow: '200k' }),
  model('o3-mini', 'o3-mini', { capabilities: ['coding', 'reasoning'], score: 8.7, latencyMs: 120, priceLabel: '$0.015', contextWindow: '200k' }),
  model('o4-mini', 'o4-mini', { capabilities: ['coding', 'reasoning'], score: 8.9, latencyMs: 110, priceLabel: '$0.02', contextWindow: '200k' }),
  model('gpt-4-turbo', 'GPT-4 Turbo', { capabilities: ['coding', 'chat'], score: 8.8, latencyMs: 145, priceLabel: '$0.03', contextWindow: '128k' }),
  model('gpt-3.5-turbo', 'GPT-3.5 Turbo', { capabilities: ['chat'], score: 7.4, latencyMs: 70, priceLabel: '$0.002', contextWindow: '16k' }),
  model('text-embedding-3-large', 'Embedding 3 Large', { capabilities: ['analysis'], score: 8.1, latencyMs: 90, priceLabel: '$0.01', contextWindow: '8k' }),
  model('text-embedding-3-small', 'Embedding 3 Small', { capabilities: ['analysis'], score: 7.6, latencyMs: 65, priceLabel: '$0.005', contextWindow: '8k' }),
  model('gpt-image-1', 'GPT Image 1', { capabilities: ['analysis'], score: 7.8, latencyMs: 160, priceLabel: '$0.03', contextWindow: '32k' })
];

const ollamaLocalAndCloudModels = [
  model('ollama/llama3.2', 'Llama 3.2 Local', { score: 7.6, capabilities: ['chat', 'coding'], priceLabel: 'FREE', latencyMs: 180, contextWindow: '8k' }),
  model('ollama/qwen2.5:14b', 'Qwen 2.5 14B Local', { score: 7.7, capabilities: ['chat', 'coding', 'analysis'], priceLabel: 'FREE', latencyMs: 195, contextWindow: '32k' }),
  model('ollama/deepseek-r1:8b', 'DeepSeek R1 8B Local', { score: 7.8, capabilities: ['coding', 'reasoning'], priceLabel: 'FREE', latencyMs: 205, contextWindow: '32k' }),
  model('ollama-cloud/gpt-4o-mini', 'GPT-4o Mini (Routed Cloud)', { score: 8.5, capabilities: ['chat', 'analysis'], priceLabel: '$0.005', latencyMs: 120, contextWindow: '128k' }),
  model('ollama-cloud/claude-3.5-sonnet', 'Claude 3.5 Sonnet (Routed Cloud)', { score: 9.0, capabilities: ['coding', 'chat', 'analysis'], priceLabel: '$0.03', latencyMs: 150, contextWindow: '200k' }),
  model('ollama-cloud/gemini-2.0-pro', 'Gemini 2.0 Pro (Routed Cloud)', { score: 8.8, capabilities: ['coding', 'chat', 'analysis'], priceLabel: '$0.02', latencyMs: 140, contextWindow: '1M' }),
  model('ollama-cloud/llama-3.1-405b', 'Llama 3.1 405B (Routed Cloud)', { score: 8.7, capabilities: ['coding', 'chat'], priceLabel: '$0.01', latencyMs: 110, contextWindow: '128k' })
];

const providerSeed: Record<ProviderType, Array<Omit<ModelCatalogItem, 'id' | 'providerId'>>> = {
  openai: openAiModels,
  'openai-codex': openAiModels,
  anthropic: [model('claude-3.5-sonnet', 'Claude 3.5 Sonnet', { score: 9.0, capabilities: ['coding', 'chat', 'analysis'], priceLabel: '$0.03' })],
  google: [model('gemini-2.0-pro', 'Gemini 2.0 Pro', { score: 8.8, capabilities: ['coding', 'chat', 'analysis'], priceLabel: '$0.02', contextWindow: '1M' })],
  xai: [model('grok-2', 'Grok 2', { score: 8.5, capabilities: ['chat', 'analysis'], priceLabel: '$0.02' })],
  mistral: [model('mistral-large-2', 'Mistral Large 2', { score: 8.4, capabilities: ['coding', 'chat'], priceLabel: '$0.02' })],
  groq: [model('llama-3.1-405b', 'Llama 3.1 405B', { score: 8.7, capabilities: ['coding', 'chat'], latencyMs: 55, priceLabel: '$0.01' })],
  together: [model('qwen2.5-72b', 'Qwen 2.5 72B', { score: 8.2, capabilities: ['coding', 'chat'], priceLabel: '$0.01' })],
  fireworks: [model('mixtral-8x22b', 'Mixtral 8x22B', { score: 8.1, capabilities: ['coding', 'analysis'], priceLabel: '$0.012' })],
  deepinfra: [model('deepseek-v3', 'DeepSeek V3', { score: 8.3, capabilities: ['coding', 'analysis'], priceLabel: '$0.008' })],
  novita: [model('novita-oss', 'Novita OSS', { score: 7.8, capabilities: ['chat', 'analysis'], priceLabel: 'FREE' })],
  ollama: ollamaLocalAndCloudModels,
  lmstudio: [model('qwen2.5-local', 'Qwen 2.5 Local', { score: 7.5, capabilities: ['chat', 'coding'], priceLabel: 'FREE', latencyMs: 165 })],
  vllm: [model('vllm-selfhost', 'vLLM Selfhost', { score: 7.9, capabilities: ['coding', 'analysis'], priceLabel: 'SELF', latencyMs: 140 })],
  openrouter: [model('openrouter-auto', 'OpenRouter Auto', { score: 8.6, capabilities: ['coding', 'chat', 'analysis'], priceLabel: '$0.015' })],
  hyperbolic: [model('hyperbolic-discount', 'Hyperbolic Discount', { score: 8.0, capabilities: ['chat', 'analysis'], priceLabel: '$0.006' })],
  replicate: [model('replicate-community', 'Replicate Community', { score: 7.7, capabilities: ['chat'], priceLabel: '$0.01' })],
  'aws-bedrock': [model('bedrock-claude', 'AWS Bedrock Claude', { score: 8.5, capabilities: ['coding', 'chat'], priceLabel: '$0.03' })],
  'azure-openai': [model('azure-gpt-4o', 'Azure GPT-4o', { score: 9.3, capabilities: ['coding', 'chat', 'analysis'], priceLabel: '$0.02' })],
  'google-vertex': [model('vertex-gemini', 'Vertex Gemini', { score: 8.7, capabilities: ['coding', 'analysis'], priceLabel: '$0.02', contextWindow: '1M' })],
  cohere: [model('command-r-plus', 'Command R+', { score: 8.2, capabilities: ['chat', 'analysis'], priceLabel: '$0.015' })]
};

export function listSeedModels(providerType: ProviderType): Array<Omit<ModelCatalogItem, 'id' | 'providerId'>> {
  return providerSeed[providerType] ?? [];
}
