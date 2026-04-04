import pino from 'pino';
import { config } from '../../../../config';
import type { ProviderRepository } from '../../domain/repositories/provider.repository';
import { providerRepository as memoryRepository } from './provider.repository.memory';
import { ProviderRepositoryPostgres } from './provider.repository.postgres';

const log = pino({ name: 'providers:factory' });

const DEFAULT_MODE = 'auto';
let cachedRepository: ProviderRepository | null = null;

const resolveMode = (): 'memory' | 'postgres' | 'auto' => {
  const mode = (process.env.PROVIDER_REPOSITORY_MODE ?? DEFAULT_MODE).toLowerCase();
  if (mode === 'memory' || mode === 'postgres' || mode === 'auto') {
    return mode;
  }
  return DEFAULT_MODE;
};

const shouldPreferMemory = (mode: 'memory' | 'postgres' | 'auto') => {
  if (mode === 'memory') {
    return true;
  }

  if (mode === 'auto' && process.env.NODE_ENV === 'test') {
    return true;
  }

  return false;
};

export const getProviderRepository = async (): Promise<ProviderRepository> => {
  if (cachedRepository) {
    return cachedRepository;
  }

  const mode = resolveMode();

  if (shouldPreferMemory(mode)) {
    cachedRepository = memoryRepository;
    log.info({ mode: 'memory' }, 'Repositório de providers inicializado');
    return cachedRepository;
  }

  const postgresRepository = new ProviderRepositoryPostgres(config.databaseUrl);

  try {
    await postgresRepository.initialize();
    cachedRepository = postgresRepository;
    log.info({ mode: 'postgres' }, 'Repositório de providers inicializado');
    return cachedRepository;
  } catch (error) {
    if (mode === 'postgres') {
      throw error;
    }

    log.warn('PostgreSQL indisponível, usando repositório in-memory como fallback');
    cachedRepository = memoryRepository;
    log.info({ mode: 'memory' }, 'Repositório de providers inicializado');
    return cachedRepository;
  }
};

export const resetProviderRepositoryFactory = (): void => {
  cachedRepository = null;
};
