import { Prisma } from '@prisma/client';

const RLS_EXTENSION_NAME = 'rlsExtension';

export function getRlsPrismaClient(baseClient: any, tenantId: string) {
    if (!baseClient) {
        throw new Error('Prisma client not initialized.');
    }

    return baseClient.$extends({
        name: RLS_EXTENSION_NAME,
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }: {
                    model: string;
                    operation: string;
                    args: any;
                    query: (args: any) => Promise<any>;
                }) {
                    const [, result] = await baseClient.$transaction([
                        baseClient.$executeRaw`SET app.current_tenant = ${tenantId}`,
                        query(args)
                    ]);
                    return result;
                }
            }
        }
    });
}

export function createRlsExtensionMiddleware() {
    return async (req: any, res: any, next: any) => {
        const tenantId = req.tenantId || req.user?.tenantId || 'default';
        res.locals.tenantId = tenantId;
        next();
    };
}