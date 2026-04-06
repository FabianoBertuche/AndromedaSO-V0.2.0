import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../packages/api/.env") });

async function main() {
    console.log("DATABASE_URL:", process.env.DATABASE_URL);

    try {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) throw new Error("No DATABASE_URL");

        const pool = new pg.Pool({ connectionString });
        const adapter = new PrismaPg(pool);
        const prisma = new PrismaClient({ adapter });

        console.log("Connectando ao Prisma...");
        await prisma.$connect();
        console.log("Conectado!");

        const sessions = await prisma.communicationSession.findMany();
        console.log("Sessions found:", sessions.length);

        await prisma.$disconnect();
    } catch (error) {
        console.error("ERRO:", error);
    }
}

main();
