/**
 * @adapter AWS Bedrock Adapter
 *
 * Usa AWS SDK v3 para chamadas reais ao Bedrock quando credenciais são fornecidas.
 * Degrada graciosamente para dados de seed quando a SDK não está disponível ou falha.
 *
 * Referência: https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/runtime-section-examples-bedrock.html
 */
import pino from 'pino';
import { createRequire } from 'module';
import { withUnsupportedChat, type AdapterFactory } from './adapter.interface';
import { pingWithTimeout } from './http.utils';
import { listSeedModels } from './providerCatalog';

const log = pino({ name: 'adapter:aws-bedrock' });
const require = createRequire(import.meta.url);

// AWS Bedrock region and endpoint
const BEDROCK_REGION = process.env.AWS_BEDROCK_REGION ?? 'us-east-1';
const BEDROCK_ENDPOINT = process.env.AWS_BEDROCK_ENDPOINT ?? `https://bedrock-runtime.${BEDROCK_REGION}.amazonaws.com`;

// Known Bedrock model IDs for ping/test
const KNOWN_BEDROCK_MODELS = [
  'anthropic.claude-3-sonnet-20240229-v1:0',
  'anthropic.claude-3-5-sonnet-20240620-v1:0',
  'meta.llama3-1-70b-instruct-v1:0',
  'mistral.mistral-large-2407-v1:0',
  'amazon.titan-text-express-v1'
];

interface BedrockModel {
  modelId: string;
  displayName: string;
  contextWindow: string;
  capabilities: Array<'coding' | 'chat' | 'analysis' | 'reasoning'>;
  priceLabel: string;
  score: number;
  latencyMs: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AwsSdkNamespace = any;

/**
 * Dynamically require AWS SDK at runtime using createRequire.
 * Returns null if SDK is not installed.
 */
function loadAwsSdk(): AwsSdkNamespace | null {
  try {
    // Try to resolve the module path first
    require.resolve('@aws-sdk/client-bedrock-runtime');
    // If resolved, require it
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@aws-sdk/client-bedrock-runtime');
  } catch {
    log.debug('AWS SDK for Bedrock not installed');
    return null;
  }
}

export const awsBedrockAdapterFactory: AdapterFactory = (apiKey, _baseUrl) => {
  // AWS credentials are stored as accessKeyId:secretAccessKey in apiKeyEnc
  const [accessKeyId, secretAccessKey] = (apiKey ?? '').split(':');

  return withUnsupportedChat({
    async listModels() {
      // If no access key, return seed data
      if (!accessKeyId) {
        log.info('AWS credentials not configured, using seed data');
        return listSeedModels('aws-bedrock');
      }

      const sdk = loadAwsSdk();
      if (!sdk) {
        log.warn('AWS SDK not available, using seed data');
        return listSeedModels('aws-bedrock');
      }

      try {
        const BedrockRuntimeClient = sdk.BedrockRuntimeClient;
        const InvokeModelCommand = sdk.InvokeModelCommand;

        if (!BedrockRuntimeClient || !InvokeModelCommand) {
          log.warn('AWS SDK missing required exports, using seed data');
          return listSeedModels('aws-bedrock');
        }

        const availableModels: BedrockModel[] = [];

        for (const modelId of KNOWN_BEDROCK_MODELS) {
          try {
            // Build client config with credentials if available
            const clientConfig: Record<string, unknown> = { region: BEDROCK_REGION };
            if (accessKeyId && secretAccessKey) {
              clientConfig.credentials = {
                accessKeyId,
                secretAccessKey
              };
            }

            const client = new BedrockRuntimeClient(clientConfig);
            const provider = modelId.split('.')[0];

            // Simple invocation to check availability
            const command = new InvokeModelCommand({
              modelId,
              contentType: 'application/json',
              accept: 'application/json',
              body: JSON.stringify({
                anthropic_version: 'bedrock-2023-05-31',
                max_tokens: 10,
                messages: [{ role: 'user', content: 'ping' }]
              })
            });

            const start = Date.now();
            await client.send(command);
            const latencyMs = Date.now() - start;

            // Map provider to display name and capabilities
            const displayNames: Record<string, string> = {
              'anthropic': `Claude (${modelId})`,
              'meta': `Llama (${modelId})`,
              'mistral': `Mistral (${modelId})`,
              'amazon': `Titan (${modelId})`
            };

            const capabilityMap: Record<string, Array<'coding' | 'chat' | 'analysis' | 'reasoning'>> = {
              'anthropic': ['coding', 'chat', 'analysis', 'reasoning'],
              'meta': ['coding', 'chat'],
              'mistral': ['coding', 'chat', 'analysis'],
              'amazon': ['chat', 'analysis']
            };

            availableModels.push({
              modelId,
              displayName: displayNames[provider] ?? modelId,
              contextWindow: provider === 'anthropic' ? '200k' : '128k',
              capabilities: capabilityMap[provider] ?? ['chat'],
              priceLabel: 'AWS Pricing',
              score: 8.5,
              latencyMs
            });
          } catch (modelErr) {
            // Model not available in this region or account
            log.debug({ modelId, err: modelErr }, 'Model not available');
          }
        }

        if (availableModels.length === 0) {
          log.warn('No Bedrock models available, using seed data');
          return listSeedModels('aws-bedrock');
        }

        return availableModels;
      } catch (err) {
        log.warn({ err }, 'AWS Bedrock listModels failed, using seed data');
        return listSeedModels('aws-bedrock');
      }
    },

    async ping() {
      // If no access key, return simulated ping
      if (!accessKeyId) {
        return { ok: true, latencyMs: 150 };
      }

      const sdk = loadAwsSdk();
      if (!sdk) {
        // Fallback to HTTP ping if SDK not available
        try {
          return await pingWithTimeout(BEDROCK_ENDPOINT, {}, 5000);
        } catch {
          return { ok: false, latencyMs: 0 };
        }
      }

      try {
        const BedrockRuntimeClient = sdk.BedrockRuntimeClient;
        const InvokeModelCommand = sdk.InvokeModelCommand;

        if (!BedrockRuntimeClient || !InvokeModelCommand) {
          return { ok: false, latencyMs: 0 };
        }

        // Build client config with credentials if available
        const clientConfig: Record<string, unknown> = { region: BEDROCK_REGION };
        if (accessKeyId && secretAccessKey) {
          clientConfig.credentials = {
            accessKeyId,
            secretAccessKey
          };
        }

        const client = new BedrockRuntimeClient(clientConfig);
        const testModel = 'anthropic.claude-3-sonnet-20240229-v1:0';

        const command = new InvokeModelCommand({
          modelId: testModel,
          contentType: 'application/json',
          accept: 'application/json',
          body: JSON.stringify({
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'ping' }]
          })
        });

        const start = Date.now();
        await client.send(command);
        const latencyMs = Date.now() - start;

        return { ok: true, latencyMs };
      } catch (err) {
        log.warn({ err }, 'AWS Bedrock ping failed');
        return { ok: false, latencyMs: 0 };
      }
    }
  }, 'aws-bedrock');
};

// Backward-compatible export
export const awsBedrockAdapter = awsBedrockAdapterFactory();
