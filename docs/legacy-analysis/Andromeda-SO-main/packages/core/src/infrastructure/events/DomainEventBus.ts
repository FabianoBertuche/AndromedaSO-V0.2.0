import { EventEmitter } from "events";
import { DomainEvent } from "../../domain/task/TaskEvent";

export class DomainEventBus {
    private static instance: DomainEventBus;
    private emitter: EventEmitter;

    private constructor() {
        this.emitter = new EventEmitter();
    }

    public static getInstance(): DomainEventBus {
        if (!DomainEventBus.instance) {
            DomainEventBus.instance = new DomainEventBus();
        }
        return DomainEventBus.instance;
    }

    public publish(event: DomainEvent): void {
        const eventName = event.constructor.name;
        this.emitter.emit(eventName, event);
        const namedEvent = (event as DomainEvent & { eventName?: string }).eventName;
        if (typeof namedEvent === "string" && namedEvent.trim().length > 0) {
            this.emitter.emit(namedEvent, event);
        }
        // Also emit a generic event for global listeners
        this.emitter.emit("domain_event", event);
    }

    public subscribe(eventName: string, handler: (event: any) => void): void {
        this.emitter.on(eventName, handler);
    }

    public subscribeAll(handler: (event: DomainEvent) => void): void {
        this.emitter.on("domain_event", handler);
    }
}

export const globalEventBus = DomainEventBus.getInstance();
