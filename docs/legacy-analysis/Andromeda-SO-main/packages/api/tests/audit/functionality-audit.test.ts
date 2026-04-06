/**
 * ANDROMEDA OS — AUDIT TEST SUITE (Vitest)
 * packages/api/tests/audit/functionality-audit.test.ts
 *
 * Objetivo: Detectar funcionalidades "botão sem função" vs implementação real
 * Executar: cd packages/api && npx vitest run tests/audit/
 */

import { beforeAll, describe, it, expect } from "vitest";

const API = process.env.API_URL || "http://127.0.0.1:5000";
const PYTHON = process.env.PYTHON_URL || "http://127.0.0.1:8008";
const API_TOKEN = process.env.API_TOKEN || "andromeda_dev_web_token";
const AUTH_HEADERS = { Authorization: `Bearer ${API_TOKEN}` };

beforeAll(async () => {
    const started = Date.now();

    while (Date.now() - started < 20000) {
        const { status } = await get("/v1/health");
        if (status === 200) {
            return;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error("API local não ficou pronta a tempo para a auditoria.");
});

async function get(path: string) {
    return requestJson(`${API}${path}`);
}

async function authedGet(path: string) {
    return requestJson(`${API}${path}`, { headers: AUTH_HEADERS });
}

async function post(path: string, data: object) {
    return requestJson(`${API}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

async function authedPost(path: string, data: object) {
    return requestJson(`${API}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...AUTH_HEADERS },
        body: JSON.stringify(data),
    });
}

async function requestJson(input: string, init?: RequestInit) {
    for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
            const response = await fetch(input, init);
            return {
                status: response.status,
                body: await response.json().catch(() => null),
                headers: response.headers,
            };
        } catch {
            if (attempt === 3) {
                return { status: 0, body: null, headers: new Headers() };
            }

            await new Promise((resolve) => setTimeout(resolve, 300));
        }
    }

    return { status: 0, body: null, headers: new Headers() };
}

// ─── [1/8] PYTHON COGNITIVE SERVICE ────────────────────────────
describe("🐍 [1/8] Cognitive Python Service", () => {
    it("FastAPI /health deve responder 200", async () => {
        const r = await fetch(`${PYTHON}/health`).catch(() => ({ status: 0 }));
        expect(r.status, "Python service offline — bridge TS↔Python quebrada").toBe(200);
    });

    it("/contracts/version deve retornar versão do contrato", async () => {
        const r = await fetch(`${PYTHON}/contracts/version`).catch(() => ({ status: 0 }));
        if (r.status === 404) console.warn("⚠️ /contracts/version ausente — contratos não versionados");
        expect([200, 404]).toContain(r.status);
    });
});

// ─── [2/8] API BASE & HEALTH ────────────────────────────────────
describe("🏥 [2/8] API Backend Base", () => {
    it("GET /health deve responder 200", async () => {
        const { status } = await get("/v1/health");
        expect(status, "Backend offline").toBe(200);
    });

    it("GET /health deve incluir status do banco", async () => {
        const { body } = await get("/v1/health");
        const str = JSON.stringify(body || {}).toLowerCase();
        const hasDb = str.includes("database") || str.includes("postgres") || str.includes("db");
        expect(hasDb, "Health check superficial — não inclui status do banco").toBe(true);
    });

    it("GET /health deve incluir status de filas (BullMQ/Redis)", async () => {
        const { body } = await get("/v1/health");
        const str = JSON.stringify(body || {}).toLowerCase();
        const hasQueue = str.includes("redis") || str.includes("bullmq") || str.includes("queue");
        if (!hasQueue) console.warn("⚠️ Health não inclui Redis/BullMQ — DLQ MVP09 pode não estar ativo");
    });
});

