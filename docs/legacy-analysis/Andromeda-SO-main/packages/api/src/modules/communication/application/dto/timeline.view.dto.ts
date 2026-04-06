import { DomainEvent } from "@andromeda/core";

export interface TimelineEntry {
    type: string;
    timestamp: string;
    summary: string;
    details: Record<string, any>;
}

export interface SessionTimelineView {
    sessionId: string;
    entries: TimelineEntry[];
}

export interface TaskTimelineView {
    taskId: string;
    entries: TimelineEntry[];
}
