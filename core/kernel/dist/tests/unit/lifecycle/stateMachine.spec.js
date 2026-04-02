import { describe, it, expect } from 'vitest';
import { canTransition, assertTransition } from '../../../src/contracts/lifecycle.schema';
describe('lifecycle state transitions', () => {
    it('allows discovered -> registered', () => {
        expect(canTransition('discovered', 'registered')).toBe(true);
    });
    it('rejects discovered -> running', () => {
        expect(canTransition('discovered', 'running')).toBe(false);
        expect(() => assertTransition('discovered', 'running')).toThrow('Invalid lifecycle transition');
    });
    it('allows running -> stopped', () => {
        expect(canTransition('running', 'stopped')).toBe(true);
    });
    it('rejects stopped -> discovered', () => {
        expect(canTransition('stopped', 'discovered')).toBe(false);
    });
});
//# sourceMappingURL=stateMachine.spec.js.map