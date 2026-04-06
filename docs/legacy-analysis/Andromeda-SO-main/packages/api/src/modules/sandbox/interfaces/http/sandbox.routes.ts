import { Request, Router } from "express";
import { sendError } from "../../../../shared/http/error-response";
import { SandboxService } from "../../application/SandboxService";

export function createSandboxRouter(service: SandboxService): Router {
    const router = Router();

    router.get("/profiles", async (_req, res) => {
        try {
            const profiles = await service.listProfiles();
            res.status(200).json(profiles);
        } catch (error: any) {
            sendRouteError(_req, res, error);
        }
    });

    router.post("/profiles", async (req, res) => {
        try {
            const profile = await service.createProfile(req.body);
            res.status(201).json(profile);
        } catch (error: any) {
            sendRouteError(req, res, error);
        }
    });

    router.get("/profiles/:id", async (req, res) => {
        try {
            const profile = await service.getProfile(req.params.id);
            res.status(200).json(profile);
        } catch (error: any) {
            sendRouteError(req, res, error);
        }
    });

    router.put("/profiles/:id", async (req, res) => {
        try {
            const profile = await service.updateProfile(req.params.id, req.body);
            res.status(200).json(profile);
        } catch (error: any) {
            sendRouteError(req, res, error);
        }
    });

    router.delete("/profiles/:id", async (req, res) => {
        try {
            await service.deleteProfile(req.params.id);
            res.status(204).send();
        } catch (error: any) {
            sendRouteError(req, res, error);
        }
    });

    router.get("/agents/:id/sandbox", async (req, res) => {
        try {
            const config = await service.getAgentSandboxConfig(req.params.id);
            res.status(200).json(config);
        } catch (error: any) {
            sendRouteError(req, res, error);
        }
    });

    router.put("/agents/:id/sandbox", async (req, res) => {
        try {
            const config = await service.updateAgentSandboxConfig(req.params.id, req.body);
            res.status(200).json(config);
        } catch (error: any) {
            sendRouteError(req, res, error);
        }
    });

    router.post("/validate", async (req, res) => {
        const result = service.validate(req.body);
        res.status(result.valid ? 200 : 400).json(result);
    });

    router.post("/dry-run", async (req, res) => {
        try {
            const result = await service.dryRun(req.body);
            res.status(200).json(result);
        } catch (error: any) {
            sendRouteError(req, res, error);
        }
    });

    router.post("/executions", async (req, res) => {
        try {
            const result = await service.startExecution(req.body);
            res.status(201).json(result);
        } catch (error: any) {
            sendRouteError(req, res, error);
        }
    });

    router.get("/executions", async (_req, res) => {
        try {
            const executions = await service.listExecutions();
            res.status(200).json(executions);
        } catch (error: any) {
            sendRouteError(_req, res, error);
        }
    });

    router.get("/executions/:id", async (req, res) => {
        try {
            const execution = await service.getExecution(req.params.id);
            res.status(200).json(execution);
        } catch (error: any) {
            sendRouteError(req, res, error);
        }
    });

    router.get("/executions/:id/logs", async (req, res) => {
        try {
            const logs = await service.getExecutionLogs(req.params.id);
            res.status(200).json(logs);
        } catch (error: any) {
            sendRouteError(req, res, error);
        }
    });

    router.get("/executions/:id/artifacts", async (req, res) => {
        try {
            const artifacts = await service.listArtifacts(req.params.id);
            res.status(200).json(artifacts);
        } catch (error: any) {
            sendRouteError(req, res, error);
        }
    });

    router.post("/executions/:id/cancel", async (req, res) => {
        try {
            const execution = await service.cancelExecution(req.params.id);
            res.status(200).json(execution);
        } catch (error: any) {
            sendRouteError(req, res, error);
        }
    });

    router.get("/approvals", async (_req, res) => {
        try {
            const approvals = await service.listApprovals();
            res.status(200).json(approvals);
        } catch (error: any) {
            sendRouteError(_req, res, error);
        }
    });

    router.post("/approvals/:id/approve", async (req, res) => {
        try {
            const approval = await service.approve(req.params.id, req.body?.approvedBy);
            res.status(200).json(approval);
        } catch (error: any) {
            sendRouteError(req, res, error);
        }
    });

    router.post("/approvals/:id/reject", async (req, res) => {
        try {
            const approval = await service.reject(req.params.id, req.body?.rejectedBy);
            res.status(200).json(approval);
        } catch (error: any) {
            sendRouteError(req, res, error);
        }
    });

    return router;
}

function sendRouteError(req: Request, res: Parameters<typeof sendError>[1], error: Error) {
    const message = error.message || "Unexpected sandbox error";
    const status = /not found/i.test(message) ? 404 : /cannot/i.test(message) ? 409 : 400;
    const code = status === 404 ? "NOT_FOUND" : status === 409 ? "CONFLICT" : "BAD_REQUEST";
    return sendError(req, res, status, code, message);
}
