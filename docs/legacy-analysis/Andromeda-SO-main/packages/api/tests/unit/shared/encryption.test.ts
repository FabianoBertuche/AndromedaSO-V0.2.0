import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';

const testKey = crypto.randomBytes(32).toString('base64url');

process.env.ENCRYPTION_KEY = testKey;
process.env.NODE_ENV = 'development';

const { EncryptionService } = await import('../../../src/shared/services/encryption');

describe('EncryptionService', () => {
    describe('encrypt and decrypt', () => {
        it('should encrypt and decrypt a plaintext string', () => {
            const plaintext = 'my-secret-api-key';
            const encrypted = EncryptionService.encrypt(plaintext);
            
            expect(encrypted).not.toBe(plaintext);
            expect(encrypted).toContain(':');
            
            const decrypted = EncryptionService.decrypt(encrypted);
            expect(decrypted).toBe(plaintext);
        });

        it('should produce different ciphertext for same plaintext', () => {
            const plaintext = 'another-secret';
            const encrypted1 = EncryptionService.encrypt(plaintext);
            const encrypted2 = EncryptionService.encrypt(plaintext);
            
            expect(encrypted1).not.toBe(encrypted2);
            
            expect(EncryptionService.decrypt(encrypted1)).toBe(plaintext);
            expect(EncryptionService.decrypt(encrypted2)).toBe(plaintext);
        });

        it('should throw on invalid ciphertext format', () => {
            expect(() => EncryptionService.decrypt('invalid-ciphertext')).toThrow('Invalid ciphertext format');
        });

        it('should throw on tampered ciphertext', () => {
            const plaintext = 'sensitive-data';
            const encrypted = EncryptionService.encrypt(plaintext);
            const parts = encrypted.split(':');
            const tampered = `${parts[0]}:${parts[1]}:${parts[2].slice(0, -4)}abcd`;
            
            expect(() => EncryptionService.decrypt(tampered)).toThrow();
        });
    });

    describe('hashApiKey', () => {
        it('should produce consistent hash for same input', () => {
            const apiKey = 'sk_test_123456789';
            const hash1 = EncryptionService.hashApiKey(apiKey);
            const hash2 = EncryptionService.hashApiKey(apiKey);
            
            expect(hash1).toBe(hash2);
            expect(hash1).toHaveLength(64);
        });

        it('should produce different hash for different input', () => {
            const hash1 = EncryptionService.hashApiKey('key1');
            const hash2 = EncryptionService.hashApiKey('key2');
            
            expect(hash1).not.toBe(hash2);
        });
    });

    describe('generateSecureToken', () => {
        it('should generate token of specified length', () => {
            const token32 = EncryptionService.generateSecureToken(32);
            const token16 = EncryptionService.generateSecureToken(16);
            
            expect(token32.length).toBe(Math.ceil(32 * 4 / 3));
            expect(token16.length).toBe(Math.ceil(16 * 4 / 3));
        });

        it('should generate unique tokens', () => {
            const tokens = new Set<string>();
            for (let i = 0; i < 100; i++) {
                tokens.add(EncryptionService.generateSecureToken(32));
            }
            expect(tokens.size).toBe(100);
        });
    });
});