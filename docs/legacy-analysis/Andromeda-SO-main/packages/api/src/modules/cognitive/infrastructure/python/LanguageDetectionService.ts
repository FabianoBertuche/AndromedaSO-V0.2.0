import { CognitiveServiceConfig } from "../cognitive-service.config";

export interface LanguageDetectionRequest {
    text: string;
    min_confidence?: number;
}

export interface LanguageDetectionResponse {
    lang_code: string;
    locale: string;
    confidence: number;
    fallback: boolean;
}

export class LanguageDetectionService {
    constructor(private readonly config: CognitiveServiceConfig) {}

    async detect(request: LanguageDetectionRequest): Promise<LanguageDetectionResponse> {
        if (!this.config.enabled) {
            return {
                lang_code: "en",
                locale: "en-US",
                confidence: 0.0,
                fallback: true,
            };
        }

        const url = `${this.config.baseUrl}/v1/language/detect`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    ...(this.config.authToken ? { "x-service-token": this.config.authToken } : {}),
                },
                body: JSON.stringify({
                    text: request.text,
                    min_confidence: request.min_confidence ?? 0.8,
                }),
                signal: controller.signal,
            });

            if (!response.ok) {
                console.warn(`[language.detect] HTTP ${response.status}, falling back to en-US`);
                return this.getFallback();
            }

            const data = await response.json();
            
            if (!isLanguageDetectionResponse(data)) {
                console.warn("[language.detect] Invalid response format, falling back to en-US");
                return this.getFallback();
            }

            return data;
        } catch (error) {
            console.warn("[language.detect] Error, falling back to en-US:", error);
            return this.getFallback();
        } finally {
            clearTimeout(timeout);
        }
    }

    async detectBatch(texts: string[]): Promise<LanguageDetectionResponse[]> {
        if (!this.config.enabled || texts.length === 0) {
            return texts.map(() => this.getFallback());
        }

        return Promise.all(texts.map((text) => this.detect({ text })));
    }

    private getFallback(): LanguageDetectionResponse {
        return {
            lang_code: "en",
            locale: "en-US",
            confidence: 0.0,
            fallback: true,
        };
    }
}

function isLanguageDetectionResponse(value: unknown): value is LanguageDetectionResponse {
    return (
        typeof value === "object" &&
        value !== null &&
        typeof (value as LanguageDetectionResponse).lang_code === "string" &&
        typeof (value as LanguageDetectionResponse).locale === "string" &&
        typeof (value as LanguageDetectionResponse).confidence === "number" &&
        typeof (value as LanguageDetectionResponse).fallback === "boolean"
    );
}