import { LifecycleStateMachine } from './stateMachine';
import { ModuleRegistryRecord } from '../registry/inMemoryRegistry';
import { persistLifecycleEvent } from '../store/postgresRegistry';
import pino from 'pino';
import { SAFETY } from '../config/safety';

const logger = pino({ name: 'lifecycleOrchestrator' });

export class LifecycleOrchestratorError extends Error {
  constructor(public moduleId: string, message: string) {
    super(message);
    this.name = 'LifecycleOrchestratorError';
  }
}

export class LifecycleOrchestrator {
  constructor(private stateMachine: LifecycleStateMachine) {}

  async start(module: ModuleRegistryRecord): Promise<{ state: string }> {
    const startTime = Date.now();
    const fromState = this.stateMachine.current();
    logger.info({ moduleId: module.id, fromState }, 'Starting module lifecycle');
    try {
      // Initialize: allocate resources
      this.stateMachine.transition('initialized');
      logger.debug({ moduleId: module.id, state: 'initialized' }, 'Module initialized');
      try {
        await persistLifecycleEvent({
          moduleId: module.id,
          stateFrom: fromState,
          stateTo: 'initialized',
          reason: 'Starting module lifecycle'
        });
      } catch (persistErr) {
        if (SAFETY.PG_REQUIRED) {
          throw new Error('PG required');
        }
        logger.warn({ moduleId: module.id, error: (persistErr as any).message }, 'Failed to persist lifecycle event');
      }
      // Start: run
      this.stateMachine.transition('running');
      logger.info({ moduleId: module.id, state: 'running' }, 'Module started');
      try {
        await persistLifecycleEvent({
          moduleId: module.id,
          stateFrom: 'initialized',
          stateTo: 'running',
          reason: 'Module started'
        });
      } catch (persistErr) {
        if (SAFETY.PG_REQUIRED) {
          throw new Error('PG required');
        }
        logger.warn({ moduleId: module.id, error: (persistErr as any).message }, 'Failed to persist lifecycle event');
      }
      const duration = Date.now() - startTime;
      if (duration > SAFETY.STARTUP) {
        logger.warn({ moduleId: module.id, duration }, 'Slow module startup detected');
      }
      return { state: this.stateMachine.current() };
    } catch (err) {
      logger.error({ moduleId: module.id, error: (err as any).message }, 'Failed to start module');
      throw new LifecycleOrchestratorError(module.id, (err as any).message);
    }
  }

  async stop(module: ModuleRegistryRecord): Promise<{ state: string }> {
    const fromState = this.stateMachine.current();
    logger.info({ moduleId: module.id, fromState }, 'Stopping module');
    try {
      // Stop and release resources
      this.stateMachine.transition('stopped');
      logger.info({ moduleId: module.id, state: 'stopped' }, 'Module stopped');
      try {
        await persistLifecycleEvent({
          moduleId: module.id,
          stateFrom: fromState,
          stateTo: 'stopped',
          reason: 'Module stopped'
        });
      } catch (persistErr) {
        if (SAFETY.PG_REQUIRED) {
          throw new Error('PG required');
        }
        logger.warn({ moduleId: module.id, error: (persistErr as any).message }, 'Failed to persist lifecycle event');
      }
      return { state: this.stateMachine.current() };
    } catch (err) {
      logger.error({ moduleId: module.id, error: (err as any).message }, 'Failed to stop module');
      throw new LifecycleOrchestratorError(module.id, (err as any).message);
    }
  }

  getStatus(): { state: string } {
    const state = this.stateMachine.current();
    logger.debug({ state }, 'Retrieved status');
    return { state };
  }
}