import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ProviderOrchestratorService } from '../services/providerOrchestratorService.js';
import type { ProviderRepository } from '../domain/repositories/provider.repository.js';
import type { ModelBenchmarkResult, ModelCatalogItem, Provider } from '../domain/entities/provider.entity.js';

const unsupportedOauthSessionOperation = async () => {
  throw new Error('OAuth session operations are not supported in this mock repository');
};

function createMockRepo(): ProviderRepository {
  const providers = new Map<string, Provider>();
  const catalogs = new Map<string, ModelCatalogItem[]>();
  const benchmarks: ModelBenchmarkResult[] = [];

  return {
    async create(p) { providers.set(p.id, p); return p; },
    async update(p) { providers.set(p.id, p); return p; },
    async findById(id) { return providers.get(id) ?? null; },
    async findByName(name) { return [...providers.values()].find(p => p.name === name) ?? null; },
    async list() { return [...providers.values()]; },
    async setCatalog(pid, models) { catalogs.set(pid, models); },
    async getCatalog(pid) { return catalogs.get(pid) ?? []; },
    async addBenchmark(r) { benchmarks.push(r); },
    async listBenchmarks() { return [...benchmarks]; },
    async addRoutingDecision(d) { /* noop for mock */ },
    async listRoutingDecisions() { return []; },
    createOAuthSession: unsupportedOauthSessionOperation,
    findOAuthSessionByStateHash: unsupportedOauthSessionOperation,
    claimOAuthSessionByStateHash: unsupportedOauthSessionOperation,
    consumeOAuthSession: unsupportedOauthSessionOperation,
    deleteExpiredOAuthSessions: async () => undefined,
    async delete(id) { providers.delete(id); },
    async reset() { providers.clear(); catalogs.clear(); benchmarks.length = 0; }
  };
}

describe('AWS Credentials Round-Trip', () => {
  let repo: ProviderRepository;
  let service: ProviderOrchestratorService;

  beforeEach(() => {
    repo = createMockRepo();
    service = new ProviderOrchestratorService(repo);
  });

  // Property 6: AWS round-trip encoding - any (accessKeyId, secretAccessKey) pair
  // produces a base64 string that decodes back to the original pair
  describe('Property 6: AWS credentials base64 round-trip', () => {
    it('property: base64 encoding of accessKeyId:secretAccessKey is always decodable back to original pair (100 iterations)', () => {
      // Generate arbitrary non-empty strings that don't contain colon (to avoid ambiguity)
      const accessKeyArb = fc.string({ minLength: 1 }).filter((s) => !s.includes(':'));
      const secretKeyArb = fc.string({ minLength: 1 }).filter((s) => !s.includes(':'));

      fc.assert(
        fc.property(accessKeyArb, secretKeyArb, (accessKeyId, secretAccessKey) => {
          const combined = `${accessKeyId}:${secretAccessKey}`;
          const encoded = Buffer.from(combined, 'utf-8').toString('base64');
          const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
          const [decodedKey, decodedSecret] = decoded.split(':');

          // The decoded pair must match the original
          expect(decodedKey).toBe(accessKeyId);
          expect(decodedSecret).toBe(secretAccessKey);
        }),
        { numRuns: 100 }
      );
    });

    it('createProvider with aws-bedrock + AWS credentials generates correct apiKeyEnc', async () => {
      const accessKeyId = 'AKIAIOSFODNN7EXAMPLE';
      const secretAccessKey = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';

      const provider = await service.createProvider({
        type: 'aws-bedrock',
        name: 'aws-test',
        accessKeyId,
        secretAccessKey
      });

      // The apiKeyEnc must be the base64 encoding of "accessKeyId:secretAccessKey"
      const expectedCombined = `${accessKeyId}:${secretAccessKey}`;
      const expectedEnc = Buffer.from(expectedCombined, 'utf-8').toString('base64');

      expect(provider.apiKeyEnc).toBe(expectedEnc);

      // Verify it can be decoded back
      const decoded = Buffer.from(provider.apiKeyEnc!, 'base64').toString('utf-8');
      const [decodedKey, decodedSecret] = decoded.split(':');
      expect(decodedKey).toBe(accessKeyId);
      expect(decodedSecret).toBe(secretAccessKey);
    });

    it('createProvider with aws-bedrock + single-part apiKey does not use AWS format', async () => {
      const apiKey = 'regular-api-key';

      const provider = await service.createProvider({
        type: 'aws-bedrock',
        name: 'aws-simple',
        apiKey
      });

      // When using regular apiKey (not AWS credentials), it should be encoded as-is
      const expectedEnc = Buffer.from(apiKey, 'utf-8').toString('base64');
      expect(provider.apiKeyEnc).toBe(expectedEnc);
    });

    it('createProvider with aws-bedrock prefers accessKeyId+secretAccessKey over apiKey', async () => {
      const accessKeyId = 'AKIA1234567890EXAMPLE';
      const secretAccessKey = 'secretKey1234567890';
      const apiKey = 'ignored-api-key';

      const provider = await service.createProvider({
        type: 'aws-bedrock',
        name: 'aws-override',
        apiKey,
        accessKeyId,
        secretAccessKey
      });

      // The apiKeyEnc must be based on accessKeyId:secretAccessKey, not apiKey
      const expectedCombined = `${accessKeyId}:${secretAccessKey}`;
      const expectedEnc = Buffer.from(expectedCombined, 'utf-8').toString('base64');
      expect(provider.apiKeyEnc).toBe(expectedEnc);

      // Decoding must give us the AWS credentials, not the apiKey
      const decoded = Buffer.from(provider.apiKeyEnc!, 'base64').toString('utf-8');
      expect(decoded).toBe(expectedCombined);
      expect(decoded).not.toBe(apiKey);
    });
  });
});
