import { describe, expect, it } from "vitest";
import { WebChannelAdapter } from "../../../../../../../src/modules/communication/infrastructure/channels/web/web-channel.adapter";

describe("WebChannelAdapter", () => {
    it("preserves metadata context from the gateway payload", async () => {
        const adapter = new WebChannelAdapter();

        const normalized = await adapter.normalize({
            channel: "web",
            sender: {
                isAuthenticated: true,
                internalUserId: "user-1",
            },
            session: {
                id: "session-1",
            },
            content: {
                type: "text",
                text: "create task",
            },
            metadata: {
                requestId: "req-1",
                correlationId: "corr-1",
                context: {
                    targetAgentId: "agent-1",
                    targetAgentVersion: "v12",
                    targetTeamId: "team-core",
                    personaProfileId: "persona-balanced",
                    interactionMode: "chat",
                },
            },
        });

        expect(normalized.metadata.context).toEqual({
            targetAgentId: "agent-1",
            targetAgentVersion: "v12",
            targetTeamId: "team-core",
            personaProfileId: "persona-balanced",
            interactionMode: "chat",
        });
        expect(normalized.metadata.requestId).toBe("req-1");
        expect(normalized.metadata.correlationId).toBe("corr-1");
    });
});
