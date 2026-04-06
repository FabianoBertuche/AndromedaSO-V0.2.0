import { Response } from "express";
import { I18nService } from "./i18n.service";

export class LocaleController {
    constructor(private readonly i18nService: I18nService) {}

    async listLocales(_req: any, res: Response): Promise<void> {
        try {
            const locales = await this.i18nService.listLocales();
            res.json(locales);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getMessages(req: any, res: Response): Promise<void> {
        try {
            const locale = req.query.locale || "pt-BR";
            const category = req.query.category;

            let messages;
            if (category) {
                messages = await this.i18nService.getMessagesByCategory(locale, category);
            } else {
                messages = await this.i18nService.getMessagesByLocale(locale);
            }

            res.json(messages);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getUserPreferences(req: any, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            const prefs = await this.i18nService.getUserPreferences(userId);
            res.json(prefs);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateUserPreferences(req: any, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }

            const { preferredLocale, fallbackLocale, theme } = req.body;
            const prefs = await this.i18nService.updateUserPreferences(userId, {
                preferredLocale,
                fallbackLocale,
                theme,
            });

            res.json(prefs);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}