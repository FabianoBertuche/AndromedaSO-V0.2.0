export enum Role {
    OWNER = 'owner',
    ADMIN = 'admin',
    OPERATOR = 'operator',
    VIEWER = 'viewer',
}

export interface User {
    id: string;
    email: string;
    passwordHash: string;
    role: Role;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}

export interface RefreshToken {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt?: Date | null;
    createdAt: Date;
}

export interface ApiKey {
    id: string;
    name: string;
    keyHash: string;
    userId: string;
    tenantId: string;
    lastUsedAt?: Date | null;
    expiresAt?: Date | null;
    revokedAt?: Date | null;
    createdAt: Date;
}
