import { getPrismaClient } from "../../../infrastructure/database/prisma";
import { MessageRepository, LocalizedString } from "../domain/types";

export class PrismaMessageRepository implements MessageRepository {
    constructor(private readonly prisma: any = getPrismaClient()) {}

    async findByKeyAndLocale(key: string, locale: string): Promise<LocalizedString | null> {
        const row = await this.prisma.localizedMessage.findUnique({
            where: {
                key_locale: { key, locale },
            },
        });

        return row ? this.mapRow(row) : null;
    }

    async findByCategory(locale: string, category: string): Promise<LocalizedString[]> {
        const rows = await this.prisma.localizedMessage.findMany({
            where: { locale, category },
            orderBy: { key: "asc" },
        });

        return rows.map((row: any) => this.mapRow(row));
    }

    async findByLocale(locale: string): Promise<LocalizedString[]> {
        const rows = await this.prisma.localizedMessage.findMany({
            where: { locale },
            orderBy: [{ category: "asc" }, { key: "asc" }],
        });

        return rows.map((row: any) => this.mapRow(row));
    }

    async create(data: { key: string; locale: string; value: string; category: string }): Promise<LocalizedString> {
        const row = await this.prisma.localizedMessage.create({
            data: {
                key: data.key,
                locale: data.locale,
                value: data.value,
                category: data.category,
            },
        });

        return this.mapRow(row);
    }

    async createMany(messages: Array<{ key: string; locale: string; value: string; category: string }>): Promise<number> {
        const result = await this.prisma.localizedMessage.createMany({
            data: messages,
            skipDuplicates: true,
        });

        return result.count;
    }

    private mapRow(row: any): LocalizedString {
        return {
            key: row.key,
            locale: row.locale,
            value: row.value,
            category: row.category,
        };
    }
}