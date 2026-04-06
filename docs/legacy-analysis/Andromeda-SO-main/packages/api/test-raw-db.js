
const { Client } = require("pg");
require("dotenv").config();

async function main() {
    const connectionString = process.env.DATABASE_URL;
    console.log("Testing RAW connection to:", connectionString);

    if (!connectionString) {
        console.error("DATABASE_URL not found!");
        return;
    }

    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log("RAW CONNECTED SUCCESS!");
        const res = await client.query('SELECT 1 as result');
        console.log("RAW QUERY SUCCESS!", JSON.stringify(res.rows));
    } catch (e) {
        console.error("RAW CONNECTION FAILED!");
        console.error(e);
    } finally {
        await client.end();
    }
}

main();
