import "dotenv/config";
import { getPrismaClient } from "./infrastructure/database/prisma";

// Pre-initialize safe Prisma singleton before other modules load
globalThis.__andromedaPrisma = getPrismaClient();

import { createServer } from "http";

import { Server } from "socket.io";
import app from "./app";
import { globalWsGateway } from "./modules/communication/interfaces/websocket/communication.ws-gateway";
import { getAllowedOrigins } from "./shared/http/origin-config";
import { bootstrapI18n } from "./modules/i18n/bootstrap";

const port = process.env.PORT || 5000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: getAllowedOrigins(),
        methods: ["GET", "POST"],
        credentials: true,
    },
});

globalWsGateway.initialize(io);

if (process.env.DATABASE_URL) {
    void bootstrapI18n();
}

httpServer.listen(port, () => {
    console.log(`🚀 Andromeda OS API running on port ${port} (HTTP + WS)`);
});
