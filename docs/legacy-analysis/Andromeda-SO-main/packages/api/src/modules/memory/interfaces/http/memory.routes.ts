import { Router } from "express";
import { sendError } from "../../../../shared/http/error-response";
import { MemoryService } from "../../application/MemoryService";
import { MemoryEntry, MemoryPolicy } from "../../domain/memory";

export function createMemoryRouter(memoryService: MemoryService): Router {
    const router = Router();

    router.get("/", async (req, res) => {
        try {
            const entries = await memoryService.listMemory({
                type: asMemoryType(req.query.type),
                scopeType: asMemoryScopeType(req.query.scopeType),
                agentId: asString(req.query.agentId),
                sessionId: asString(req.query.sessionId),
                taskId: asString(req.query.taskId),
                projectId: asString(req.query.projectId),
                userId: asString(req.query.userId),
                teamId: asString(req.query.teamId),
                status: asMemoryStatus(req.query.status),
                pinnedOnly: asBoolean(req.query.pinnedOnly),
                q: asString(req.query.q),
                limit: asNumber(req.query.limit),
            });
            res.json(entries);
        } catch (error: any) {
            sendError(req, res, 400, "BAD_REQUEST", error.message || "Failed to list memory");
        }
    });

    router.get("/policies", async (req, res) => {
        try {
            const policies = await memoryService.listPolicies();
            res.json(policies);
        } catch (error: any) {
            sendError(req, res, 400, "BAD_REQUEST", error.message || "Failed to list policies");
        }
    });

    router.put("/policies/:id", async (req, res) => {
        try {
            const existing = await memoryService.getPolicy(req.params.id);
            if (!existing) {
                return sendError(req, res, 404, "NOT_FOUND", "Policy not found");
            }

            const updated = await memoryService.upsertPolicy({
                ...existing,
                ...req.body,
                id: req.params.id,
                updatedAt: new Date(),
            } satisfies MemoryPolicy);
            res.json(updated);
        } catch (error: any) {
            sendError(req, res, 400, "BAD_REQUEST", error.message || "Failed to update policy");
        }
    });

    router.get("/agents/:id/memory", async (req, res) => {
        try {
            const entries = await memoryService.listMemory({ agentId: req.params.id, limit: 50 });
            res.json(entries);
        } catch (error: any) {
            sendError(req, res, 400, "BAD_REQUEST", error.message || "Failed to read agent memory");
        }
    });

    router.get("/sessions/:id/memory", async (req, res) => {
        try {
            const entries = await memoryService.listMemory({ sessionId: req.params.id, limit: 50 });
            res.json(entries);
        } catch (error: any) {
            sendError(req, res, 400, "BAD_REQUEST", error.message || "Failed to read session memory");
        }
    });

    router.get("/tasks/:id/memory", async (req, res) => {
        try {
            const entries = await memoryService.listMemory({ taskId: req.params.id, limit: 50 });
            res.json(entries);
        } catch (error: any) {
            sendError(req, res, 400, "BAD_REQUEST", error.message || "Failed to read task memory");
        }
    });

    router.get("/:id", async (req, res) => {
        try {
            const entry = await memoryService.getMemory(req.params.id);
            if (!entry) {
                return sendError(req, res, 404, "NOT_FOUND", "Memory entry not found");
            }
            res.json(entry);
        } catch (error: any) {
            sendError(req, res, 400, "BAD_REQUEST", error.message || "Failed to read memory entry");
        }
    });

    router.get("/:id/links", async (req, res) => {
        try {
            const links = await memoryService.getMemoryLinks(req.params.id);
            res.json(links);
        } catch (error: any) {
            sendError(req, res, 400, "BAD_REQUEST", error.message || "Failed to list links");
        }
    });

    router.get("/:id/usage", async (req, res) => {
        try {
            const usage = await memoryService.getMemoryUsage(req.params.id);
            res.json(usage);
        } catch (error: any) {
            sendError(req, res, 400, "BAD_REQUEST", error.message || "Failed to list usage");
        }
    });

    router.post("/", async (req, res) => {
        try {
            const type = asString(req.body?.type) as any || "semantic";
            const payload = { ...req.body, type };
            const entry = type === "session"
                ? await memoryService.registerSessionMemory(payload)
                : type === "episodic"
                    ? await memoryService.registerEpisodicMemory(payload)
                    : await memoryService.registerSemanticMemory(payload);
            res.status(201).json(entry);
        } catch (error: any) {
            sendError(req, res, 400, "BAD_REQUEST", error.message || "Failed to create memory entry");
        }
    });

    router.post("/retrieve", async (req, res) => {
        try {
            const result = await memoryService.attachMemoryToExecutionContext(req.body);
            res.json(result);
        } catch (error: any) {
            sendError(req, res, 400, "BAD_REQUEST", error.message || "Failed to retrieve memory");
        }
    });

    router.post("/:id/pin", async (req, res) => {
        try {
            const entry = await memoryService.pinMemory(req.params.id);
            res.json(entry);
        } catch (error: any) {
            sendError(req, res, 400, "BAD_REQUEST", error.message || "Failed to pin memory");
        }
    });

    router.post("/:id/invalidate", async (req, res) => {
        try {
            const entry = await memoryService.invalidateMemory(req.params.id);
            res.json(entry);
        } catch (error: any) {
            sendError(req, res, 400, "BAD_REQUEST", error.message || "Failed to invalidate memory");
        }
    });

    router.post("/:id/promote", async (req, res) => {
        try {
            const entry = await memoryService.promoteMemory(req.params.id, req.body?.targetType || "semantic");
            res.json(entry);
        } catch (error: any) {
            sendError(req, res, 400, "BAD_REQUEST", error.message || "Failed to promote memory");
        }
    });

    router.delete("/:id", async (req, res) => {
        try {
            await memoryService.deleteMemoryEntry(req.params.id);
            res.status(204).send();
        } catch (error: any) {
            sendError(req, res, 400, "BAD_REQUEST", error.message || "Failed to delete memory");
        }
    });

    return router;
}

function asString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function asMemoryType(value: unknown) {
    const parsed = asString(value);
    return parsed === "session" || parsed === "episodic" || parsed === "semantic" ? parsed : undefined;
}

function asMemoryScopeType(value: unknown) {
    const parsed = asString(value);
    return parsed === "session" || parsed === "task" || parsed === "agent" || parsed === "project" || parsed === "user" || parsed === "team"
        ? parsed
        : undefined;
}

function asMemoryStatus(value: unknown) {
    const parsed = asString(value);
    return parsed === "active" || parsed === "archived" || parsed === "invalidated" || parsed === "deleted" ? parsed : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value === "true";
    return undefined;
}

function asNumber(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}
