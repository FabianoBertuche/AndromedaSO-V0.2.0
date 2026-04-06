import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { RequestWithContext } from '../http/request-context';
import { logger } from '../logger';
import { PrismaClient } from '@prisma/client';
import { parseGatewayToken } from '../../modules/communication/infrastructure/auth/gateway-token';

const prisma = (globalThis.__andromedaPrisma || new PrismaClient());

export async function authMiddleware(req: RequestWithContext, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers['x-api-key'];
    const gatewayUser = resolveGatewayUser(authHeader);

    if (gatewayUser) {
        req.user = gatewayUser;
        req.tenantId = gatewayUser.tenantId;
        return next();
    }

    // 1. Verificação de API Key
    if (apiKeyHeader && typeof apiKeyHeader === 'string') {
        try {
            const crypto = await import('crypto');
            const keyHash = crypto.createHash('sha256').update(apiKeyHeader).digest('hex');

            const apiKey = await prisma.apiKey.findUnique({
                where: { keyHash, revokedAt: null },
                include: { user: true }
            });

            if (apiKey && (!apiKey.expiresAt || apiKey.expiresAt > new Date())) {
                req.user = {
                    id: apiKey.userId,
                    role: apiKey.user.role,
                    tenantId: apiKey.tenantId
                };
                req.tenantId = apiKey.tenantId;

                // Update lastUsedAt async
                prisma.apiKey.update({
                    where: { id: apiKey.id },
                    data: { lastUsedAt: new Date() }
                }).catch((err: any) => logger.error({ err }, 'Failed to update API Key lastUsedAt'));

                return next();
            }
        } catch (error: any) {
            logger.error({ err: error }, 'API Key validation error');
        }
    }

    // 2. Verificação de JWT
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const payload = jwt.verify(token, env.JWT_SECRET) as any;
            req.user = {
                id: payload.sub,
                role: payload.role,
                tenantId: payload.tenantId
            };
            req.tenantId = payload.tenantId;
            return next();
        } catch (error) {
            logger.warn('Invalid or expired JWT token');
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
    }

    return res.status(401).json({ error: 'Unauthorized' });
}

function resolveGatewayUser(authHeader?: string) {
    const token = parseGatewayToken(authHeader);
    if (!token) {
        return undefined;
    }

    const mapping: Record<string, { id: string; role: string; tenantId: string }> = {
        [process.env.GATEWAY_WEB_TOKEN || 'andromeda_dev_web_token']: {
            id: 'gateway-web',
            role: 'owner',
            tenantId: 'default',
        },
        [process.env.GATEWAY_CLI_TOKEN || 'andromeda_dev_cli_token']: {
            id: 'gateway-cli',
            role: 'owner',
            tenantId: 'default',
        },
        [process.env.GATEWAY_MOBILE_TOKEN || 'andromeda_dev_mobile_token']: {
            id: 'gateway-mobile',
            role: 'operator',
            tenantId: 'default',
        },
        [process.env.GATEWAY_LEGACY_TOKEN || 'andromeda-secret-token']: {
            id: 'gateway-legacy',
            role: 'owner',
            tenantId: 'default',
        },
    };

    return mapping[token];
}

