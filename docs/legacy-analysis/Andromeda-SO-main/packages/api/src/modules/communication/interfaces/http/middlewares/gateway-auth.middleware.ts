import { Request, Response, NextFunction } from "express";
import { ChannelAuthPort } from "../../../domain/ports/integration.ports";
import { parseGatewayToken } from "../../../infrastructure/auth/gateway-token";
import { sendError } from "../../../../../shared/http/error-response";

export function createGatewayAuthMiddleware(channelAuthPort: ChannelAuthPort) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;
        const token = parseGatewayToken(authHeader);
        const channel = req.body?.channel;

        if (!channel) {
            return sendError(req, res, 400, "BAD_REQUEST", "Channel is required in request body", {
                field: "channel",
            });
        }

        const result = await channelAuthPort.authenticate({
            channel,
            token,
        });

        if (!result.authenticated) {
            return sendError(req, res, 401, "UNAUTHORIZED", "Invalid or missing gateway token");
        }

        // Injetar contexto de autenticação no objeto de request
        (req as any).gatewayAuth = {
            authenticated: true,
            clientId: result.clientId,
            scopes: result.scopes ?? [],
        };

        next();
    };
}
