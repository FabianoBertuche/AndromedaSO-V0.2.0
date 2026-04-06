import { RoutingDecision } from "./RoutingDecision";

export interface IRoutingDecisionRepository {
    save(decision: RoutingDecision): Promise<void>;
    findById(id: string): Promise<RoutingDecision | null>;
    findByTaskId(taskId: string): Promise<RoutingDecision[]>;
    getRecentDecisions(limit: number): Promise<RoutingDecision[]>;
}
