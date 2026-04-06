import { globalTaskRepository } from "../../infrastructure/repositories/GlobalRepositories";
import { getPrismaClient } from "../../infrastructure/database/prisma";
import { GetFeedbackByTaskUseCase } from "./application/use-cases/GetFeedbackByTaskUseCase";
import { SubmitTaskFeedbackUseCase } from "./application/use-cases/SubmitTaskFeedbackUseCase";
import { PrismaFeedbackRepository } from "./infrastructure/PrismaFeedbackRepository";
import { FeedbackController } from "./interfaces/http/FeedbackController";
import { createFeedbackRouter } from "./interfaces/http/feedback.routes";

const prisma = getPrismaClient();

export const feedbackRepository = new PrismaFeedbackRepository(prisma);
export const submitTaskFeedbackUseCase = new SubmitTaskFeedbackUseCase(feedbackRepository, globalTaskRepository);
export const getFeedbackByTaskUseCase = new GetFeedbackByTaskUseCase(feedbackRepository);

const feedbackController = new FeedbackController(submitTaskFeedbackUseCase, getFeedbackByTaskUseCase);

export const feedbackRouter = createFeedbackRouter(feedbackController);
