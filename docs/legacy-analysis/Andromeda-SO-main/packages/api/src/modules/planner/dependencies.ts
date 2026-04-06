import { getPrismaClient } from "../../infrastructure/database/prisma";
import { agentProfileService } from "../agent-management/dependencies";
import { CreateExecutionPlanUseCase } from "./application/use-cases/CreateExecutionPlanUseCase";
import { ExecutePlanUseCase } from "./application/use-cases/ExecutePlanUseCase";
import { ApprovePlanStepUseCase } from "./application/use-cases/ApprovePlanStepUseCase";
import { RollbackPlanUseCase } from "./application/use-cases/RollbackPlanUseCase";
import { ListPlansUseCase } from "./application/use-cases/ListPlansUseCase";
import { GetPlanUseCase } from "./application/use-cases/GetPlanUseCase";
import { PlannerAgentRepository } from "./infrastructure/PlannerAgentRepository";
import { PlannerAuditService } from "./infrastructure/PlannerAuditService";
import { PlannerLlmRouter } from "./infrastructure/PlannerLlmRouter";
import { PrismaExecutionPlanRepository } from "./infrastructure/persistence/PrismaExecutionPlanRepository";
import { PrismaPlanStepRepository } from "./infrastructure/persistence/PrismaPlanStepRepository";
import { PrismaAgentHandoffRepository } from "./infrastructure/persistence/PrismaAgentHandoffRepository";
import { PlannerController } from "./interfaces/http/PlannerController";
import { createPlannerRouter } from "./interfaces/http/planner.routes";
import { ExecutePlanStepJob } from "./infrastructure/ExecutePlanStepJob";
import { PlannerQueueAdapter } from "./infrastructure/PlannerQueueAdapter";
import { PlannerEventEmitterAdapter } from "./infrastructure/PlannerEventEmitterAdapter";
import { TaskExecutionPortAdapter } from "./infrastructure/TaskExecutionPortAdapter";

const prisma = getPrismaClient();

export const executionPlanRepository = new PrismaExecutionPlanRepository(prisma);
export const planStepRepository = new PrismaPlanStepRepository(prisma);
export const agentHandoffRepository = new PrismaAgentHandoffRepository(prisma);
export const plannerAgentRepository = new PlannerAgentRepository(agentProfileService);
export const plannerLlmRouter = new PlannerLlmRouter();
export const plannerAuditService = new PlannerAuditService(prisma);

export const taskExecutionPort = new TaskExecutionPortAdapter();
export const plannerEventEmitter = new PlannerEventEmitterAdapter();

const executePlanStepJob = new ExecutePlanStepJob(
    planStepRepository,
    agentHandoffRepository,
    taskExecutionPort,
    executionPlanRepository,
    plannerAuditService,
);
export const plannerQueue = new PlannerQueueAdapter(executePlanStepJob);

export const createExecutionPlanUseCase = new CreateExecutionPlanUseCase(
    executionPlanRepository,
    planStepRepository,
    plannerAgentRepository,
    plannerLlmRouter,
    plannerAuditService,
);

export const executePlanUseCase = new ExecutePlanUseCase(
    executionPlanRepository,
    planStepRepository,
    plannerQueue,
    plannerEventEmitter,
);

export const approvePlanStepUseCase = new ApprovePlanStepUseCase(
    planStepRepository,
    plannerAuditService,
);

export const rollbackPlanUseCase = new RollbackPlanUseCase(
    executionPlanRepository,
    planStepRepository,
    plannerQueue,
    plannerEventEmitter,
    plannerAuditService,
);

export const listPlansUseCase = new ListPlansUseCase(executionPlanRepository);

export const getPlanUseCase = new GetPlanUseCase(
    executionPlanRepository,
    planStepRepository,
);

const plannerController = new PlannerController(createExecutionPlanUseCase, executePlanUseCase, approvePlanStepUseCase, rollbackPlanUseCase, getPlanUseCase, listPlansUseCase);

export const plannerRouter = createPlannerRouter(plannerController);
