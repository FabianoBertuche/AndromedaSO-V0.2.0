import supertest from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";

function http(target: unknown): any {
    return supertest(target as Parameters<typeof supertest>[0]);
}

describe("API hardening", () => {
    it("returns X-Request-ID on health responses", async () => {
        const response = await http(app).get("/v1/health");

        expect(response.status).toBe(200);
        expect(response.headers["x-request-id"]).toMatch(/[0-9a-f-]{8,}/i);
    });

    it("returns request_id on unauthorized gateway requests", async () => {
        const response = await http(app)
            .post("/v1/gateway/message")
            .send({
                channel: "web",
                sender: {},
                content: {
                    type: "text",
                    text: "ping",
                },
            });

        expect(response.status).toBe(401);
        expect(response.body.error).toBeDefined();
        expect(response.headers["x-request-id"]).toMatch(/[0-9a-f-]{8,}/i);
    });

    it("rejects invalid text payloads before hitting the gateway use case", async () => {
        const response = await http(app)
            .post("/v1/gateway/message")
            .set("Authorization", "Bearer andromeda_dev_web_token")
            .send({
                channel: "web",
                sender: {},
                content: {
                    type: "text",
                    text: "",
                },
            });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
        expect(response.body.error.field).toBe("content.text");
        expect(response.body.error.request_id).toMatch(/[0-9a-f-]{8,}/i);
    });

    it("keeps the API operational when the cognitive service is disabled", async () => {
        const response = await http(app)
            .get("/v1/internal/cognitive/health")
            .set("Authorization", "Bearer andromeda_dev_web_token");

        expect(response.status).toBe(200);
        expect(["disabled", "ok"]).toContain(response.body.status);
        expect(response.body.service).toBe("cognitive-python");
    });

    it("requires auth on protected agent routes", async () => {
        const response = await http(app).get("/v1/agents");

        expect(response.status).toBe(401);
    });

    it("accepts gateway dev token on protected agent routes", async () => {
        const response = await http(app)
            .get("/v1/agents")
            .set("Authorization", "Bearer andromeda_dev_web_token");

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });
});
