export interface CognitiveServiceConfig {
    enabled: boolean;
    baseUrl: string;
    timeoutMs: number;
    retryCount: number;
    authToken?: string;
    serviceName: string;
    serviceVersion: string;
}

const DEFAULT_BASE_URL = "http://127.0.0.1:8008";
const DEFAULT_TIMEOUT_MS = 1500;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_SERVICE_NAME = "cognitive-python";
const DEFAULT_SERVICE_VERSION = "0.1.0";

export function loadCognitiveServiceConfig(
    env: Record<string, string | undefined> = process.env
): CognitiveServiceConfig {
    const explicitEnabled = parseBoolean(env.COGNITIVE_SERVICE_ENABLED);
    const baseUrl = normalizeBaseUrl(env.COGNITIVE_SERVICE_URL || DEFAULT_BASE_URL);

    return {
        enabled: explicitEnabled ?? Boolean(env.COGNITIVE_SERVICE_URL && env.COGNITIVE_SERVICE_URL.trim()),
        baseUrl,
        timeoutMs: parsePositiveInteger(env.COGNITIVE_SERVICE_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
        retryCount: parseNonNegativeInteger(env.COGNITIVE_SERVICE_RETRY_COUNT, DEFAULT_RETRY_COUNT),
        authToken: normalizeOptional(env.COGNITIVE_SERVICE_AUTH_TOKEN),
        serviceName: DEFAULT_SERVICE_NAME,
        serviceVersion: DEFAULT_SERVICE_VERSION,
    };
}

function parseBoolean(value?: string): boolean | undefined {
    if (value === undefined) {
        return undefined;
    }

    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) {
        return true;
    }
    if (["0", "false", "no", "off"].includes(normalized)) {
        return false;
    }

    return undefined;
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
}

function parseNonNegativeInteger(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : fallback;
}

function normalizeBaseUrl(value: string): string {
    return value.trim().replace(/\/+$/, "");
}

function normalizeOptional(value?: string): string | undefined {
    if (!value) {
        return undefined;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
}
