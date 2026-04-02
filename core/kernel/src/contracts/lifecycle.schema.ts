import { z } from 'zod';

export const lifecycleStateSchema = z.enum([
  'discovered',
  'registered',
  'validated',
  'loaded',
  'initialized',
  'running',
  'stopped',
  'failed'
]);

export type LifecycleState = z.infer<typeof lifecycleStateSchema>;

export const lifecycleTransitionSchema = z.object({
  from: lifecycleStateSchema,
  to: lifecycleStateSchema
});

export type LifecycleTransition = z.infer<typeof lifecycleTransitionSchema>;

const validTransitions: Record<LifecycleState, LifecycleState[]> = {
  discovered: ['registered', 'stopped', 'failed'],
  registered: ['validated', 'failed'],
  validated: ['loaded', 'failed'],
  loaded: ['initialized', 'failed'],
  initialized: ['running', 'failed'],
  running: ['stopped', 'failed'],
  stopped: ['loaded', 'failed'],
  failed: []
};

export function canTransition(from: LifecycleState, to: LifecycleState) {
  return validTransitions[from].includes(to);
}

export function assertTransition(from: LifecycleState, to: LifecycleState) {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid lifecycle transition from ${from} to ${to}`);
  }
  return true;
}
