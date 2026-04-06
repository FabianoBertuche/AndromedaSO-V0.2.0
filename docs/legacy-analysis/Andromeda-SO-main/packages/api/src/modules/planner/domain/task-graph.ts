import { CyclicDependencyError } from "./errors";
import { PlanStep } from "./plan-step";

const BLOCKED_STATUSES = new Set(["failed", "rolled_back", "waiting_approval"]);

export class TaskGraph {
    private steps: PlanStep[];

    constructor(steps: PlanStep[]) {
        this.steps = [...steps];
    }

    updateSteps(steps: PlanStep[]): void {
        this.steps = [...steps];
    }

    getReadySteps(): PlanStep[] {
        return this.steps.filter((step) => this.isReady(step));
    }

    validateNoCycles(): void {
        const visited = new Set<string>();
        const stack = new Set<string>();

        for (const step of this.steps) {
            if (!visited.has(step.id)) {
                this.depthFirstValidate(step.id, visited, stack);
            }
        }
    }

    getParallelGroups(): [PlanStep[], PlanStep[]] {
        const readySteps = this.getReadySteps();
        return [
            readySteps.filter((step) => step.canRunParallel),
            readySteps.filter((step) => !step.canRunParallel),
        ];
    }

    isDeadlocked(): boolean {
        const pendingSteps = this.steps.filter((step) => step.status === "pending" || step.status === "waiting_dependency");
        const waitingApprovalSteps = this.steps.filter((step) => step.status === "waiting_approval");
        const allNonTerminal = pendingSteps.length + waitingApprovalSteps.length;
        if (allNonTerminal === 0) {
            return false;
        }

        if (this.getReadySteps().length > 0) {
            return false;
        }

        return pendingSteps.some((step) => this.hasBlockedDependency(step));
    }

    private depthFirstValidate(stepId: string, visited: Set<string>, stack: Set<string>): void {
        visited.add(stepId);
        stack.add(stepId);

        const step = this.findStep(stepId);
        for (const dependencyId of step?.dependsOn || []) {
            if (!visited.has(dependencyId)) {
                this.depthFirstValidate(dependencyId, visited, stack);
                continue;
            }

            if (stack.has(dependencyId)) {
                throw new CyclicDependencyError(stepId, dependencyId);
            }
        }

        stack.delete(stepId);
    }

    private isReady(step: PlanStep): boolean {
        if (step.status !== "pending") {
            return false;
        }

        return step.dependsOn.every((dependencyId) => this.findStep(dependencyId)?.status === "completed");
    }

    private hasBlockedDependency(step: PlanStep): boolean {
        return step.dependsOn.some((dependencyId) => {
            const dependency = this.findStep(dependencyId);
            return dependency ? BLOCKED_STATUSES.has(dependency.status) : false;
        });
    }

    private findStep(stepId: string): PlanStep | undefined {
        return this.steps.find((step) => step.id === stepId);
    }
}
