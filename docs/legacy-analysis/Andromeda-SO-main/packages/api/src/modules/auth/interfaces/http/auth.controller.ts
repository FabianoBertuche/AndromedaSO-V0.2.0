import { Request, Response } from 'express';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/RefreshTokenUseCase';
import { RevokeTokenUseCase } from '../../application/use-cases/RevokeTokenUseCase';
import { CreateApiKeyUseCase } from '../../application/use-cases/CreateApiKeyUseCase';
import { RequestWithContext } from '../../../../shared/http/request-context';

export class AuthController {
    constructor(
        private loginUseCase: LoginUseCase,
        private refreshTokenUseCase: RefreshTokenUseCase,
        private revokeTokenUseCase: RevokeTokenUseCase,
        private createApiKeyUseCase: CreateApiKeyUseCase
    ) { }

    async login(req: Request, res: Response) {
        const { email, password } = req.body;
        const result = await this.loginUseCase.execute(email, password);

        if (!result.success) {
            return res.status(401).json({ error: result.error });
        }

        return res.status(200).json(result.data);
    }

    async refresh(req: Request, res: Response) {
        const { refreshToken } = req.body;
        const result = await this.refreshTokenUseCase.execute(refreshToken);

        if (!result.success) {
            return res.status(401).json({ error: result.error });
        }

        return res.status(200).json(result.data);
    }

    async logout(req: RequestWithContext, res: Response) {
        const { refreshToken } = req.body;
        const userId = req.user?.id;

        if (userId && refreshToken) {
            await this.revokeTokenUseCase.execute(refreshToken, userId);
        }

        return res.status(204).send();
    }

    async me(req: RequestWithContext, res: Response) {
        return res.status(200).json({ user: req.user });
    }

    async createApiKey(req: RequestWithContext, res: Response) {
        const { name } = req.body;
        const userId = req.user?.id!;
        const tenantId = req.user?.tenantId!;

        const result = await this.createApiKeyUseCase.execute(name, userId, tenantId);
        return res.status(201).json(result.data);
    }
}
