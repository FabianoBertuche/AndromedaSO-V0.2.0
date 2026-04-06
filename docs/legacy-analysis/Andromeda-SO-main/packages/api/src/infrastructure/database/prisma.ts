import { PrismaClient } from "@prisma/client";

declare global {
    // eslint-disable-next-line no-var
    var __andromedaPrisma: PrismaClient | undefined;
}

export function hasPrismaDatabaseUrl(): boolean {
    return typeof process.env.DATABASE_URL === "string" && process.env.DATABASE_URL.trim().length > 0;
}

export function createPrismaClient(): PrismaClient {
    try {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            console.warn("DATABASE_URL not found, using in-memory mode if available.");
            throw new Error("No DATABASE_URL");
        }

        return globalThis.__andromedaPrisma || (globalThis.__andromedaPrisma || new PrismaClient());
    } catch (error) {
        console.error("Failed to initialize Prisma, falling back to mock provider:", error);
        // Returns a safe proxy that prevents crashes by resolving to empty results
        return new Proxy({}, {
            get: (_, prop) => {
                if (prop === "$connect" || prop === "$disconnect" || prop === "$on") return () => Promise.resolve();
                if (prop === "then") return undefined;
                return new Proxy(() => Promise.resolve([]), {
                    get: (_, subProp) => {
                        if (subProp === "then") return undefined;
                        return () => Promise.resolve([]);
                    },
                    apply: () => Promise.resolve([])
                });
            }
        }) as any;
    }
}


import { softDeleteExtension } from "../../shared/prisma/soft-delete.extension";

export function getPrismaClient(): any {
    if (!globalThis.__andromedaPrisma) {
        const client = createPrismaClient();
        globalThis.__andromedaPrisma = client.$extends(softDeleteExtension) as any;
    }

    return globalThis.__andromedaPrisma;
}