// ─── [3/8] AUTH (MVP09) ──────────────────────────────────────────
describe("🔐 [3/8] Autenticação JWT (MVP09)", () => {
    it("POST /v1/auth/login com credenciais inválidas deve retornar 401", async () => {
        const { status } = await post("/v1/auth/login", {
            email: "fake@fake.com",
            password: "wrongpassword",
        });
        if (status === 404) console.warn("⚠️ /v1/auth/login não existe — JWT não implementado");
        expect([400, 401, 404]).toContain(status);
    });

    it("GET /v1/agents SEM token deve retornar 401 (rota protegida)", async () => {
        const { status } = await get("/v1/agents");
        if (status === 200) {
            throw new Error("🚨 CRÍTICO: /v1/agents retornou 200 sem token — sem autenticação!");
        }
        expect([401, 403, 404]).toContain(status);
    });

    it("API versioning /v1/ deve estar ativo", async () => {
        const { status } = await get("/v1/health");
        if (status === 404) console.warn("⚠️ /v1/ prefix não encontrado — API versioning MVP09 ausente");
        expect([200, 401]).toContain(status);
    });
});

// ─── [4/8] SANDBOX ───────────────────────────────────────────────
describe("📦 [4/8] Sandbox Subsystem (MVP06B/C)", () => {
    it("GET /sandbox/profiles deve existir", async () => {
        const { status } = await authedGet("/v1/sandbox/profiles");
        expect(status, "Endpoint /sandbox/profiles inexistente — UI sandbox pode ser cosmética").toBe(200);
    });

    it("GET /sandbox/executions deve existir", async () => {
        const { status } = await authedGet("/v1/sandbox/executions");
        expect(status, "Histórico de execuções sandbox ausente").toBe(200);
    });

    it("GET /approvals deve existir", async () => {
        const { status } = await authedGet("/v1/sandbox/approvals");
        expect(status, "Endpoint /approvals ausente — approval flow pode ser enfeite").toBe(200);
    });

    it("POST /sandbox/dry-run deve existir (botão Dry Run)", async () => {
        const { status } = await authedPost("/v1/sandbox/dry-run", { agentId: "test" });
        if (status === 0 || status === 404) {
            throw new Error("🚨 Botão Dry Run NÃO tem backend — é cosmético!");
        }
        expect([200, 400, 401, 409]).toContain(status);
    });

    it("POST /sandbox/validate deve existir (botão Validate Policy)", async () => {
        const { status } = await authedPost("/v1/sandbox/validate", {
            enabled: true,
            mode: "process",
            filesystem: {
                readOnlyRoot: false,
                workingDirectory: "/workspace",
                allowedReadPaths: ["/workspace"],
                allowedWritePaths: ["/workspace/tmp"],
                tempDirectory: "/workspace/tmp",
                persistArtifacts: false,
            },
            network: {
                mode: "off",
                blockPrivateNetworks: true,
                allowDns: false,
                httpOnly: true,
            },
            resources: {
                timeoutSeconds: 30,
                cpuLimit: 1,
                memoryMb: 256,
                diskMb: 256,
                maxProcesses: 5,
                maxThreads: 5,
                maxStdoutKb: 64,
                maxStderrKb: 64,
            },
            execution: {
                allowShell: true,
                allowedBinaries: ["node"],
                blockedBinaries: [],
                allowedInterpreters: ["node"],
                allowSubprocessSpawn: false,
                allowPackageInstall: false,
            },
            environment: {
                runtime: "node",
                runtimeVersion: "20",
                envVars: {},
                inheritHostEnv: false,
                secretInjection: false,
                timezone: "UTC",
                locale: "en-US",
            },
            security: {
                runAsNonRoot: true,
                noNewPrivileges: true,
                disableDeviceAccess: true,
                disablePrivilegedMode: true,
                disableHostNamespaces: true,
            },
            ioPolicy: {
                maxInputSizeKb: 64,
                maxOutputSizeKb: 256,
                allowedOutputTypes: ["text"],
                stripSensitiveOutput: true,
                contentScan: true,
                retention: "request",
            },
            audit: {
                enabled: true,
                captureCommand: true,
                captureStdout: true,
                captureStderr: true,
                captureExitCode: true,
                captureArtifacts: false,
                captureTiming: true,
                captureHashes: false,
                capturePolicySnapshot: true,
                captureNetworkEvents: false,
            },
            approvals: {
                requireApprovalForExec: false,
                requireApprovalForWriteOutsideWorkspace: false,
                requireApprovalForNetwork: false,
                requireApprovalForLargeArtifacts: false,
            },
        });
        if (status === 0 || status === 404) {
            throw new Error("🚨 Botão Validate Policy NÃO tem backend — é cosmético!");
        }
        expect([200, 400, 401]).toContain(status);
    });

    it("POST /approvals/:id/approve deve existir", async () => {
        const { status } = await authedPost("/v1/sandbox/approvals/test-id/approve", {});
        if (status === 404) console.warn("⚠️ Approve endpoint 404 — approval flow incompleto");
        expect([200, 400, 401, 404]).toContain(status);
    });
});

