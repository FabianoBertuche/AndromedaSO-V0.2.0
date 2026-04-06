import pino from 'pino';
import { env } from './config/env';

const isDevelopment = env.NODE_ENV === 'development';

export const logger = pino({
    level: isDevelopment ? 'debug' : 'info',
    transport: isDevelopment
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                ignore: 'pid,hostname',
            },
        }
        : undefined,
    redact: {
        paths: [
            'password',
            'passwordHash',
            'token',
            'refreshToken',
            'accessToken',
            'api_key',
            'apiKey',
            'keyHash',
            'authorization',
            'cookie',
            '*.password',
            '*.token',
            '*.api_key',
            '*.authorization',
            '*.cookie',
            'ENCRYPTION_KEY',
            'JWT_SECRET',
        ],
        remove: true,
    },
});

export function createLoggerWithContext(requestId: string) {
    return logger.child({ requestId });
}
