import axios from "axios";
import { PrismaClient } from "@prisma/client";

async function verify() {
    const url = "http://localhost:5000/gateway/message";
    const token = "andromeda_dev_web_token";

    console.log("Enviando mensagem de teste...");
    try {
        const response = await axios.post(url, {
            channel: "web",
            sender: { displayName: "Verification Script" },
            content: { type: "text", text: "Integracao Andromeda MVP02 completa!" }
        }, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        console.log("Resposta do Gateway:", JSON.stringify(response.data, null, 2));

        const prisma = new PrismaClient();
        console.log("Verificando persistencia no banco de dados...");
        const messages = await prisma.communicationMessage.findMany({
            where: { content: { path: ["text"], equals: "Integracao Andromeda MVP02 completa!" } }
        });

        if (messages.length > 0) {
            console.log("SUCESSO: Mensagem encontrada no banco!");
        } else {
            console.log("AVISO: Mensagem nao encontrada no banco. Eh possivel que a sessao nao tenha sido persistida corretamente.");
        }

        await prisma.$disconnect();
    } catch (error) {
        console.error("ERRO na verificacao:", error.response?.data || error.message);
    }
}

verify();