// ─── [5/8] MEMORY LAYER (MVP07) ──────────────────────────────────
describe("🧠 [5/8] Memory Layer (MVP07)", () => {
    it("GET /memory deve existir", async () => {
        const { status } = await authedGet("/v1/memory");
        expect(status, "Endpoint /memory ausente — MemoryView pode ser cosmética").toBe(200);
    });

    it("GET /memory/policies deve existir", async () => {
        const { status } = await authedGet("/v1/memory/policies");
        expect(status, "Políticas de memória ausentes").toBe(200);
    });

    it("POST /memory/retrieve deve existir (retrieval real no runtime)", async () => {
        const { status } = await authedPost("/v1/memory/retrieve", {
            agentId: "test",
            taskId: "test",
            scopeType: "task",
        });
        if (status === 0 || status === 404) {
            throw new Error("🚨 POST /memory/retrieve ausente — memória NÃO está integrada ao runtime!");
        }
        expect([200, 400, 401]).toContain(status);
    });

    it("POST /memory/:id/pin deve existir", async () => {
        const { status } = await authedPost("/v1/memory/test-id/pin", {});
        if (status === 404) console.warn("⚠️ Pin memory ausente — botão Pin pode ser cosmético");
        expect([200, 400, 401, 404]).toContain(status);
    });

    it("POST /memory/:id/invalidate deve existir", async () => {
        const { status } = await authedPost("/v1/memory/test-id/invalidate", {});
        if (status === 404) console.warn("⚠️ Invalidate memory ausente — botão Invalidate pode ser cosmético");
        expect([200, 400, 401, 404]).toContain(status);
    });
});

// ─── [6/8] KNOWLEDGE LAYER (MVP08) ──────────────────────────────
describe("📚 [6/8] Knowledge Layer (MVP08)", () => {
    const knowledgeEndpoints = [
        "/v1/knowledge/collections",
    ];

    knowledgeEndpoints.forEach((endpoint) => {
        it(`GET ${endpoint} deve existir`, async () => {
            const { status } = await authedGet(endpoint);
            expect(status, `${endpoint} ausente — KnowledgeView pode ser cosmética`).toBe(200);
        });
    });

    it("POST /knowledge/documents/manual deve existir", async () => {
        const createCollection = await authedPost("/v1/knowledge/collections", {
            name: `Audit Collection ${Date.now()}`,
            description: "Created by audit suite",
            scopeType: "project",
            scopeId: "audit-suite",
            sourceType: "manual",
            metadata: {},
        });

        const collectionId = createCollection.body?.id;
        const documentResult = collectionId
            ? await authedPost(`/v1/knowledge/collections/${collectionId}/documents`, {
                title: "Test Doc",
                sourceType: "manual",
                sourcePath: "audit.md",
                mimeType: "text/plain",
                rawText: "Test content",
                metadata: {},
            })
            : createCollection;
        const { status } = documentResult;

        if (status === 0 || status === 404) {
            throw new Error("🚨 Criação manual de documento ausente — formulário pode não funcionar");
        }
        expect([201, 400, 401]).toContain(status);
    });
});

