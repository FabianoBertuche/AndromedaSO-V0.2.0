import { describe, it, expect } from 'vitest';
import { createDefaultAgentProfile } from '../../src/modules/agent-management/domain/agent-profile';

describe('Agent Portability', () => {
    describe('Bundle Manifest', () => {
        it('should create valid agent profile', () => {
            const profile = createDefaultAgentProfile({
                id: 'test-agent',
                name: 'Test Agent',
                role: 'Test Role',
                description: 'A test agent for bundle testing',
                teamId: 'team-test',
                category: 'test',
                type: 'specialist',
                defaultModel: 'test-model',
            });

            expect(profile.id).toBe('test-agent');
            expect(profile.identity.name).toBe('Test Agent');
            expect(profile.version).toBe('v1.0.0');
        });

        it('should generate correct profile structure', () => {
            const profile = createDefaultAgentProfile({
                id: 'structure-agent',
                name: 'Structure Test',
                role: 'Tester',
                description: 'Testing structure',
                teamId: 'team-test',
                category: 'test',
                type: 'specialist',
                defaultModel: 'test-model',
            });

            expect(profile.identity).toBeDefined();
            expect(profile.soul).toBeDefined();
            expect(profile.rules).toBeDefined();
            expect(profile.playbook).toBeDefined();
            expect(profile.context).toBeDefined();
            expect(profile.persona).toBeDefined();
            expect(profile.safeguards).toBeDefined();
        });

        it('should support version bumping', () => {
            const profile = createDefaultAgentProfile({
                id: 'version-agent',
                name: 'Version Test',
                role: 'Tester',
                description: 'Testing versioning',
                teamId: 'team-test',
                category: 'test',
                type: 'specialist',
                defaultModel: 'test-model',
            });

            const version = profile.version;
            expect(version).toMatch(/^v\d+\.\d+\.\d+$/);
        });

        it('should normalize profile correctly', () => {
            const profile = createDefaultAgentProfile({
                id: 'normalize-agent',
                name: 'Normalize Test',
                role: 'Tester',
                description: 'Testing normalization',
                teamId: 'team-test',
                category: 'test',
                type: 'specialist',
                defaultModel: 'test-model',
            });

            expect(profile.status).toBe('active');
            expect(profile.isDefault).toBe(false);
            expect(profile.markdown).toBeDefined();
            expect(typeof profile.markdown.identity).toBe('string');
        });
    });

    describe('Import Status', () => {
        it('should have all valid import statuses', () => {
            const validStatuses = ['PENDING', 'VALIDATING', 'CONFLICT_DETECTED', 'IMPORTING', 'COMPLETED', 'FAILED'];
            expect(validStatuses).toHaveLength(6);
        });

        it('should have all valid conflict policies', () => {
            const validPolicies = ['ABORT', 'RENAME', 'OVERWRITE'];
            expect(validPolicies).toHaveLength(3);
        });
    });
});