import { getPrismaClient } from "../../infrastructure/database/prisma";
import { runSeeds } from "./seeds";
import { PrismaLocaleRepository } from "./repositories/locale.repository";
import { PrismaMessageRepository } from "./repositories/message.repository";

const prisma = getPrismaClient();
const localeRepo = new PrismaLocaleRepository(prisma);
const messageRepo = new PrismaMessageRepository(prisma);

const DEFAULT_LOCALES = [
    { code: "pt-BR", name: "Português (Brasil)", isDefault: true },
    { code: "en-US", name: "English (US)", isDefault: false },
];

export async function bootstrapI18n(): Promise<void> {
    console.log("Bootstrapping i18n module...");

    try {
        const existingLocales = await localeRepo.list();

        if (existingLocales.length === 0) {
            console.log("Seeding default locales...");
            for (const locale of DEFAULT_LOCALES) {
                await localeRepo.create(locale);
            }
            console.log(`Seeded ${DEFAULT_LOCALES.length} locales`);
        } else {
            console.log(`Found ${existingLocales.length} existing locales`);
        }

        const ptBrMessages = await messageRepo.findByLocale("pt-BR");
        if (ptBrMessages.length === 0) {
            console.log("Seeding i18n messages...");
            await runSeeds(messageRepo);
        } else {
            console.log(`Found ${ptBrMessages.length} existing pt-BR messages`);
        }

        console.log("i18n module bootstrapped successfully");
    } catch (error) {
        console.error("Failed to bootstrap i18n:", error);
    }
}