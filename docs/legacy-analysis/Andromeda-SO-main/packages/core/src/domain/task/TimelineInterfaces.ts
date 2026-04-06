export interface TimelineEntry {
    type: string;
    timestamp: string;
    description: string;
    metadata: Record<string, any>;
}

export interface SessionTimelineView {
    sessionId: string;
    entries: TimelineEntry[];
}

export interface TaskTimelineView {
    taskId: string;
    entries: TimelineEntry[];
}
