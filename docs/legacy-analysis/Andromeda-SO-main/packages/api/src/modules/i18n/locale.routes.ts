import { Router, Request, Response } from "express";
import { I18nService } from "./i18n.service";

export function createI18nRouter(i18nService: I18nService): Router {
    const router = Router();

    router.get("/locales", async (req: Request, res: Response) => {
        try {
            const locales = await i18nService.listLocales();
            res.json(locales);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get("/messages", async (req: Request, res: Response) => {
        try {
            const locale = (req.query.locale as string) || "pt-BR";
            const category = req.query.category as string | undefined;

            let messages;
            if (category) {
                messages = await i18nService.getMessagesByCategory(locale, category);
            } else {
                messages = await i18nService.getMessagesByLocale(locale);
            }

            res.json(messages);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}

export function createUserPreferencesRouter(i18nService: I18nService): Router {
    const router = Router();

    router.put("/me/preferences", async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const { preferredLocale, fallbackLocale, theme } = req.body;
            const prefs = await i18nService.updateUserPreferences(userId, {
                preferredLocale,
                fallbackLocale,
                theme,
            });

            res.json(prefs);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get("/me/preferences", async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const prefs = await i18nService.getUserPreferences(userId);
            res.json(prefs);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}