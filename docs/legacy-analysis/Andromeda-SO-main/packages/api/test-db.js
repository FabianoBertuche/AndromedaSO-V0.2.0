
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");
require("dotenv").config();

async function main() {
    const connectionString = process.env.DATABASE_URL;
    console.log("Testing connection to:", connectionString);

    if (!connectionString) {
        console.error("DATABASE_URL not found!");
        return;
    }

    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        await prisma.$connect();
        console.log("CONNECTED SUCCESS!");
        const res = await prisma.$queryRaw`SELECT 1 as result`;
        console.log("QUERY SUCCESS!", JSON.stringify(res));
    } catch (e) {
        console.error("CONNECTION FAILED!");
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
