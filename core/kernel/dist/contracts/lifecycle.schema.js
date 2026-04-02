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
export const lifecycleTransitionSchema = z.object({
    from: lifecycleStateSchema,
    to: lifecycleStateSchema
});
const validTransitions = {
    discovered: ['registered', 'stopped', 'failed'],
    registered: ['validated', 'failed'],
    validated: ['loaded', 'failed'],
    loaded: ['initialized', 'failed'],
    initialized: ['running', 'failed'],
    running: ['stopped', 'failed'],
    stopped: ['loaded', 'failed'],
    failed: []
};
export function canTransition(from, to) {
    return validTransitions[from].includes(to);
}
export function assertTransition(from, to) {
    if (!canTransition(from, to)) {
        throw new Error(`Invalid lifecycle transition from ${from} to ${to}`);
    }
    return true;
}
//# sourceMappingURL=lifecycle.schema.js.map