import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

function isValidBase64Url(val: string): boolean {
    try {
        const base64 = val.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
        Buffer.from(padded, 'base64');
        return val.length >= 32;
    } catch {
        return false;
    }
}

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(5000),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url().optional(),

    // Auth - LEI 05: bcrypt rounds mínimo 12
    JWT_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES: z.string().default('15m'),
    JWT_REFRESH_EXPIRES: z.string().default('30d'),
    BCRYPT_ROUNDS: z.coerce.number().min(12).default(12),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
    RATE_LIMIT_MAX: z.coerce.number().default(100),
    RATE_LIMIT_AUTH_MAX: z.coerce.number().default(5),

    // Services
    COGNITIVE_PYTHON_URL: z.string().url().default('http://127.0.0.1:8008'),
    COGNITIVE_PYTHON_TOKEN: z.string().optional(),

    // Encryption - LEI 04: Secrets Vault
    ENCRYPTION_KEY: z.string().optional().refine(
        (val) => {
            if (!val) return true;
            return isValidBase64Url(val);
        },
        { message: 'ENCRYPTION_KEY must be a valid Base64 URL-safe string with at least 32 characters' }
    ),

    // Environment prefix - LEI 13: Environment Isolation
    APP_ENV: z.enum(['development', 'staging', 'production']).optional(),
});

export type Env = z.infer<typeof envSchema>;

const result = envSchema.safeParse(process.env);

if (!result.success) {
    console.error('❌ Invalid environment variables:', JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
}

if (result.data.NODE_ENV === 'production' && !result.data.ENCRYPTION_KEY) {
    console.error('❌ ENCRYPTION_KEY is required in production environment');
    process.exit(1);
}

if (result.data.NODE_ENV === 'test' && result.data.ENCRYPTION_KEY?.includes('live')) {
    console.error('❌ Production ENCRYPTION_KEY detected in test environment!');
    process.exit(1);
}

export const env = result.data;