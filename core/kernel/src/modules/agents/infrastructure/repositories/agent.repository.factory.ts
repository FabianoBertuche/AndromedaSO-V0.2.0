import pino from 'pino';
import { config } from '../../../../config/index.js';
import type { AgentRepository } from '../../domain/repositories/agent.repository.js';
import { AgentRepositoryMemory, agentRepositoryMemory } from './agent.repository.memory.js';
import { AgentRepositoryPostgres } from './agent.repository.postgres.js';

const log = pino({ name: 'agents:factory' });

const DEFAULT_MODE = 'auto';
let cachedRepository: AgentRepository | null = null;

const resolveMode = (): 'memory' | 'postgres' | 'auto' => {
  const mode = (process.env.AGENT_REPOSITORY_MODE ?? DEFAULT_MODE).toLowerCase();
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

export const getAgentRepository = async (): Promise<AgentRepository> => {
  if (cachedRepository) {
    return cachedRepository;
  }

  const mode = resolveMode();

  if (shouldPreferMemory(mode)) {
    cachedRepository = agentRepositoryMemory;
    log.info({ mode: 'memory' }, 'Agent repository initialized');
    return cachedRepository;
  }

  const postgresRepository = new AgentRepositoryPostgres(config.databaseUrl);

  try {
    await postgresRepository.initialize();
    cachedRepository = postgresRepository;
    log.info({ mode: 'postgres' }, 'Agent repository initialized');
    return cachedRepository;
  } catch (error) {
    if (mode === 'postgres') {
      throw error;
    }
    log.warn('PostgreSQL unavailable, using in-memory repository as fallback');
    cachedRepository = agentRepositoryMemory;
    log.info({ mode: 'memory' }, 'Agent repository initialized');
    return cachedRepository;
  }
};

export const resetAgentRepositoryFactory = (): void => {
  cachedRepository = null;
  // Also reset the singleton memory repository to clear state between tests
  agentRepositoryMemory.reset();
};
