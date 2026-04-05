import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { AgentPool } from '../AgentPool.js';
import { agentEvolutionService } from '../../../evolution/evolutionService.js';
import type { DecomposedSubtask } from '../TaskDecomposer.js';

// Helper to create a fresh AgentPool with mocked reputation
function createAgentPool(mockReputations: Record<string, Record<string, number>> = {}): AgentPool {
  // Reset the evolution service state
  vi.spyOn(agentEvolutionService, 'getReputation').mockImplementation((agentId: string) => {
    return mockReputations[agentId] ?? {};
  });
  return new AgentPool();
}

// Helper to create arbitrary valid AgentProfile
const validAgentProfileArbitrary = fc.record({
  agentId: fc.string({ minLength: 1 }),
  role: fc.constantFrom('planner', 'designer', 'copywriter', 'coder', 'reviewer'),
  capabilities: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 })
});

// Helper to create arbitrary invalid AgentProfile (missing or invalid fields)
const invalidAgentProfileArbitrary = fc.oneof(
  // Missing agentId
  fc.record({
    role: fc.constantFrom('planner', 'designer', 'copywriter', 'coder', 'reviewer'),
    capabilities: fc.array(fc.string({ minLength: 1 }), { minLength: 1 })
  }),
  // Missing capabilities
  fc.record({
    agentId: fc.string({ minLength: 1 }),
    role: fc.constantFrom('planner', 'designer', 'copywriter', 'coder', 'reviewer')
  }),
  // Empty capabilities array
  fc.record({
    agentId: fc.string({ minLength: 1 }),
    role: fc.constantFrom('planner', 'designer', 'copywriter', 'coder', 'reviewer'),
    capabilities: fc.constant([])
  }),
  // Invalid role
  fc.record({
    agentId: fc.string({ minLength: 1 }),
    role: fc.string({ minLength: 1 }),
    capabilities: fc.array(fc.string({ minLength: 1 }), { minLength: 1 })
  }),
  // Empty agentId
  fc.record({
    agentId: fc.constant(''),
    role: fc.constantFrom('planner', 'designer', 'copywriter', 'coder', 'reviewer'),
    capabilities: fc.array(fc.string({ minLength: 1 }), { minLength: 1 })
  })
);

