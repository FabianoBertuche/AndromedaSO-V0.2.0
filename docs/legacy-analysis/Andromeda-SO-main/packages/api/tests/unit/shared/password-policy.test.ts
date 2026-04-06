import { describe, it, expect } from 'vitest';
import { PasswordPolicy, validatePassword, PasswordPolicySchema } from '../../../src/shared/services/password-policy';

describe('PasswordPolicy', () => {
    describe('validate', () => {
        it('should reject password shorter than 8 characters', () => {
            const result = PasswordPolicy.validate('Abc123');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must be at least 8 characters');
        });

        it('should reject password without lowercase letter', () => {
            const result = PasswordPolicy.validate('ABC12345');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one lowercase letter');
        });

        it('should reject password without uppercase letter', () => {
            const result = PasswordPolicy.validate('abc12345');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
        });

        it('should reject password without number', () => {
            const result = PasswordPolicy.validate('Abcdefgh');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one number');
        });

        it('should accept valid password with all requirements', () => {
            const result = PasswordPolicy.validate('Abcdef123');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should accept password with special characters', () => {
            const result = PasswordPolicy.validate('Abcdef123!@#');
            expect(result.valid).toBe(true);
        });
    });

    describe('getStrength', () => {
        it('should return weak for very simple password', () => {
            const strength = PasswordPolicy.getStrength('abc');
            expect(strength).toBe('weak');
        });

        it('should return medium for adequate password', () => {
            const strength = PasswordPolicy.getStrength('Abcdef12');
            expect(strength).toBe('medium');
        });

        it('should return strong for complex password', () => {
            const strength = PasswordPolicy.getStrength('Abcdefgh123!@#');
            expect(strength).toBe('strong');
        });
    });
});

describe('validatePassword', () => {
    it('should return validation result with strength', () => {
        const result = validatePassword('Abcdef123');
        expect(result.valid).toBe(true);
        expect(result.strength).toBe('medium');
    });
});

describe('PasswordPolicySchema', () => {
    it('should parse with zod', () => {
        const result = PasswordPolicySchema.safeParse('Abcdef123');
        expect(result.success).toBe(true);
    });

    it('should fail with zod for invalid password', () => {
        const result = PasswordPolicySchema.safeParse('abc');
        expect(result.success).toBe(false);
    });
});