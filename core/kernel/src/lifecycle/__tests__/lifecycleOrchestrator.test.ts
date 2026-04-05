import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import type { ModuleRegistryRecord } from '../../registry/inMemoryRegistry.js';

// ─── Use vi.hoisted to properly handle hoisting of mock variables ─────────────────────────
const { mockValidateAndLoadModule, mockPersistLifecycleEvent } = vi.hoisted(() => ({
  mockValidateAndLoadModule: vi.fn(),
  mockPersistLifecycleEvent: vi.fn(),
}));

// Mock the modules
vi.mock('../loadModule.js', () => ({
  validateAndLoadModule: mockValidateAndLoadModule,
}));

vi.mock('../../store/postgresRegistry.js', () => ({
  persistLifecycleEvent: mockPersistLifecycleEvent,
}));

vi.mock('../../config/safety.js', () => ({
  SAFETY: {
    PG_REQUIRED: false,
    STARTUP: 10_000,
    STORM: 5,
  },
}));

// Now import the module under test
import { LifecycleOrchestrator, LifecycleOrchestratorError } from '../lifecycleOrchestrator.js';
import { LifecycleStateMachine } from '../stateMachine.js';

const moduleStatusArbitrary = fc.constantFrom('active', 'disabled', 'deprecated');
const lifecycleStateArbitrary = fc.constantFrom('discovered', 'registered', 'validated', 'loaded', 'initialized', 'running', 'stopped', 'failed');
const semverArbitrary = fc
  .tuple(fc.nat(), fc.nat(), fc.nat())
  .map(([major, minor, patch]) => `${major}.${minor}.${patch}`);

// ─── Helper: create a valid module ───────────────────────────────────────────
function createValidModule(overrides: Partial<ModuleRegistryRecord> = {}): ModuleRegistryRecord {
  return {
    id: 'test-module',
    name: 'Test Module',
    group: 'test-group',
    variant: 'standard',
    version: '1.0.0',
    entrypoint: './dist/index.js',
    contracts: { input: 'input.json', output: 'output.json' },
    capabilities: ['test'],
    status: 'active',
    critical: false,
    dependencies: [],
    state: 'discovered',
    ...overrides,
  };
}

// ─── Create orchestrator with state machine at 'loaded' state (ready to start) ───
function createOrchestratorReadyToStart(): { orchestrator: LifecycleOrchestrator; stateMachine: LifecycleStateMachine } {
  const stateMachine = new LifecycleStateMachine('loaded');
  return { orchestrator: new LifecycleOrchestrator(stateMachine), stateMachine };
}

// ─── Arbitraries for property-based testing ──────────────────────────────────

// Valid module arbitrary — ensures all required fields are valid per schema
const validModuleArbitrary: fc.Arbitrary<ModuleRegistryRecord> = fc.record({
  id: fc.string({ minLength: 1 }),
  name: fc.string({ minLength: 1 }),
  group: fc.string({ minLength: 1 }),
  variant: fc.string({ minLength: 1 }),
  version: semverArbitrary,
  entrypoint: fc.string({ minLength: 1 }),
  contracts: fc.record({ input: fc.string({ minLength: 1 }), output: fc.string({ minLength: 1 }) }),
  capabilities: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 5 }),
  status: moduleStatusArbitrary,
  critical: fc.boolean(),
  dependencies: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 3 }),
  state: lifecycleStateArbitrary,
});

