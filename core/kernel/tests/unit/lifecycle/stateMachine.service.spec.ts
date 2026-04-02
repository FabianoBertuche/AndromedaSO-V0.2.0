import { describe, it, expect } from 'vitest';
import { LifecycleStateMachine } from '../../../src/lifecycle/stateMachine';

describe('lifecycle state machine', () => {
  it('starts in discovered and transitions correctly', () => {
    const machine = new LifecycleStateMachine();
    expect(machine.current()).toBe('discovered');

    expect(machine.transition('registered')).toBe('registered');
    expect(machine.transition('validated')).toBe('validated');
    expect(machine.transition('loaded')).toBe('loaded');
  });

  it('throws on invalid transition', () => {
    const machine = new LifecycleStateMachine();
    expect(() => machine.transition('running')).toThrow();
  });
});
