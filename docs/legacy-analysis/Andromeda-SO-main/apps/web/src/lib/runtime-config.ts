const DEFAULT_API_PORT = "5000";
const DEFAULT_API_HOST = "127.0.0.1";

export function getApiBaseUrl(): string {
    const configured = readEnv("VITE_API_BASE_URL");
    const base = configured ? stripTrailingSlash(configured) : getFallbackBaseUrl();
    return `${base}/v1`;
}

export function getWebsocketBaseUrl(): string {
    const configured = readEnv("VITE_WS_BASE_URL");
    return configured ? stripTrailingSlash(configured) : getFallbackBaseUrl();
}

function getFallbackBaseUrl(): string {
    if (isBrowser()) {
        const { protocol, port } = window.location;
        const resolvedPort = port === "5173" || port === "5174" ? DEFAULT_API_PORT : (port || DEFAULT_API_PORT);
        return `${protocol}//${DEFAULT_API_HOST}:${resolvedPort}`;
    }
    return `http://${DEFAULT_API_HOST}:${DEFAULT_API_PORT}`;
}

function readEnv(name: "VITE_API_BASE_URL" | "VITE_WS_BASE_URL"): string | undefined {
    const value = import.meta.env[name];
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function isBrowser(): boolean {
    return typeof window !== "undefined";
}

function stripTrailingSlash(value: string): string {
    return value.replace(/\/+$/, "");
}
