const DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5005",
    "http://127.0.0.1:5005",
];

export function getAllowedOrigins(): string[] {
    const envOrigins = parseCsv(process.env.ALLOWED_ORIGINS);

    return Array.from(new Set(
        envOrigins.length > 0 ? envOrigins : DEFAULT_ALLOWED_ORIGINS
    ));
}

export function getAllowedConnectSources(): string[] {
    const origins = getAllowedOrigins();
    const websocketOrigins = origins
        .filter(origin => origin.startsWith("http://") || origin.startsWith("https://"))
        .map(origin => origin.replace(/^http/, "ws"));

    return Array.from(new Set(["'self'", ...origins, ...websocketOrigins]));
}

export function isOriginAllowed(origin?: string): boolean {
    if (!origin) {
        return true;
    }

    return getAllowedOrigins().includes(origin);
}

function parseCsv(value?: string): string[] {
    if (!value) {
        return [];
    }

    return value
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
}