// Invalid module arbitrary — various ways to be invalid per moduleManifest schema
// Each case includes contracts to ensure the mock is properly invoked
const invalidModuleArbitrary: fc.Arbitrary<ModuleRegistryRecord> = fc.oneof(
  // Empty contract input
  fc.record({
    id: fc.string({ minLength: 1 }),
    name: fc.string({ minLength: 1 }),
    group: fc.string({ minLength: 1 }),
    variant: fc.string({ minLength: 1 }),
    version: semverArbitrary,
    entrypoint: fc.string({ minLength: 1 }),
    contracts: fc.record({ input: fc.constant(''), output: fc.string({ minLength: 1 }) }),
    capabilities: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 5 }),
    status: moduleStatusArbitrary,
    critical: fc.boolean(),
    dependencies: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 3 }),
    state: lifecycleStateArbitrary,
  }),
  // Empty contract output
  fc.record({
    id: fc.string({ minLength: 1 }),
    name: fc.string({ minLength: 1 }),
    group: fc.string({ minLength: 1 }),
    variant: fc.string({ minLength: 1 }),
    version: semverArbitrary,
    entrypoint: fc.string({ minLength: 1 }),
    contracts: fc.record({ input: fc.string({ minLength: 1 }), output: fc.constant('') }),
    capabilities: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 5 }),
    status: moduleStatusArbitrary,
    critical: fc.boolean(),
    dependencies: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 3 }),
    state: lifecycleStateArbitrary,
  }),
  // Empty id
  fc.record({
    id: fc.constant(''),
    name: fc.string({ minLength: 1 }),
    group: fc.string({ minLength: 1 }),
    variant: fc.string({ minLength: 1 }),
    version: semverArbitrary,
    entrypoint: fc.string({ minLength: 1 }),
    contracts: fc.record({ input: fc.string({ minLength: 1 }), output: fc.string({ minLength: 1 }) }),
    capabilities: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 5 }),
    status: moduleStatusArbitrary,
    critical: fc.boolean(),
    dependencies: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 3 }),
    state: lifecycleStateArbitrary,
  }),
  // Empty name
  fc.record({
    id: fc.string({ minLength: 1 }),
    name: fc.constant(''),
    group: fc.string({ minLength: 1 }),
    variant: fc.string({ minLength: 1 }),
    version: semverArbitrary,
    entrypoint: fc.string({ minLength: 1 }),
    contracts: fc.record({ input: fc.string({ minLength: 1 }), output: fc.string({ minLength: 1 }) }),
    capabilities: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 5 }),
    status: moduleStatusArbitrary,
    critical: fc.boolean(),
    dependencies: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 3 }),
    state: lifecycleStateArbitrary,
  }),
  // Invalid version format (not semver)
  fc.record({
    id: fc.string({ minLength: 1 }),
    name: fc.string({ minLength: 1 }),
    group: fc.string({ minLength: 1 }),
    variant: fc.string({ minLength: 1 }),
    version: fc.string({ minLength: 1 }).filter((value) => !/^\d+\.\d+\.\d+$/.test(value)),
    entrypoint: fc.string({ minLength: 1 }),
    contracts: fc.record({ input: fc.string({ minLength: 1 }), output: fc.string({ minLength: 1 }) }),
    capabilities: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 5 }),
    status: moduleStatusArbitrary,
    critical: fc.boolean(),
    dependencies: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 3 }),
    state: lifecycleStateArbitrary,
  }),
);

// ─── Task 8.1: Property test — invalid module validation ─────────────────────
describe('LifecycleOrchestrator invalid module validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPersistLifecycleEvent.mockResolvedValue([]);
  });

  it('property: rejects invalid modules generated by fast-check', async () => {
    // Generate samples using fast-check and test each
    const invalidSamples = fc.sample(invalidModuleArbitrary, 100);
    let rejectionCount = 0;

    for (const module of invalidSamples) {
      const { orchestrator } = createOrchestratorReadyToStart();

      // Configure mock to reject the invalid module
      mockValidateAndLoadModule.mockResolvedValue({
        valid: false,
        error: 'Invalid module: missing required fields',
      });

      try {
        await orchestrator.start(module);
        // If no error thrown, the test should fail
      } catch (err) {
        if (err instanceof LifecycleOrchestratorError) {
          rejectionCount++;
        }
      }
    }

    // All invalid modules should be rejected
    expect(rejectionCount).toBe(invalidSamples.length);
  });

  it('property: accepts valid modules (sanity check)', async () => {
    // Generate samples using fast-check and test each
    const validSamples = fc.sample(validModuleArbitrary, 50);
    let successCount = 0;

    for (const module of validSamples) {
      const { orchestrator } = createOrchestratorReadyToStart();

      mockValidateAndLoadModule.mockResolvedValue({ valid: true });

      try {
        const result = await orchestrator.start(module);
        if (result.state === 'running') {
          successCount++;
        }
      } catch (err) {
        // Should not throw for valid modules
      }
    }

    // All valid modules should succeed
    expect(successCount).toBe(validSamples.length);
  });
});

