export { I18nService } from "./i18n.service";
export { LocaleController } from "./locale.controller";
export { createI18nRouter, createUserPreferencesRouter } from "./locale.routes";
export { i18nRouter, userPreferencesRouter, i18nService } from "./dependencies";
export { PrismaLocaleRepository } from "./repositories/locale.repository";
export { PrismaMessageRepository } from "./repositories/message.repository";
export { PrismaPreferencesRepository } from "./repositories/preferences.repository";
export { runSeeds, seedPtBrMessages, seedEnUsMessages } from "./seeds";
export * from "./domain/types";