import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getWebsocketBaseUrl } from "../lib/runtime-config";
import { DEFAULT_WEB_TOKEN, getApiToken, resetApiToken } from "../lib/api-auth";

interface WsContextData {
    socket: Socket | null;
    isConnected: boolean;
    session: any | null;
    activeTask: any | null;
}

const WsContext = createContext<WsContextData>({
    socket: null,
    isConnected: false,
    session: null,
    activeTask: null,
});

export const useWs = () => useContext(WsContext);

export const WsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [session, setSession] = useState<any | null>(null);
    const [activeTask, setActiveTask] = useState<any | null>(null);

    useEffect(() => {
        const attachListeners = (currentSocket: Socket) => {
            currentSocket.on("connect", () => {
                setIsConnected(true);

                const demoSessionId = "session-demo-mvp03";
                currentSocket.emit("session.join", demoSessionId);
                setSession({ sessionId: demoSessionId });
            });

            currentSocket.on("disconnect", () => {
                setIsConnected(false);
            });

            currentSocket.on("gateway.event", (payload) => {
                if (payload.type === "task.updated") {
                    setActiveTask((previous: any) => ({ ...previous, status: payload.status, taskId: payload.taskId }));
                } else if (payload.type === "task.completed") {
                    setActiveTask((previous: any) => ({ ...previous, result: payload.result, taskId: payload.taskId }));
                } else if (payload.type === "task.created") {
                    setActiveTask({ status: "CREATED", taskId: payload.taskId, sessionId: payload.sessionId });
                }
            });
        };

        const connect = (token: string) => io(getWebsocketBaseUrl(), {
            auth: { token },
            transports: ["websocket"]
        });

        let fallbackAttempted = false;
        let newSocket = connect(getApiToken());
        attachListeners(newSocket);

        newSocket.on("connect_error", (error) => {
            console.error("Erro de conexão WS:", error.message);

            if (!fallbackAttempted && /unauthorized/i.test(error.message) && getApiToken() !== DEFAULT_WEB_TOKEN) {
                fallbackAttempted = true;
                resetApiToken();
                newSocket.close();
                newSocket = connect(DEFAULT_WEB_TOKEN);
                attachListeners(newSocket);
                setSocket(newSocket);

                newSocket.on("connect_error", (retryError) => {
                    console.error("Erro de conexão WS:", retryError.message);
                });
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    return (
        <WsContext.Provider value={{ socket, isConnected, session, activeTask }}>
            {children}
        </WsContext.Provider>
    );
};
