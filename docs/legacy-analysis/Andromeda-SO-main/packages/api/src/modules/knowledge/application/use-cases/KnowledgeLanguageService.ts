import { LanguageDetectionService } from "../../../cognitive/infrastructure/python/LanguageDetectionService";
import { getPrismaClient } from "../../../../infrastructure/database/prisma";

export interface DetectedLanguage {
    langCode: string;
    locale: string;
    confidence: number;
    fallback: boolean;
}

export class KnowledgeLanguageService {
    private readonly languageDetectionService: LanguageDetectionService;

    constructor(languageDetectionService?: LanguageDetectionService) {
        const config = {
            enabled: !!process.env.COGNITIVE_SERVICE_URL || process.env.COGNITIVE_SERVICE_ENABLED === "true",
            baseUrl: process.env.COGNITIVE_SERVICE_URL || "http://127.0.0.1:8008",
            timeoutMs: parseInt(process.env.COGNITIVE_SERVICE_TIMEOUT_MS || "1500", 10),
            retryCount: parseInt(process.env.COGNITIVE_SERVICE_RETRY_COUNT || "1", 10),
            serviceName: "cognitive-python",
            serviceVersion: "0.1.0",
            authToken: process.env.COGNITIVE_SERVICE_AUTH_TOKEN,
        };

        this.languageDetectionService = languageDetectionService || new LanguageDetectionService(config);
    }

    async detectAndStore(documentId: string): Promise<DetectedLanguage | null> {
        const prisma = getPrismaClient();

        const document = await prisma.knowledgeDocument.findUnique({
            where: { id: documentId },
        });

        if (!document) {
            console.warn(`[knowledge.language] Document ${documentId} not found`);
            return null;
        }

        if (!document.rawText) {
            console.info(`[knowledge.language] Document ${documentId} has no rawText, skipping language detection`);
            return null;
        }

        const text = document.rawText.slice(0, 5000);

        try {
            const result = await this.languageDetectionService.detect({ text });

            await prisma.knowledgeDocument.update({
                where: { id: documentId },
                data: {
                    detectedLang: result.lang_code,
                    detectedLocale: result.locale,
                    langConfidence: result.confidence,
                },
            });

            console.info(`[knowledge.language] Document ${documentId} detected as ${result.locale} (confidence: ${result.confidence}, fallback: ${result.fallback})`);

            return {
                langCode: result.lang_code,
                locale: result.locale,
                confidence: result.confidence,
                fallback: result.fallback,
            };
        } catch (error) {
            console.error(`[knowledge.language] Failed to detect language for document ${documentId}:`, error);
            return null;
        }
    }

    async detectForText(text: string): Promise<DetectedLanguage> {
        const sample = text.slice(0, 5000);
        const result = await this.languageDetectionService.detect({ text: sample });

        return {
            langCode: result.lang_code,
            locale: result.locale,
            confidence: result.confidence,
            fallback: result.fallback,
        };
    }
}