// ─── Task 8.2: Unit tests for LifecycleOrchestrator methods ──────────────────
describe('LifecycleOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPersistLifecycleEvent.mockResolvedValue([]);
  });

  describe('start', () => {
    it('should transition module from loaded to running on successful start', async () => {
      const { orchestrator, stateMachine } = createOrchestratorReadyToStart();
      const module = createValidModule({ id: 'module-start-1' });

      mockValidateAndLoadModule.mockResolvedValue({ valid: true });

      const result = await orchestrator.start(module);

      expect(result.state).toBe('running');
      expect(stateMachine.current()).toBe('running');
    });

    it('should throw LifecycleOrchestratorError when validation fails', async () => {
      const { orchestrator } = createOrchestratorReadyToStart();
      const module = createValidModule({ id: 'module-invalid', contracts: { input: '', output: '' } });

      mockValidateAndLoadModule.mockResolvedValue({
        valid: false,
        error: 'Module missing contracts definition',
      });

      await expect(orchestrator.start(module)).rejects.toThrow(LifecycleOrchestratorError);
      await expect(orchestrator.start(module)).rejects.toThrow('Module missing contracts definition');
    });

    it('should throw LifecycleOrchestratorError on circular dependency', async () => {
      const { orchestrator } = createOrchestratorReadyToStart();
      const module = createValidModule({ id: 'module-circular', dependencies: ['dep-a'] });
      const allModules = [
        module,
        createValidModule({ id: 'dep-a', dependencies: ['module'] }), // circular
      ];

      mockValidateAndLoadModule.mockResolvedValue({
        valid: false,
        error: 'Circular dependencies detected',
      });

      await expect(orchestrator.start(module, allModules)).rejects.toThrow(LifecycleOrchestratorError);
      await expect(orchestrator.start(module, allModules)).rejects.toThrow('Circular dependencies detected');
    });

    it('should persist lifecycle events on successful start', async () => {
      const { orchestrator } = createOrchestratorReadyToStart();
      const module = createValidModule({ id: 'module-persist' });

      mockValidateAndLoadModule.mockResolvedValue({ valid: true });

      await orchestrator.start(module);

      expect(mockPersistLifecycleEvent).toHaveBeenCalledTimes(2); // initialized and running
    });

    it('should warn but not throw when PG is not required and persist fails', async () => {
      const { orchestrator } = createOrchestratorReadyToStart();
      const module = createValidModule({ id: 'module-pg-optional' });

      mockValidateAndLoadModule.mockResolvedValue({ valid: true });
      mockPersistLifecycleEvent.mockRejectedValue(new Error('DB error'));

      // Should not throw, just warn
      const result = await orchestrator.start(module);
      expect(result.state).toBe('running');
    });
  });

  describe('stop', () => {
    it('should transition module to stopped state', async () => {
      const stateMachine = new LifecycleStateMachine('running');
      const orchestrator = new LifecycleOrchestrator(stateMachine);
      const module = createValidModule({ id: 'module-stop-1', state: 'running' });

      mockPersistLifecycleEvent.mockResolvedValue([]);

      const result = await orchestrator.stop(module);

      expect(result.state).toBe('stopped');
      expect(stateMachine.current()).toBe('stopped');
    });

    it('should persist lifecycle event on stop', async () => {
      const stateMachine = new LifecycleStateMachine('running');
      const orchestrator = new LifecycleOrchestrator(stateMachine);
      const module = createValidModule({ id: 'module-stop-2' });

      mockPersistLifecycleEvent.mockResolvedValue([]);

      await orchestrator.stop(module);

      expect(mockPersistLifecycleEvent).toHaveBeenCalledTimes(1);
      expect(mockPersistLifecycleEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          moduleId: 'module-stop-2',
          stateFrom: 'running',
          stateTo: 'stopped',
          reason: 'Module stopped',
        })
      );
    });

    it('should not throw when PG is not required and persist fails on stop', async () => {
      const stateMachine = new LifecycleStateMachine('running');
      const orchestrator = new LifecycleOrchestrator(stateMachine);
      const module = createValidModule({ id: 'module-stop-warn' });

      mockPersistLifecycleEvent.mockRejectedValue(new Error('DB error'));

      const result = await orchestrator.stop(module);
      expect(result.state).toBe('stopped');
    });
  });

  describe('getStatus', () => {
    it('should return current state from state machine', () => {
      const stateMachine = new LifecycleStateMachine('discovered');
      const orchestrator = new LifecycleOrchestrator(stateMachine);

      const status1 = orchestrator.getStatus();
      expect(status1.state).toBe('discovered');

      stateMachine.transition('registered');
      const status2 = orchestrator.getStatus();
      expect(status2.state).toBe('registered');

      stateMachine.transition('validated');
      const status3 = orchestrator.getStatus();
      expect(status3.state).toBe('validated');
    });

    it('should return object with state property', () => {
      const stateMachine = new LifecycleStateMachine('running');
      const orchestrator = new LifecycleOrchestrator(stateMachine);

      const status = orchestrator.getStatus();

      expect(status).toHaveProperty('state');
      expect(typeof status.state).toBe('string');
      expect(status.state).toBe('running');
    });

    it('should reflect state changes from start/stop', async () => {
      const { orchestrator } = createOrchestratorReadyToStart();
      const module = createValidModule({ id: 'module-status' });

      mockValidateAndLoadModule.mockResolvedValue({ valid: true });

      expect(orchestrator.getStatus().state).toBe('loaded');

      await orchestrator.start(module);
      expect(orchestrator.getStatus().state).toBe('running');

      await orchestrator.stop(module);
      expect(orchestrator.getStatus().state).toBe('stopped');
    });
  });
});
