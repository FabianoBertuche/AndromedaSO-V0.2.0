import { ChannelAuthPort } from "../../domain/ports/integration.ports";

export class StaticTokenChannelAuthAdapter implements ChannelAuthPort {
    private readonly tokens: Record<string, string | undefined>;

    constructor() {
        this.tokens = {
            web: process.env.GATEWAY_WEB_TOKEN || "andromeda_dev_web_token",
            cli: process.env.GATEWAY_CLI_TOKEN || "andromeda_dev_cli_token",
            mobile: process.env.GATEWAY_MOBILE_TOKEN || "andromeda_dev_mobile_token",
        };
    }

    async authenticate(input: {
        channel: string;
        token?: string;
    }): Promise<{
        authenticated: boolean;
        clientId?: string;
        scopes?: string[];
    }> {
        const expectedToken = this.tokens[input.channel];

        if (!expectedToken || !input.token) {
            return { authenticated: false };
        }

        if (input.token === expectedToken) {
            return {
                authenticated: true,
                clientId: `client_${input.channel}`,
                scopes: ["gateway:message:send"],
            };
        }

        return { authenticated: false };
    }
}
