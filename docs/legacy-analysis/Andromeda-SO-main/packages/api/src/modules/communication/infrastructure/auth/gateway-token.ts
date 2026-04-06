const DEFAULT_GATEWAY_TOKENS = [
    process.env.GATEWAY_WEB_TOKEN || "andromeda_dev_web_token",
    process.env.GATEWAY_CLI_TOKEN || "andromeda_dev_cli_token",
    process.env.GATEWAY_MOBILE_TOKEN || "andromeda_dev_mobile_token",
    process.env.GATEWAY_LEGACY_TOKEN || "andromeda-secret-token",
];

export function getConfiguredGatewayTokens(): string[] {
    return Array.from(new Set(DEFAULT_GATEWAY_TOKENS.filter(Boolean)));
}

export function parseGatewayToken(value?: string): string | undefined {
    if (!value) {
        return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return undefined;
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) {
        if (["bearer", "basic"].includes(parts[0].toLowerCase())) {
            return undefined;
        }

        return parts[0];
    }

    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
        return parts[1];
    }

    return undefined;
}

export function isAuthorizedGatewayToken(value: string | undefined, allowedTokens = getConfiguredGatewayTokens()): boolean {
    const token = parseGatewayToken(value);
    if (!token) {
        return false;
    }

    return allowedTokens.includes(token);
}
