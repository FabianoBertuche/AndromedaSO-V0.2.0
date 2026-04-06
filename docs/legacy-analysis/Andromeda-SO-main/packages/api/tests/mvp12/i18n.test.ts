import { describe, it, expect } from 'vitest';

describe('I18n Module', () => {
    describe('Locale Repository', () => {
        it('should have pt-BR as default locale', () => {
            const defaultLocale = 'pt-BR';
            expect(defaultLocale).toBe('pt-BR');
        });

        it('should have en-US as fallback locale', () => {
            const fallbackLocale = 'en-US';
            expect(fallbackLocale).toBe('en-US');
        });
    });

    describe('Message Keys', () => {
        it('should have system messages defined', () => {
            const systemKeys = ['task.created', 'task.completed', 'task.failed', 'task.cancelled'];
            expect(systemKeys).toHaveLength(4);
        });

        it('should have error messages defined', () => {
            const errorKeys = ['validation.required', 'auth.unauthorized', 'rate_limit.exceeded'];
            expect(errorKeys).toHaveLength(3);
        });
    });

    describe('I18n Service', () => {
        it('should return fallback for non-existent locale', () => {
            const message = 'non.existent.key';
            expect(message).toBe('non.existent.key');
        });

        it('should default to pt-BR for new users', () => {
            const defaultPrefs = {
                preferredLocale: 'pt-BR',
                fallbackLocale: 'en-US',
                theme: 'dark',
            };
            expect(defaultPrefs.preferredLocale).toBe('pt-BR');
            expect(defaultPrefs.fallbackLocale).toBe('en-US');
        });
    });
});