import { describe, expect, it } from "vitest";
import { loadCognitiveServiceConfig } from "../../../../../src/modules/cognitive/infrastructure/cognitive-service.config";

describe("loadCognitiveServiceConfig", () => {
    it("keeps the cognitive service disabled by default", () => {
        const config = loadCognitiveServiceConfig({});

        expect(config.enabled).toBe(false);
        expect(config.baseUrl).toBe("http://127.0.0.1:8008");
        expect(config.timeoutMs).toBe(1500);
        expect(config.retryCount).toBe(1);
    });

    it("applies environment overrides safely", () => {
        const config = loadCognitiveServiceConfig({
            COGNITIVE_SERVICE_ENABLED: "true",
            COGNITIVE_SERVICE_URL: "http://cognitive.internal:9010",
            COGNITIVE_SERVICE_TIMEOUT_MS: "3200",
            COGNITIVE_SERVICE_RETRY_COUNT: "3",
            COGNITIVE_SERVICE_AUTH_TOKEN: "shared-secret",
        });

        expect(config).toMatchObject({
            enabled: true,
            baseUrl: "http://cognitive.internal:9010",
            timeoutMs: 3200,
            retryCount: 3,
            authToken: "shared-secret",
        });
    });
});
