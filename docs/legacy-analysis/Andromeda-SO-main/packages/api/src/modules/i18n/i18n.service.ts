import { LocaleRepository, MessageRepository, PreferencesRepository, LocaleRegistry, LocalizedString } from "./domain/types";

export class I18nService {
    constructor(
        private readonly localeRepo: LocaleRepository,
        private readonly messageRepo: MessageRepository,
        private readonly preferencesRepo: PreferencesRepository,
    ) {}

    async getMessage(key: string, locale: string): Promise<string> {
        const msg = await this.messageRepo.findByKeyAndLocale(key, locale);
        if (msg) {
            return msg.value;
        }

        const fallback = await this.messageRepo.findByKeyAndLocale(key, "en-US");
        return fallback?.value ?? key;
    }

    async listLocales(): Promise<LocaleRegistry[]> {
        return this.localeRepo.list();
    }

    async getMessagesByCategory(locale: string, category: string): Promise<LocalizedString[]> {
        return this.messageRepo.findByCategory(locale, category);
    }

    async getMessagesByLocale(locale: string): Promise<LocalizedString[]> {
        return this.messageRepo.findByLocale(locale);
    }

    async getUserPreferences(userId: string): Promise<{ preferredLocale: string; fallbackLocale: string; theme: string }> {
        const prefs = await this.preferencesRepo.getByUserId(userId);
        if (prefs) {
            return {
                preferredLocale: prefs.preferredLocale,
                fallbackLocale: prefs.fallbackLocale,
                theme: prefs.theme,
            };
        }
        return {
            preferredLocale: "pt-BR",
            fallbackLocale: "en-US",
            theme: "dark",
        };
    }

    async updateUserPreferences(userId: string, data: { preferredLocale?: string; fallbackLocale?: string; theme?: string }): Promise<{ preferredLocale: string; fallbackLocale: string; theme: string }> {
        const prefs = await this.preferencesRepo.upsert(userId, data);
        return {
            preferredLocale: prefs.preferredLocale,
            fallbackLocale: prefs.fallbackLocale,
            theme: prefs.theme,
        };
    }

    async getAgentSystemPromptLocale(agentPreferredLocale: string | undefined | null): Promise<string> {
        return agentPreferredLocale ?? "pt-BR";
    }
}