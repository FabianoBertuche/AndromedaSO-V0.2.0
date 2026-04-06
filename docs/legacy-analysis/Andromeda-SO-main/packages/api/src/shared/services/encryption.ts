import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
    if (!env.ENCRYPTION_KEY) {
        if (env.NODE_ENV === 'production') {
            throw new Error('ENCRYPTION_KEY is required in production environment');
        }
        console.warn('⚠️ ENCRYPTION_KEY not set, using development fallback. DO NOT USE IN PRODUCTION!');
        return crypto.randomBytes(32);
    }
    
    const base64 = env.ENCRYPTION_KEY.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return Buffer.from(padded, 'base64');
}

let encryptionKey: Buffer | null = null;

function getKey(): Buffer {
    if (!encryptionKey) {
        encryptionKey = getEncryptionKey();
    }
    return encryptionKey;
}

export class EncryptionService {
    static encrypt(plaintext: string): string {
        const key = getKey();
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv) as crypto.CipherGCM;
        
        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }

    static decrypt(ciphertext: string): string {
        const key = getKey();
        const parts = ciphertext.split(':');
        
        if (parts.length !== 3) {
            throw new Error('Invalid ciphertext format');
        }
        
        const [ivHex, authTagHex, encrypted] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv) as crypto.DecipherGCM;
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    static hashApiKey(plaintext: string): string {
        return crypto.createHash('sha256').update(plaintext).digest('hex');
    }

    static generateSecureToken(length: number = 32): string {
        return crypto.randomBytes(length).toString('base64url');
    }
}

export const encryption = new EncryptionService();