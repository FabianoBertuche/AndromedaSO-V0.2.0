import { DomainEvent } from "@andromeda/core";

export class MemoryStored extends DomainEvent {
    constructor(
        public readonly memoryEntryId: string,
        public readonly memoryType: string,
        public readonly scopeType: string,
    ) {
        super();
    }
}

export class MemoryRetrieved extends DomainEvent {
    constructor(
        public readonly taskId: string,
        public readonly agentId: string | undefined,
        public readonly sessionId: string | undefined,
        public readonly memoryEntryId: string,
        public readonly retrievalScore: number,
    ) {
        super();
    }
}

export class MemoryPromoted extends DomainEvent {
    constructor(public readonly memoryEntryId: string, public readonly promotedFromId: string, public readonly targetType: string) {
        super();
    }
}

export class MemoryPinned extends DomainEvent {
    constructor(public readonly memoryEntryId: string) {
        super();
    }
}

export class MemoryInvalidated extends DomainEvent {
    constructor(public readonly memoryEntryId: string) {
        super();
    }
}

export class MemoryDeleted extends DomainEvent {
    constructor(public readonly memoryEntryId: string) {
        super();
    }
}

export class MemoryAttachedToExecution extends DomainEvent {
    constructor(
        public readonly taskId: string,
        public readonly agentId: string | undefined,
        public readonly sessionId: string | undefined,
        public readonly memoryEntryIds: string[],
    ) {
        super();
    }
}
