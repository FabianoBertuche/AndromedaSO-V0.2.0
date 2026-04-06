import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 8;

export const PasswordPolicySchema = z.string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number');

export const PasswordPolicy = {
    MIN_LENGTH: PASSWORD_MIN_LENGTH,
    RULES: [
        { pattern: /[a-z]/, description: 'At least one lowercase letter' },
        { pattern: /[A-Z]/, description: 'At least one uppercase letter' },
        { pattern: /\d/, description: 'At least one number' },
        { pattern: /.{8,}/, description: `Minimum ${PASSWORD_MIN_LENGTH} characters` },
    ] as const,

    validate(password: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (password.length < this.MIN_LENGTH) {
            errors.push(`Password must be at least ${this.MIN_LENGTH} characters`);
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    },

    getStrength(password: string): 'weak' | 'medium' | 'strong' {
        let score = 0;

        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

        if (score >= 5) return 'strong';
        if (score >= 3) return 'medium';
        return 'weak';
    },
};

export interface PasswordValidationResult {
    valid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
}

export function validatePassword(password: string): PasswordValidationResult {
    const { valid, errors } = PasswordPolicy.validate(password);
    const strength = PasswordPolicy.getStrength(password);

    return { valid, errors, strength };
}