import { describe, expect, it } from "vitest";
import { isAuthorizedGatewayToken, parseGatewayToken } from "../../../../../../src/modules/communication/infrastructure/auth/gateway-token";

describe("gateway-token", () => {
    it("parses raw tokens", () => {
        expect(parseGatewayToken("andromeda_dev_web_token")).toBe("andromeda_dev_web_token");
    });

    it("parses bearer tokens", () => {
        expect(parseGatewayToken("Bearer andromeda_dev_web_token")).toBe("andromeda_dev_web_token");
    });

    it("rejects malformed authorization headers", () => {
        expect(parseGatewayToken("Bearer")).toBeUndefined();
        expect(parseGatewayToken("Basic abc123")).toBeUndefined();
    });

    it("authorizes only configured tokens", () => {
        expect(isAuthorizedGatewayToken("Bearer andromeda_dev_web_token", ["andromeda_dev_web_token"])).toBe(true);
        expect(isAuthorizedGatewayToken("Bearer wrong-token", ["andromeda_dev_web_token"])).toBe(false);
    });
});
