import { Server } from "socket.io";

declare global {
    // eslint-disable-next-line no-var
    var __andromedaIO: Server | undefined;
}

export function getIO(): Server {
    if (!globalThis.__andromedaIO) {
        throw new Error("Socket.IO server not initialized. Call initPlannerIO first.");
    }
    return globalThis.__andromedaIO;
}

export function initPlannerIO(io: Server): void {
    globalThis.__andromedaIO = io;
}

export function emitPlanEvent(eventName: string, payload: Record<string, unknown>): void {
    try {
        const io = getIO();
        io.emit(eventName, payload);
        console.info(`[PlannerEvent] ${eventName}`, payload);
    } catch (error) {
        console.warn(`[PlannerEvent] Failed to emit ${eventName}:`, error);
    }
}
