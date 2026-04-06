import { getPrismaClient } from "../../../infrastructure/database/prisma";
import { PreferencesRepository, UserPreferences } from "../domain/types";

export class PrismaPreferencesRepository implements PreferencesRepository {
    constructor(private readonly prisma: any = getPrismaClient()) {}

    async getByUserId(userId: string): Promise<UserPreferences | null> {
        const row = await this.prisma.userPreferences.findUnique({
            where: { userId },
        });

        return row ? this.mapRow(row) : null;
    }

    async upsert(userId: string, data: { preferredLocale?: string; fallbackLocale?: string; theme?: string }): Promise<UserPreferences> {
        const row = await this.prisma.userPreferences.upsert({
            where: { userId },
            update: {
                preferredLocale: data.preferredLocale,
                fallbackLocale: data.fallbackLocale,
                theme: data.theme,
            },
            create: {
                userId,
                preferredLocale: data.preferredLocale ?? "pt-BR",
                fallbackLocale: data.fallbackLocale ?? "en-US",
                theme: data.theme ?? "dark",
            },
        });

        return this.mapRow(row);
    }

    private mapRow(row: any): UserPreferences {
        return {
            id: row.id,
            userId: row.userId,
            preferredLocale: row.preferredLocale,
            fallbackLocale: row.fallbackLocale,
            theme: row.theme,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
}