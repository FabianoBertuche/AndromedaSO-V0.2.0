import { Router } from "express";
import { sendError } from "../../../../shared/http/error-response";
import { AgentProfileService } from "../../application/AgentProfileService";
import { RuntimeAgentConversationService } from "../../application/RuntimeAgentConversationService";

export interface AgentManagementRouterDeps {
    profileService: AgentProfileService;
    conversationService: Pick<RuntimeAgentConversationService, "chat">;
}

export function createAgentManagementRouter(deps: AgentManagementRouterDeps): Router {
    const router = Router();
    const { profileService, conversationService } = deps;

    router.get("/", async (_req, res) => {
        const agents = await profileService.listAgents();
        return res.status(200).json(agents);
    });

    router.get("/:id", async (req, res) => {
        try {
            const agent = await profileService.getAgentView(req.params.id);
            return res.status(200).json(agent);
        } catch (error: any) {
            return sendRouteError(req, res, error);
        }
    });

    router.post("/", async (req, res) => {
        try {
            const profile = await profileService.createAgent(req.body);
            return res.status(201).json(profile);
        } catch (error: any) {
            return sendRouteError(req, res, error);
        }
    });

    router.put("/:id", async (req, res) => {
        try {
            const profile = await profileService.updateAgent(req.params.id, req.body);
            return res.status(200).json(profile);
        } catch (error: any) {
            return sendRouteError(req, res, error);
        }
    });

    router.delete("/:id", async (req, res) => {
        try {
            await profileService.deleteAgent(req.params.id);
            return res.status(204).send();
        } catch (error: any) {
            return sendRouteError(req, res, error);
        }
    });

    router.get("/:id/profile", async (req, res) => {
        try {
            const profile = await profileService.getProfile(req.params.id);
            return res.status(200).json(profile);
        } catch (error: any) {
            return sendRouteError(req, res, error);
        }
    });

    router.put("/:id/profile", async (req, res) => {
        try {
            const profile = await profileService.updateProfile(req.params.id, req.body);
            return res.status(200).json(profile);
        } catch (error: any) {
            return sendRouteError(req, res, error);
        }
    });

    router.get("/:id/profile/history", async (req, res) => {
        try {
            const history = await profileService.listHistory(req.params.id);
            return res.status(200).json(history);
        } catch (error: any) {
            return sendRouteError(req, res, error);
        }
    });

    router.post("/:id/profile/restore/:version", async (req, res) => {
        try {
            const profile = await profileService.restoreProfile(req.params.id, req.params.version);
            return res.status(200).json(profile);
        } catch (error: any) {
            return sendRouteError(req, res, error);
        }
    });

    router.get("/:id/behavior", async (req, res) => {
        try {
            const behavior = await profileService.getBehavior(req.params.id);
            return res.status(200).json(behavior);
        } catch (error: any) {
            return sendRouteError(req, res, error);
        }
    });

    router.put("/:id/behavior", async (req, res) => {
        try {
            const behavior = await profileService.updateBehavior(req.params.id, req.body);
            return res.status(200).json(behavior);
        } catch (error: any) {
            return sendRouteError(req, res, error);
        }
    });

    router.get("/:id/safeguards", async (req, res) => {
        try {
            const safeguards = await profileService.getSafeguards(req.params.id);
            return res.status(200).json(safeguards);
        } catch (error: any) {
            return sendRouteError(req, res, error);
        }
    });

    router.put("/:id/safeguards", async (req, res) => {
        try {
            const safeguards = await profileService.updateSafeguards(req.params.id, req.body);
            return res.status(200).json(safeguards);
        } catch (error: any) {
            return sendRouteError(req, res, error);
        }
    });

    router.get("/:id/conformance", async (req, res) => {
        try {
            const conformance = await profileService.getConformance(req.params.id);
            return res.status(200).json(conformance);
        } catch (error: any) {
            return sendRouteError(req, res, error);
        }
    });

    router.post("/:id/chat", async (req, res) => {
        try {
            const result = await conversationService.chat({
                agentId: req.params.id,
                prompt: req.body?.prompt,
                sessionId: req.body?.sessionId,
                modelId: req.body?.modelId,
                interactionMode: req.body?.interactionMode,
            });
            return res.status(200).json(result);
        } catch (error: any) {
            return sendRouteError(req, res, error);
        }
    });

    router.get("/:id/history", async (req, res) => {
        try {
            const history = await profileService.getHistory(req.params.id);
            return res.status(200).json(history);
        } catch (error: any) {
            return sendRouteError(req, res, error);
        }
    });

    router.get("/:id/versions", async (req, res) => {
        try {
            const versions = await profileService.listStoredVersions(req.params.id);
            return res.status(200).json({ agentId: req.params.id, items: versions });
        } catch (error: any) {
            return sendRouteError(req, res, error);
        }
    });

    router.post("/:id/versions/:versionNumber/restore", async (req, res) => {
        try {
            const restored = await profileService.restoreStoredVersion(req.params.id, Number(req.params.versionNumber));
            return res.status(200).json({
                agentId: req.params.id,
                restoredVersionNumber: restored.restoredVersionNumber,
                currentVersionNumber: restored.currentVersionNumber,
                profileVersionLabel: restored.profile.version,
                updatedAt: restored.profile.updatedAt,
            });
        } catch (error: any) {
            return sendRouteError(req, res, error);
        }
    });

    router.get("/:id/test-sessions", async (req, res) => {
        try {
            const sessions = await profileService.getTestSessions(req.params.id);
            return res.status(200).json(sessions);
        } catch (error: any) {
            return sendRouteError(req, res, error);
        }
    });

    return router;
}

function sendRouteError(req: Parameters<typeof sendError>[0], res: Parameters<typeof sendError>[1], error: Error) {
    const message = error.message || "Unexpected agent-management error";
    const status = /not found/i.test(message) ? 404 : /cannot/i.test(message) ? 409 : 400;
    const code = status === 404 ? "NOT_FOUND" : status === 409 ? "CONFLICT" : "BAD_REQUEST";
    return sendError(req, res, status, code, message);
}
