/**
 * Property tests for Provider Repository Factory logging.
 *
 * Feature: local-dev-setup, Property 4: Log do modo de repositório selecionado
 *
 * Validates:
 * - Requisito 5.4: Logger Pino nomeado 'providers:factory' emite info com mode
 */
import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import pino from 'pino';

// Mock config module before importing factory
vi.mock('../../../../../config.js', () => ({
  config: {
    databaseUrl: 'postgres://andromeda:andromeda@localhost:5432/andromeda'
  }
}));

describe('Provider Repository Factory Logging', () => {
  let factoryModule: typeof import('../provider.repository.factory.js');
  let loggerSpy: ReturnType<typeof vi.spyOn>;
  let originalInfo: ReturnType<typeof vi.spyOn>;
  let originalWarn: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    // Import factory module after mocking
    factoryModule = await import('../provider.repository.factory.js');
  });

  beforeEach(() => {
    // Reset factory state before each test
    factoryModule.resetProviderRepositoryFactory();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    factoryModule.resetProviderRepositoryFactory();
  });

  // Property 4: Log do modo de repositório selecionado
  describe('Property 4: Log do modo de repositório selecionado', () => {
    it('deve emitir log info com mode correto ao selecionar postgres', async () => {
      // Spy on pino's info method
      const infoCalls: Array<{ mode: string }> = [];
      const warnCalls: string[] = [];

      // Mock ProviderRepositoryPostgres to succeed
      vi.doMock('../provider.repository.postgres.js', () => ({
        ProviderRepositoryPostgres: vi.fn().mockImplementation(() => ({
          initialize: vi.fn().mockResolvedValue(undefined),
        })),
      }));

      // For this test, we need to ensure mode is 'auto' or 'postgres' 
      // and PostgreSQL is available. Since we're using a mock that succeeds,
      // we can test that 'postgres' mode logs correctly.

      // Actually, let's test by forcing the mode and mocking the postgres repo
      // to succeed
      process.env.PROVIDER_REPOSITORY_MODE = 'postgres';

      // Spy on the pino logger by intercepting the log calls
      // We'll use a different approach - check that logs are called with correct structure
      const mockLog = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

      vi.doMock('pino', () => ({
        default: vi.fn(() => mockLog),
      }));

      // Re-import to apply the mock
      vi.resetModules();
      const { getProviderRepository } = await import('../provider.repository.factory.js');

      await getProviderRepository();

      // Verify info was called with mode: 'postgres'
      expect(mockLog.info).toHaveBeenCalled();
      const infoCall = mockLog.info.mock.calls.find(call => 
        call[0] && typeof call[0] === 'object' && 'mode' in call[0]
      );
      expect(infoCall).toBeDefined();
      expect(infoCall![0]).toEqual({ mode: 'postgres' });
    });

    it('deve emitir log info com mode correto ao selecionar memory (node_env=test)', async () => {
      process.env.NODE_ENV = 'test';
      process.env.PROVIDER_REPOSITORY_MODE = 'auto';

      const mockLog = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

      vi.doMock('pino', () => ({
        default: vi.fn(() => mockLog),
      }));

      vi.resetModules();
      const { getProviderRepository } = await import('../provider.repository.factory.js');

      await getProviderRepository();

      expect(mockLog.info).toHaveBeenCalled();
      const infoCall = mockLog.info.mock.calls.find(call =>
        call[0] && typeof call[0] === 'object' && 'mode' in call[0]
      );
      expect(infoCall).toBeDefined();
      expect(infoCall![0]).toEqual({ mode: 'memory' });

      process.env.NODE_ENV = 'development';
    });

    it('deve emitir log info com mode correto ao fazer fallback para memory', async () => {
      // Mock ProviderRepositoryPostgres to fail
      vi.doMock('../provider.repository.postgres.js', () => ({
        ProviderRepositoryPostgres: vi.fn().mockImplementation(() => ({
          initialize: vi.fn().mockRejectedValue(new Error('Connection failed')),
        })),
      }));

      process.env.PROVIDER_REPOSITORY_MODE = 'auto';
      process.env.NODE_ENV = 'development';

      const mockLog = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

      vi.doMock('pino', () => ({
        default: vi.fn(() => mockLog),
      }));

      vi.resetModules();
      const { getProviderRepository } = await import('../provider.repository.factory.js');

      await getProviderRepository();

      // Should have logged warning about PostgreSQL unavailable
      expect(mockLog.warn).toHaveBeenCalledWith('PostgreSQL indisponível, usando repositório in-memory como fallback');

      // And should have logged info with mode: 'memory'
      expect(mockLog.info).toHaveBeenCalled();
      const infoCall = mockLog.info.mock.calls.find(call =>
        call[0] && typeof call[0] === 'object' && 'mode' in call[0]
      );
      expect(infoCall).toBeDefined();
      expect(infoCall![0]).toEqual({ mode: 'memory' });
    });

    it('property: para qualquer modo selecionado, log info contém campo mode correto', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('postgres', 'memory'),
          async (expectedMode) => {
            // Reset modules to get fresh factory
            vi.resetModules();

            const mockLog = {
              info: vi.fn(),
              warn: vi.fn(),
              error: vi.fn(),
            };

            if (expectedMode === 'postgres') {
              vi.doMock('../provider.repository.postgres.js', () => ({
                ProviderRepositoryPostgres: vi.fn().mockImplementation(() => ({
                  initialize: vi.fn().mockResolvedValue(undefined),
                })),
              }));
            } else {
              vi.doMock('../provider.repository.postgres.js', () => ({
                ProviderRepositoryPostgres: vi.fn().mockImplementation(() => ({
                  initialize: vi.fn().mockRejectedValue(new Error('fail')),
                })),
              }));
            }

            vi.doMock('pino', () => ({
              default: vi.fn(() => mockLog),
            }));

            process.env.NODE_ENV = 'development';
            process.env.PROVIDER_REPOSITORY_MODE = 'auto';

            const { getProviderRepository, resetProviderRepositoryFactory } = 
              await import('../provider.repository.factory.js');

            resetProviderRepositoryFactory();
            await getProviderRepository();

            // Find info call with mode
            const infoCall = mockLog.info.mock.calls.find(call =>
              call[0] && typeof call[0] === 'object' && 'mode' in call[0]
            );

            expect(infoCall).toBeDefined();
            expect(infoCall![0]).toEqual({ mode: expectedMode });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});