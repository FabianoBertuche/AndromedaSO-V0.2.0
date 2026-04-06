import { Router } from "express";
import { I18nService } from "./i18n.service";
import { PrismaLocaleRepository } from "./repositories/locale.repository";
import { PrismaMessageRepository } from "./repositories/message.repository";
import { PrismaPreferencesRepository } from "./repositories/preferences.repository";
import { createI18nRouter, createUserPreferencesRouter } from "./locale.routes";
import { getPrismaClient } from "../../infrastructure/database/prisma";

const prisma = getPrismaClient();

const localeRepo = new PrismaLocaleRepository(prisma);
const messageRepo = new PrismaMessageRepository(prisma);
const preferencesRepo = new PrismaPreferencesRepository(prisma);

export const i18nService = new I18nService(localeRepo, messageRepo, preferencesRepo);

export const i18nRouter = Router();
i18nRouter.use(createI18nRouter(i18nService));

export const userPreferencesRouter = createUserPreferencesRouter(i18nService);

export { localeRepo, messageRepo, preferencesRepo };