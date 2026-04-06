export interface RoutingDecisionProfile {
    purpose: "default-chat" | "fast-chat" | "coding" | "auditor" | "vision" | "embedding" | "fallback" | string;
    weights: {
        quality: number;
        latency: number;
        cost: number;
        stability: number;
        capabilityFit: number;
    };
}
