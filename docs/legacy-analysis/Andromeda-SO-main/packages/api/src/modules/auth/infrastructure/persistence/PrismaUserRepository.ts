import { PrismaClient } from '@prisma/client';
import { IUserRepository } from '../../domain/ports';
import { User, Role } from '../../domain/user';

const prisma = (globalThis.__andromedaPrisma || new PrismaClient());

export class PrismaUserRepository implements IUserRepository {
    async findByEmail(email: string): Promise<User | null> {
        const user = await prisma.user.findUnique({
            where: { email, deletedAt: null },
        });
        return user as User | null;
    }

    async findById(id: string): Promise<User | null> {
        const user = await prisma.user.findUnique({
            where: { id, deletedAt: null },
        });
        return user as User | null;
    }

    async create(user: Partial<User>): Promise<User> {
        const created = await prisma.user.create({
            data: {
                email: user.email!,
                passwordHash: user.passwordHash!,
                role: (user.role as any) || Role.VIEWER,
                tenantId: user.tenantId || 'default',
            },
        });
        return created as User;
    }
}