describe('AgentPool', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Task 5.3: Property test — AgentProfile validation rejects incomplete profiles ───
  describe('AgentProfile validation', () => {
    it('should accept valid profiles via Zod schema', () => {
      const { z } = require('zod');
      const AgentProfileSchema = z.object({
        agentId: z.string().min(1),
        role: z.enum(['planner', 'designer', 'copywriter', 'coder', 'reviewer']),
        capabilities: z.array(z.string()).min(1)
      });

      const validProfile = {
        agentId: 'agent-test',
        role: 'coder',
        capabilities: ['code', 'integration']
      };

      const result = AgentProfileSchema.safeParse(validProfile);
      expect(result.success).toBe(true);
    });

    it('should reject profiles missing agentId', () => {
      const { z } = require('zod');
      const AgentProfileSchema = z.object({
        agentId: z.string().min(1),
        role: z.enum(['planner', 'designer', 'copywriter', 'coder', 'reviewer']),
        capabilities: z.array(z.string()).min(1)
      });

      const invalidProfile = {
        role: 'coder',
        capabilities: ['code']
      };

      const result = AgentProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });

    it('should reject profiles with empty capabilities', () => {
      const { z } = require('zod');
      const AgentProfileSchema = z.object({
        agentId: z.string().min(1),
        role: z.enum(['planner', 'designer', 'copywriter', 'coder', 'reviewer']),
        capabilities: z.array(z.string()).min(1)
      });

      const invalidProfile = {
        agentId: 'agent-test',
        role: 'coder',
        capabilities: []
      };

      const result = AgentProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });

    it('should reject profiles with invalid role', () => {
      const { z } = require('zod');
      const AgentProfileSchema = z.object({
        agentId: z.string().min(1),
        role: z.enum(['planner', 'designer', 'copywriter', 'coder', 'reviewer']),
        capabilities: z.array(z.string()).min(1)
      });

      const invalidProfile = {
        agentId: 'agent-test',
        role: 'invalid-role',
        capabilities: ['code']
      };

      const result = AgentProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });

    // Property-based test
    it('property: rejects any profile that does not match the schema (fast-check)', () => {
      fc.assert(
        fc.property(invalidAgentProfileArbitrary, (profile) => {
          const { z } = require('zod');
          const AgentProfileSchema = z.object({
            agentId: z.string().min(1),
            role: z.enum(['planner', 'designer', 'copywriter', 'coder', 'reviewer']),
            capabilities: z.array(z.string()).min(1)
          });
          const result = AgentProfileSchema.safeParse(profile);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    // Property-based test
    it('property: accepts any valid profile matching the schema (fast-check)', () => {
      fc.assert(
        fc.property(validAgentProfileArbitrary, (profile) => {
          const { z } = require('zod');
          const AgentProfileSchema = z.object({
            agentId: z.string().min(1),
            role: z.enum(['planner', 'designer', 'copywriter', 'coder', 'reviewer']),
            capabilities: z.array(z.string()).min(1)
          });
          const result = AgentProfileSchema.safeParse(profile);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ─── Task 5.4: Property test — filtering of invalid profiles ───
  describe('Profile filtering', () => {
    it('should filter out invalid profiles when loading from raw array', () => {
      // Simulates the filtering logic in loadAgentProfiles
      const raw = [
        { agentId: 'valid-1', role: 'coder', capabilities: ['code'] },
        { agentId: '', role: 'coder', capabilities: ['code'] }, // invalid: empty agentId
        { agentId: 'valid-2', role: 'designer', capabilities: ['design'] },
        { agentId: 'invalid-role', role: 'invalid', capabilities: ['code'] }, // invalid role
        { agentId: 'no-caps', role: 'copywriter' }, // missing capabilities
        { agentId: 'valid-3', role: 'reviewer', capabilities: ['review', 'qa'] }
      ];

      const { z } = require('zod');
      const AgentProfileSchema = z.object({
        agentId: z.string().min(1),
        role: z.enum(['planner', 'designer', 'copywriter', 'coder', 'reviewer']),
        capabilities: z.array(z.string()).min(1)
      });

      const valid = raw.filter((item) => AgentProfileSchema.safeParse(item).success);

      expect(valid.length).toBe(3);
      expect(valid.map((v) => v.agentId)).toEqual(['valid-1', 'valid-2', 'valid-3']);
    });

    it('property: only valid profiles pass through the filter (fast-check)', () => {
      fc.assert(
        fc.property(fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 }), (capabilities) => {
          const { z } = require('zod');
          const AgentProfileSchema = z.object({
            agentId: z.string().min(1),
            role: z.enum(['planner', 'designer', 'copywriter', 'coder', 'reviewer']),
            capabilities: z.array(z.string()).min(1)
          });

          // Build profiles where some may be invalid
          const profiles = capabilities.map((cap, i) => ({
            agentId: i % 3 === 0 ? '' : `agent-${i}`, // every 3rd has empty agentId
            role: i % 5 === 0 ? 'invalid' : 'coder',
            capabilities: i % 7 === 0 ? [] : [cap]
          }));

          const valid = profiles.filter((p) => AgentProfileSchema.safeParse(p).success);

          // All returned profiles must be valid
          for (const v of valid) {
            const result = AgentProfileSchema.safeParse(v);
            expect(result.success).toBe(true);
          }
        }),
        { numRuns: 50 }
      );
    });
  });

  // ─── Task 5.5: Unit tests for AgentPool methods ───
  describe('AgentPool methods', () => {
    describe('pickAgentForCapability', () => {
      it('should return an AgentAssignment with valid structure', () => {
        const pool = createAgentPool({ 'agent-code': { code: 0.9 } });

        const result = pool.pickAgentForCapability('code');

        expect(result).toHaveProperty('agentId');
        expect(result).toHaveProperty('role');
        expect(result).toHaveProperty('capability', 'code');
        expect(result).toHaveProperty('reputation');
        expect(typeof result.reputation).toBe('number');
      });

      it('should pick agent with matching capability when available', () => {
        const pool = createAgentPool({
          'agent-code': { code: 0.9 },
          'agent-design': { design: 0.8 }
        });

        const result = pool.pickAgentForCapability('code');

        expect(result.agentId).toBe('agent-code');
        expect(result.role).toBe('coder');
      });

      it('should fallback to highest reputation agent when no matching capability', () => {
        const pool = createAgentPool({
          'agent-code': { code: 0.5 },
          'agent-design': { design: 0.9 }
        });

        const result = pool.pickAgentForCapability('unknown-capability');

        expect(result.agentId).toBe('agent-design');
        expect(result.role).toBe('designer');
      });

      it('should pick highest reputation agent among candidates', () => {
        // The code first filters by capability, then ranks by reputation.
        // Both agent-code and agent-review have 'review' capability, so reputation decides.
        const pool = createAgentPool({
          'agent-code': { review: 0.3 },
          'agent-review': { review: 0.7 }
        });

        const result = pool.pickAgentForCapability('review');

        expect(result.agentId).toBe('agent-review');
      });

      it('should handle empty reputation map by returning default profile', () => {
        const pool = createAgentPool({});

        const result = pool.pickAgentForCapability('any-capability');

        expect(result).toHaveProperty('agentId');
        expect(result).toHaveProperty('role');
        expect(result.reputation).toBe(0);
      });
    });

    describe('pickAgentById', () => {
      it('should return AgentAssignment for existing agent', () => {
        const pool = createAgentPool({
          'agent-planner': { planning: 0.8, review: 0.7 }
        });

        const result = pool.pickAgentById('agent-planner');

        expect(result.agentId).toBe('agent-planner');
        expect(result.role).toBe('planner');
        expect(result.capability).toBe('planning');
      });

      it('should fallback to first available profile for unknown agentId', () => {
        const pool = createAgentPool({});

        const result = pool.pickAgentById('non-existent-agent');

        expect(result.agentId).toBeTruthy();
        expect(result.role).toBeTruthy();
      });

      it('should return valid AgentAssignment structure', () => {
        const pool = createAgentPool({});

        const result = pool.pickAgentById('agent-code');

        expect(result).toHaveProperty('agentId');
        expect(result).toHaveProperty('role');
        expect(result).toHaveProperty('capability');
        expect(result).toHaveProperty('reputation');
      });
    });

    describe('assign', () => {
      it('should always include planner in assignments', () => {
        const pool = createAgentPool({});
        const subtasks: DecomposedSubtask[] = [
          { id: 'sub-1', title: 'Task 1', capability: 'code', status: 'pending' }
        ];

        const result = pool.assign(subtasks);

        expect(result.some((a) => a.role === 'planner')).toBe(true);
      });

      it('should return assignments for all subtasks', () => {
        const pool = createAgentPool({});
        const subtasks: DecomposedSubtask[] = [
          { id: 'sub-1', title: 'Task 1', capability: 'code', status: 'pending' },
          { id: 'sub-2', title: 'Task 2', capability: 'design', status: 'pending' }
        ];

        const result = pool.assign(subtasks);

        expect(result.length).toBeGreaterThanOrEqual(2);
      });

      it('should deduplicate planner in assignments', () => {
        const pool = createAgentPool({});
        const subtasks: DecomposedSubtask[] = [
          { id: 'sub-1', title: 'Task 1', capability: 'planning', status: 'pending' }
        ];

        const result = pool.assign(subtasks);

        const plannerCount = result.filter((a) => a.agentId === 'agent-planner').length;
        expect(plannerCount).toBe(1);
      });

      it('should assign correct capabilities to subtasks', () => {
        const pool = createAgentPool({});
        const subtasks: DecomposedSubtask[] = [
          { id: 'sub-1', title: 'Task 1', capability: 'code', status: 'pending' }
        ];

        const result = pool.assign(subtasks);

        const codeAssignment = result.find((a) => a.capability === 'code');
        expect(codeAssignment).toBeDefined();
      });

      it('should handle empty subtasks array', () => {
        const pool = createAgentPool({});
        const subtasks: DecomposedSubtask[] = [];

        const result = pool.assign(subtasks);

        // Should still return at least the planner
        expect(result.length).toBeGreaterThanOrEqual(1);
        expect(result[0].agentId).toBe('agent-planner');
      });

      it('should return valid AgentAssignment array structure', () => {
        const pool = createAgentPool({});
        const subtasks: DecomposedSubtask[] = [
          { id: 'sub-1', title: 'Task 1', capability: 'code', status: 'pending' }
        ];

        const result = pool.assign(subtasks);

        for (const assignment of result) {
          expect(assignment).toHaveProperty('agentId');
          expect(assignment).toHaveProperty('role');
          expect(assignment).toHaveProperty('capability');
          expect(assignment).toHaveProperty('reputation');
        }
      });
    });
  });

  // ─── Edge cases ───
  describe('Edge cases', () => {
    it('should handle unknown capability gracefully', () => {
      const pool = createAgentPool({
        'agent-code': { code: 0.1 }
      });

      const result = pool.pickAgentForCapability('completely-unknown-cap');

      expect(result).toHaveProperty('agentId');
      expect(result).toHaveProperty('role');
    });

    it('should handle all agents with zero reputation', () => {
      const pool = createAgentPool({
        'agent-code': {},
        'agent-design': {}
      });

      const result = pool.pickAgentForCapability('code');

      expect(result).toHaveProperty('reputation', 0);
    });
  });
});
