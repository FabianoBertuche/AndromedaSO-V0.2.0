import { Router } from "express";
import { CreateTask, TaskCreated, globalEventBus } from "@andromeda/core";
import { AssetAwareExecuteTask } from "../../../../infrastructure/execution/AssetAwareExecuteTask";
import { globalTaskRepository } from "../../../../infrastructure/repositories/GlobalRepositories";
import { globalAgentRegistry } from "../../../../presentation/routes/agentRoutes";
import { ReceiveGatewayMessage } from "../../application/use-cases/ReceiveGatewayMessage";
import { ResolveSession } from "../../application/use-cases/ResolveSession";
import { CreateTaskFromMessage } from "../../application/use-cases/CreateTaskFromMessage";
import { GetSession } from "../../application/use-cases/GetSession";
import { ListSessionMessages } from "../../application/use-cases/ListSessionMessages";
import { GetGatewayTaskStatus } from "../../application/use-cases/GetGatewayTaskStatus";
import { BuildSessionTimeline } from "../../application/use-cases/BuildSessionTimeline";
import { BuildTaskTimeline } from "../../application/use-cases/BuildTaskTimeline";
import { WebChannelAdapter } from "../../infrastructure/channels/web/web-channel.adapter";
import { StaticTokenChannelAuthAdapter } from "../../infrastructure/auth/static-token-channel-auth.adapter";
import { globalSessionRepository, globalMessageRepository } from "../../infrastructure/persistence/GlobalCommunicationRepositories";
import { createGatewayAuthMiddleware } from "./middlewares/gateway-auth.middleware";
import { CommunicationController } from "./communication.controller";
import { ObservabilityController } from "./observability.controller";
import { globalWsGateway } from "../websocket/communication.ws-gateway";

import { RestoreSession } from "../../application/use-cases/RestoreSession";

const router = Router();
const restoreSession = new RestoreSession(globalSessionRepository);

const webChannelAdapter = new WebChannelAdapter();
const authAdapter = new StaticTokenChannelAuthAdapter();
const resolveSession = new ResolveSession(globalSessionRepository);
const createTaskUseCase = new CreateTask(globalTaskRepository);
const createTaskFromMessage = new CreateTaskFromMessage(createTaskUseCase);
const executeTaskUseCase = new AssetAwareExecuteTask(globalTaskRepository, globalAgentRegistry);

globalEventBus.subscribe("TaskCreated", async (event: any) => {
    if (event instanceof TaskCreated) {
        if (!event.taskId) return;
        try {
            console.log(`[EventBus] TaskCreated capturado! Auto-executando task ${event.taskId}...`);
            await executeTaskUseCase.execute(event.taskId);
        } catch (error) {
            console.error(`[EventBus] Falha ao auto-executar task ${event.taskId}:`, error);
        }
    }
});

const receiveGatewayMessage = new ReceiveGatewayMessage(
    webChannelAdapter,
    resolveSession,
    globalMessageRepository,
    createTaskFromMessage,
);

globalWsGateway.setReceiveGatewayMessage(receiveGatewayMessage);

const getSession = new GetSession(globalSessionRepository);
const listSessionMessages = new ListSessionMessages(globalMessageRepository);
const getGatewayTaskStatus = new GetGatewayTaskStatus(globalTaskRepository);

const controller = new CommunicationController(
    receiveGatewayMessage,
    getSession,
    listSessionMessages,
    getGatewayTaskStatus,
);

const buildSessionTimeline = new BuildSessionTimeline(globalMessageRepository, globalTaskRepository);
const buildTaskTimeline = new BuildTaskTimeline(globalTaskRepository);
const observabilityController = new ObservabilityController(buildSessionTimeline, buildTaskTimeline);

const authMiddleware = createGatewayAuthMiddleware(authAdapter);

router.post("/message", authMiddleware, (req, res) => controller.handleMessage(req, res));
router.get("/sessions/:id", (req, res) => controller.getSessionById(req, res));
router.get("/sessions/:id/messages", (req, res) => controller.getMessagesBySessionId(req, res));
router.post("/sessions/:id/restore", (req, res) => {
    restoreSession.execute(req.params.id)
        .then(() => res.status(200).json({ success: true }))
        .catch(err => res.status(500).json({ error: err.message }));
});
router.get("/sessions/:id/timeline", (req, res) => observabilityController.getSessionTimeline(req, res));
router.get("/tasks/:taskId/status", (req, res) => controller.getTaskStatus(req, res));
router.get("/tasks/:taskId/timeline", (req, res) => observabilityController.getTaskTimeline(req, res));

export default router;
