import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { sendError } from "./shared/http/error-response";
import { getAllowedConnectSources, isOriginAllowed } from "./shared/http/origin-config";
import { requestContextMiddleware } from "./shared/http/request-context";
import fs from "fs";
import swaggerUi from "swagger-ui-express";
import { apiVersionMiddleware } from "./shared/http/api-version.middleware";

console.log("Initializing Andromeda OS Express App...");

import taskRoutes from "./presentation/routes/taskRoutes";
import skillRoutes from "./presentation/routes/skillRoutes";
import agentAssetRoutes from "./presentation/routes/agentAssetRoutes";
import agentRoutes from "./presentation/routes/agentRoutes";
import { sandboxRouter } from "./modules/sandbox/dependencies";
import { memoryRouter } from "./modules/memory/dependencies";
import communicationRoutes from "./modules/communication/interfaces/http/communication.routes";
import cognitiveRoutes from "./modules/cognitive/interfaces/http/cognitive.routes";
console.log("Importing modelCenterRoutes...");
import modelCenterRoutes from "./modules/model-center/interfaces/http/modelCenter.routes";
console.log("modelCenterRoutes imported!");
import knowledgeRouter from "./modules/knowledge/interfaces/http/knowledge.routes";
import { budgetRouter } from "./modules/budget/dependencies";
import { feedbackRouter } from "./modules/feedback/dependencies";
import { performanceRouter } from "./modules/performance/dependencies";
import { costsRouter } from "./modules/costs/dependencies";
import { playbookSuggestionsRouter } from "./modules/evolution/playbook/dependencies";
import { plannerRouter } from "./modules/planner/dependencies";
import { i18nRouter, userPreferencesRouter } from "./modules/i18n/dependencies";
import { agentPortabilityRouter } from "./modules/agent-portability/interfaces/http/agent-portability.routes";

import { authController } from "./modules/auth/dependencies";
import { createAuthRoutes } from "./modules/auth/interfaces/http/auth.routes";
import { authMiddleware } from "./shared/middleware/auth.middleware";
import { requireRole } from "./shared/middleware/rbac.middleware";
import { globalRateLimiter, authRateLimiter } from "./shared/middleware/rate-limit.middleware";
import { requestIdMiddleware } from "./shared/middleware/request-id.middleware";

const app = express();

app.disable("x-powered-by");
app.use(requestIdMiddleware);
app.use(requestContextMiddleware);

morgan.token("request-id", (_req, res) => (res.getHeader("X-Request-ID") as string | undefined) || "-");

app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(express.json());
// Rotas V1
const v1Router = express.Router();

v1Router.use(globalRateLimiter);
v1Router.use(apiVersionMiddleware(1));
const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, "docs/swagger.json"), "utf8"));
v1Router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

v1Router.use("/auth", authRateLimiter, createAuthRoutes(authController));

import { backupRouter } from "./modules/backup/dependencies";
import { dlqRouter } from "./modules/queue/dependencies";
import { healthRouter } from "./modules/health/dependencies";
import { tenantMiddleware } from "./shared/middleware/tenant.middleware";

v1Router.use("/", healthRouter);
v1Router.use("/tasks", authMiddleware, tenantMiddleware, taskRoutes);
    v1Router.use("/skills", authMiddleware, tenantMiddleware, skillRoutes);
    v1Router.use("/agent-assets", authMiddleware, tenantMiddleware, agentAssetRoutes);
    v1Router.use("/agents", authMiddleware, tenantMiddleware, agentRoutes);
v1Router.use("/sandbox", authMiddleware, tenantMiddleware, sandboxRouter);
v1Router.use("/memory", authMiddleware, tenantMiddleware, memoryRouter);
v1Router.use("/gateway", authMiddleware, tenantMiddleware, communicationRoutes);
v1Router.use("/model-center", authMiddleware, tenantMiddleware, modelCenterRoutes);
v1Router.use("/knowledge", authMiddleware, tenantMiddleware, knowledgeRouter);
v1Router.use("/", authMiddleware, tenantMiddleware, budgetRouter);
v1Router.use("/", authMiddleware, tenantMiddleware, feedbackRouter);
v1Router.use("/agents", authMiddleware, tenantMiddleware, performanceRouter);
v1Router.use("/agents", authMiddleware, tenantMiddleware, playbookSuggestionsRouter);
v1Router.use("/costs", authMiddleware, tenantMiddleware, costsRouter);
v1Router.use("/", authMiddleware, tenantMiddleware, plannerRouter);
v1Router.use("/internal/cognitive", authMiddleware, tenantMiddleware, cognitiveRoutes);
v1Router.use("/backup", authMiddleware, requireRole('owner'), backupRouter);
v1Router.use("/dlq", authMiddleware, requireRole('admin'), dlqRouter);
v1Router.use("/i18n", authMiddleware, tenantMiddleware, i18nRouter);
v1Router.use("/users", authMiddleware, tenantMiddleware, userPreferencesRouter);
v1Router.use("/", authMiddleware, tenantMiddleware, agentPortabilityRouter);

app.use("/v1", v1Router);

app.use("/console", express.static(path.join(__dirname, "modules/communication/interfaces/http/public")));

app.use((error: Error & { status?: number; statusCode?: number }, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) {
        next(error);
        return;
    }

    const status = error.statusCode || error.status || 500;
    const code = status === 403 ? "CORS_FORBIDDEN" : "INTERNAL_SERVER_ERROR";

    console.error(`[HTTP:${res.locals.requestId || "unknown"}]`, error.stack || error.message);
    sendError(req, res, status, code, status === 500 ? "Unexpected server error" : error.message);
});

export default app;
