const { io } = require("socket.io-client");

const socket = io("ws://localhost:5000", {
    auth: { token: "andromeda-secret-token" },
    transports: ["websocket"]
});

socket.on("connect", () => {
    console.log("Conectado! Dando trigger no WS Gateway...");
    socket.emit("session.join", "session-demo-mvp03");

    socket.emit("client_message", {
        content: {
            type: "text",
            text: "Injecting test directly"
        }
    });
});

socket.on("gateway.event", (payload) => {
    console.log("-> Evento Recebido:", payload);
    if (payload.type === "task.completed" || payload.type === "task.failed" || payload.type === "domain.event") {
        console.log("Fim da execucao pelo script de teste.");
        process.exit(0);
    }
});

socket.on("disconnect", () => {
    console.log("Desconectado");
});

socket.on("connect_error", (err) => {
    console.log("Connection Error:", err.message);
});

setTimeout(() => {
    console.log("Timeout! O servidor não mandou resposta.");
    process.exit(1);
}, 10000);