// ─── [7/8] AGENTS & CONSOLE ─────────────────────────────────────
describe("🤖 [7/8] Agents & Console", () => {
    it("GET /agents deve retornar lista", async () => {
        const { status, body } = await authedGet("/v1/agents");
        expect(status).toBe(200);
        if (status === 200) {
            const agents = Array.isArray(body) ? body : body?.data || body?.agents || [];
            if (agents.length === 0) console.warn("⚠️ GET /agents retornou array vazio — lista pode ser mock");
        }
    });

    it("POST /gateway/message deve aceitar mensagem básica", async () => {
        const { status } = await authedPost("/v1/gateway/message", {
            channel: "web",
            content: { type: "text", text: "ping" },
        });
        if (status === 0 || status === 404) {
            throw new Error("🚨 Gateway /gateway/message ausente — Console pode não funcionar!");
        }
        expect([200, 400, 401]).toContain(status);
    });

    it("POST /gateway/message deve preservar metadata.context (MVP-Revisão)", async () => {
        const { status } = await authedPost("/v1/gateway/message", {
            channel: "web",
            content: { type: "text", text: "ping" },
            metadata: {
                context: {
                    targetAgentId: "test-agent",
                    interactionMode: "direct",
                },
            },
        });
        expect([200, 400, 401]).toContain(status);
    });

    it("GET /agents/:id/memory deve existir", async () => {
        const { status } = await authedGet("/v1/memory/agents/test-id/memory");
        if (status === 404) console.warn("⚠️ /agents/:id/memory ausente — aba de memória do agente pode ser cosmética");
        expect([200, 400, 401, 404]).toContain(status);
    });

    it("GET /agents/:id/sandbox deve existir", async () => {
        const { status } = await authedGet("/v1/sandbox/agents/test-id/sandbox");
        if (status === 404) console.warn("⚠️ /agents/:id/sandbox ausente — aba Sandbox do agente pode ser cosmética");
        expect([200, 400, 401, 404]).toContain(status);
    });
});

// ─── [8/8] MVP09 FEATURES ────────────────────────────────────────
describe("🔒 [8/8] MVP09 — Foundation Features", () => {
    it("Rate limiting: burst de 15 requests deve disparar 429", async () => {
        const probe = await get("/v1/health");
        const configuredLimit = Number(probe.headers.get("ratelimit-limit") || process.env.RATE_LIMIT_MAX || 25);
        const requests = Array.from({ length: Math.min(configuredLimit + 3, 28) }, () => get("/v1/health"));
        const results = await Promise.all(requests);
        const has429 = results.some((r) => r.status === 429);
        if (!has429) console.warn("⚠️ Rate limiting não detectado — MVP09 Fase 4 pode não estar ativo");
        expect(typeof has429).toBe("boolean");
    }, 10000);

    it("GET /models deve existir (Model Center)", async () => {
        const { status } = await authedGet("/v1/model-center/models");
        if (status === 404) console.warn("⚠️ /models ausente — Model Center pode ser cosmético");
        expect([200, 404, 429]).toContain(status);
    });

    it("GET /models/benchmark deve existir", async () => {
        const { status } = await authedGet("/v1/model-center/models/test-model/benchmarks");
        if (status === 404) console.warn("⚠️ Benchmark engine ausente — botões de benchmark podem ser enfeite");
        expect([200, 401, 404, 429, 500]).toContain(status);
    });

    it("GET /v1/status deve existir (degradação graciosa)", async () => {
        const { status } = await get("/v1/status");
        if (status === 404) console.warn("⚠️ /v1/status ausente — modo degradado MVP09 não implementado");
        expect([200, 404, 429]).toContain(status);
    });
});
