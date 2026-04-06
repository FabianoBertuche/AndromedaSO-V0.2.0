import { Server, Socket } from "socket.io";
import { globalEventBus } from "@andromeda/core";
import { globalTaskRepository } from "../../../../infrastructure/repositories/GlobalRepositories";
import { parseGatewayToken, isAuthorizedGatewayToken } from "../../infrastructure/auth/gateway-token";
import { resolveGatewayEventEnvelope } from "./gateway-event-router";
import { globalWsSessionRegistry } from "../../infrastructure/websocket/ws-session-registry";

export class CommunicationWsGateway {
    private io: Server | null = null;

    constructor() {
        this.setupEventListeners();
    }

    public initialize(io: Server) {
        this.io = io;
        this.io.use(this.middleware.bind(this));
        this.io.on("connection", this.handleConnection.bind(this));
        console.log("📡 CommunicationWsGateway initialized");
    }

    private middleware(socket: Socket, next: (err?: any) => void) {
        const token = parseGatewayToken(
            (socket.handshake.auth?.token as string | undefined) || socket.handshake.headers?.authorization?.toString()
        );

        if (isAuthorizedGatewayToken(token)) {
            (socket as any).user = { clientId: "web-console", scopes: ["admin"] };
            return next();
        }

        console.warn("❌ WS Connection rejected: Unauthorized");
        return next(new Error("Unauthorized"));
    }

    private receiveGatewayMessage?: any;

    public setReceiveGatewayMessage(useCase: any) {
        this.receiveGatewayMessage = useCase;
    }

    private async handleConnection(socket: Socket) {
        let currentSessionId = socket.handshake.query.sessionId as string;

        if (currentSessionId) {
            globalWsSessionRegistry.register(socket.id, currentSessionId);
            socket.join(`session:${currentSessionId}`);
            console.log(`🔌 WS Connected: Socket ${socket.id} joined session ${currentSessionId}`);
        } else {
            console.log(`🔌 WS Connected: Socket ${socket.id} (no session)`);
        }

        socket.on("disconnect", () => {
            globalWsSessionRegistry.unregister(socket.id);
            console.log(`🔌 WS Disconnected: Socket ${socket.id}`);
        });

        // Event for joining a session manually
        socket.on("session.join", (id: string) => {
            if (id) {
                currentSessionId = id;
                globalWsSessionRegistry.register(socket.id, id);
                socket.join(`session:${id}`);
                console.log(`🔌 Socket ${socket.id} explicitly joined session ${id}`);
            }
        });

        // Event for receiving messages from web console
        socket.on("client_message", async (payload: any) => {
            if (this.receiveGatewayMessage) {
                try {
                    const request = {
                        channel: "web",
                        session: { id: currentSessionId },
                        ...payload
                    };
                    const auth = (socket as any).user || { clientId: "web-console", scopes: [] };

                    await this.receiveGatewayMessage.execute(request, auth);
                } catch (error) {
                    console.error("❌ WS client_message Error:", error);
                }
            } else {
                console.warn("⚠️ receiveGatewayMessage not injected in WS Gateway!");
            }
        });
    }

    private setupEventListeners() {
        globalEventBus.subscribeAll((event) => {
            void this.dispatchEvent(event);
        });
    }

    private async dispatchEvent(event: unknown) {
        if (!this.io) {
            return;
        }

        const normalizedEvent = await resolveGatewayEventEnvelope(event, globalTaskRepository);
        if (!normalizedEvent) {
            return;
        }

        if (normalizedEvent.sessionId) {
            this.io.to(`session:${normalizedEvent.sessionId}`).emit("gateway.event", normalizedEvent);
            return;
        }

        this.io.emit("gateway.event", normalizedEvent);
    }
}

export const globalWsGateway = new CommunicationWsGateway();
