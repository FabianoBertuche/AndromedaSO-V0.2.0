import { getPrismaClient } from "../../../infrastructure/database/prisma";
import { LocaleRepository, LocaleRegistry } from "../domain/types";

export class PrismaLocaleRepository implements LocaleRepository {
    constructor(private readonly prisma: any = getPrismaClient()) {}

    async list(): Promise<LocaleRegistry[]> {
        const rows = await this.prisma.localeRegistry.findMany({
            where: { isActive: true },
            orderBy: [{ isDefault: "desc" }, { name: "asc" }],
        });

        return rows.map((row: any) => this.mapRow(row));
    }

    async getByCode(code: string): Promise<LocaleRegistry | null> {
        const row = await this.prisma.localeRegistry.findUnique({
            where: { code },
        });

        return row ? this.mapRow(row) : null;
    }

    async create(data: { code: string; name: string; isDefault?: boolean }): Promise<LocaleRegistry> {
        const row = await this.prisma.localeRegistry.create({
            data: {
                code: data.code,
                name: data.name,
                isDefault: data.isDefault ?? false,
                isActive: true,
            },
        });

        return this.mapRow(row);
    }

    private mapRow(row: any): LocaleRegistry {
        return {
            id: row.id,
            code: row.code,
            name: row.name,
            isDefault: row.isDefault,
            isActive: row.isActive,
            createdAt: row.createdAt,
        };
    }
}