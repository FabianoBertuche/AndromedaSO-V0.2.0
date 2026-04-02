import { z } from 'zod';
export declare const lifecycleStateSchema: z.ZodEnum<["discovered", "registered", "validated", "loaded", "initialized", "running", "stopped", "failed"]>;
export type LifecycleState = z.infer<typeof lifecycleStateSchema>;
export declare const lifecycleTransitionSchema: z.ZodObject<{
    from: z.ZodEnum<["discovered", "registered", "validated", "loaded", "initialized", "running", "stopped", "failed"]>;
    to: z.ZodEnum<["discovered", "registered", "validated", "loaded", "initialized", "running", "stopped", "failed"]>;
}, "strip", z.ZodTypeAny, {
    from: "discovered" | "registered" | "validated" | "loaded" | "initialized" | "running" | "stopped" | "failed";
    to: "discovered" | "registered" | "validated" | "loaded" | "initialized" | "running" | "stopped" | "failed";
}, {
    from: "discovered" | "registered" | "validated" | "loaded" | "initialized" | "running" | "stopped" | "failed";
    to: "discovered" | "registered" | "validated" | "loaded" | "initialized" | "running" | "stopped" | "failed";
}>;
export type LifecycleTransition = z.infer<typeof lifecycleTransitionSchema>;
export declare function canTransition(from: LifecycleState, to: LifecycleState): boolean;
export declare function assertTransition(from: LifecycleState, to: LifecycleState): boolean;
