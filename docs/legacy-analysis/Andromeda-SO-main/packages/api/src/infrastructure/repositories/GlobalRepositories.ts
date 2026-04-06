import { InMemoryTaskRepository } from "./InMemoryTaskRepository";
import { InMemoryProviderRepository } from "./InMemoryProviderRepository";
import { InMemoryModelRepository } from "./InMemoryModelRepository";
import { InMemoryBenchmarkRepository } from "./InMemoryBenchmarkRepository";
import { InMemoryRoutingDecisionRepository } from "./InMemoryRoutingDecisionRepository";

export const globalTaskRepository = new InMemoryTaskRepository();
export const globalProviderRepository = new InMemoryProviderRepository();
export const globalModelRepository = new InMemoryModelRepository();
export const globalBenchmarkRepository = new InMemoryBenchmarkRepository();
export const globalRoutingDecisionRepository = new InMemoryRoutingDecisionRepository();
