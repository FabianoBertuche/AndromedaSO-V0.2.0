import {
    RegisterProviderUseCase,
    SyncModelsUseCase,
    PullModelUseCase,
    DeleteModelUseCase,
    ShowModelInfoUseCase,
    ListRunningModelsUseCase,
    CreateModelUseCase,
    CopyModelUseCase,
    RouteTaskUseCase,
    RunBenchmarkUseCase
} from "@andromeda/core";
import {
    globalProviderRepository,
    globalModelRepository,
    globalBenchmarkRepository,
    globalRoutingDecisionRepository
} from "../../infrastructure/repositories/GlobalRepositories";
import { OllamaProviderAdapter } from "../../infrastructure/adapters/providers/OllamaProviderAdapter";
import { FileModelPricingRegistry } from "./infrastructure/FileModelPricingRegistry";
import { FileRoutingProfileRepository } from "./infrastructure/FileRoutingProfileRepository";

export const pricingRegistry = new FileModelPricingRegistry();
export const routingProfileRepository = new FileRoutingProfileRepository();
const ollamaAdapter = new OllamaProviderAdapter(pricingRegistry);

export const registerProviderUseCase = new RegisterProviderUseCase(globalProviderRepository);
export const syncModelsUseCase = new SyncModelsUseCase(globalProviderRepository, globalModelRepository, ollamaAdapter);
export const pullModelUseCase = new PullModelUseCase(globalProviderRepository, globalModelRepository, ollamaAdapter);
export const deleteModelUseCase = new DeleteModelUseCase(globalProviderRepository, globalModelRepository, ollamaAdapter);
export const showModelInfoUseCase = new ShowModelInfoUseCase(globalProviderRepository, ollamaAdapter);
export const listRunningModelsUseCase = new ListRunningModelsUseCase(globalProviderRepository, ollamaAdapter);
export const createModelUseCase = new CreateModelUseCase(globalProviderRepository, ollamaAdapter);
export const copyModelUseCase = new CopyModelUseCase(globalProviderRepository, ollamaAdapter);

export const routeTaskUseCase = new RouteTaskUseCase(
    globalModelRepository,
    globalRoutingDecisionRepository,
    routingProfileRepository
);
export const runBenchmarkUseCase = new RunBenchmarkUseCase(
    globalBenchmarkRepository,
    globalModelRepository,
    globalProviderRepository,
    ollamaAdapter
);
