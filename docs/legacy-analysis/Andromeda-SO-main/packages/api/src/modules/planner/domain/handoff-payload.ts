export interface HandoffPayload {
    planId: string;
    stepId: string;
    fromAgentId: string;
    toAgentId: string;
    taskContext: {
        originalTaskId: string;
        originalGoal: string;
        completedSoFar: string;
        currentObjective: string;
        constraints: string[];
    };
    relevantMemory: {
        episodicEntries: string[];
        semanticFacts: string[];
        knowledgeChunks: string[];
    };
    intermediateResults: Array<{
        stepId: string;
        summary: string;
        artifacts: string[];
    }>;
    continuationInstructions: string;
    expectedOutputFormat: string;
    humanApprovalRequired: boolean;
    deadline?: string;
}

export interface AgentHandoff {
    id: string;
    tenantId: string;
    planId: string;
    stepId: string;
    fromAgentId: string;
    toAgentId: string;
    status: "pending" | "accepted" | "rejected" | "completed";
    payload: HandoffPayload;
    result?: Record<string, unknown> | null;
    rejectedReason?: string | null;
    deletedAt?: Date | null;
    createdAt: Date;
    completedAt?: Date | null;
}
