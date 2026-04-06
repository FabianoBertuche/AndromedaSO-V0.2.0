export class WsSessionRegistry {
    private static instance: WsSessionRegistry;
    // Map sessionId -> Set of socketIds
    private sessions: Map<string, Set<string>> = new Map();
    // Map socketId -> sessionId
    private sockets: Map<string, string> = new Map();

    private constructor() { }

    public static getInstance(): WsSessionRegistry {
        if (!WsSessionRegistry.instance) {
            WsSessionRegistry.instance = new WsSessionRegistry();
        }
        return WsSessionRegistry.instance;
    }

    public register(socketId: string, sessionId: string): void {
        this.sockets.set(socketId, sessionId);
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, new Set());
        }
        this.sessions.get(sessionId)!.add(socketId);
    }

    public unregister(socketId: string): void {
        const sessionId = this.sockets.get(socketId);
        if (sessionId) {
            const socketSet = this.sessions.get(sessionId);
            if (socketSet) {
                socketSet.delete(socketId);
                if (socketSet.size === 0) {
                    this.sessions.delete(sessionId);
                }
            }
            this.sockets.delete(socketId);
        }
    }

    public getSocketIds(sessionId: string): string[] {
        const socketSet = this.sessions.get(sessionId);
        return socketSet ? Array.from(socketSet) : [];
    }

    public getSessionId(socketId: string): string | undefined {
        return this.sockets.get(socketId);
    }
}

export const globalWsSessionRegistry = WsSessionRegistry.getInstance();
