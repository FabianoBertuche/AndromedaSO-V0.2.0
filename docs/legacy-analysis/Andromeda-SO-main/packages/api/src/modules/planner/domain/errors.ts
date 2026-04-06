export class PlanCreationError extends Error {
    constructor(message = "Falha ao criar plano") {
        super(message);
        this.name = "PlanCreationError";
    }
}

export class CyclicDependencyError extends Error {
    constructor(stepId: string, dependencyId: string) {
        super(`Ciclo detectado: ${stepId} → ${dependencyId}`);
        this.name = "CyclicDependencyError";
    }
}

export class HandoffRejectedError extends Error {
    constructor(message = "Handoff rejeitado") {
        super(message);
        this.name = "HandoffRejectedError";
    }
}

export class PlanDeadlockError extends Error {
    constructor(message = "Plano em deadlock") {
        super(message);
        this.name = "PlanDeadlockError";
    }
}

export class StepApprovalTimeoutError extends Error {
    constructor(message = "Tempo limite de aprovacao do step excedido") {
        super(message);
        this.name = "StepApprovalTimeoutError";
    }
}

export class PlanStepNotFoundError extends Error {
    constructor(stepId?: string) {
        super(stepId ? `Step nao encontrado: ${stepId}` : "Step nao encontrado");
        this.name = "PlanStepNotFoundError";
    }
}

export class MaxStepsExceededError extends Error {
    constructor(message = "Numero maximo de steps excedido") {
        super(message);
        this.name = "MaxStepsExceededError";
    }
}
