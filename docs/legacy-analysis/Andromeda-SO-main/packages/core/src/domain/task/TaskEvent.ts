export abstract class DomainEvent {
    public readonly occurredOn: Date;
    constructor() {
        this.occurredOn = new Date();
    }
}

export class TaskCreated extends DomainEvent {
    constructor(public readonly taskId: string, public readonly sessionId?: string) {
        super();
    }
}

export class TaskStatusChanged extends DomainEvent {
    constructor(
        public readonly taskId: string,
        public readonly oldStatus: string,
        public readonly newStatus: string
    ) {
        super();
    }
}

export class TaskResultAvailable extends DomainEvent {
    constructor(public readonly taskId: string, public readonly result: any) {
        super();
    }
}

export class AuditParecerAvailable extends DomainEvent {
    constructor(public readonly taskId: string, public readonly parecer: any) {
        super();
    }
}

export class FeedbackSubmitted extends DomainEvent {
    public readonly eventName = "feedback.submitted";

    constructor(
        public readonly taskId: string,
        public readonly agentId: string,
        public readonly userId: string,
        public readonly tenantId: string,
        public readonly rating: number,
    ) {
        super();
    }
}
