#!/usr/bin/env npx ts-node
import "reflect-metadata";
import "../src/modules/agent-management/infrastructure/AgentMigrationService";
import { PrismaAgentProfileRepository } from "../src/modules/agent-management/infrastructure/PrismaAgentProfileRepository";
import { AgentMigrationService } from "../src/modules/agent-management/infrastructure/AgentMigrationService";
import { getPrismaClient } from "../src/infrastructure/database/prisma";

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes("--dry-run");
    const createBackup = args.includes("--backup");
    const sourceDirArg = args.find((arg) => arg.startsWith("--source-dir="));
    const sourceDir = sourceDirArg ? sourceDirArg.split("=")[1] : undefined;

    console.log("=== Agent Migration: Filesystem → Database ===");
    console.log("");

    if (dryRun) {
        console.log("DRY RUN MODE: No changes will be made to the database.");
        console.log("");
    }

    const prisma = getPrismaClient();
    const repo = new PrismaAgentProfileRepository(prisma);
    const service = new AgentMigrationService(repo, sourceDir);

    try {
        const result = await service.migrate({
            sourceDir,
            dryRun,
            createBackup,
        });

        console.log("");
        console.log("=== Migration Summary ===");
        console.log(`Total agents found: ${result.totalAgents}`);
        console.log(`Migrated: ${result.migrated.length}`);
        console.log(`Skipped: ${result.skipped.length}`);
        console.log(`Errors: ${result.errors.length}`);

        if (result.migrated.length > 0) {
            console.log("");
            console.log("Migrated agents:");
            for (const id of result.migrated) {
                console.log(`  - ${id}`);
            }
        }

        if (result.skipped.length > 0) {
            console.log("");
            console.log("Skipped agents:");
            for (const id of result.skipped) {
                console.log(`  - ${id}`);
            }
        }

        if (result.errors.length > 0) {
            console.log("");
            console.log("Errors:");
            for (const error of result.errors) {
                console.log(`  - ${error.agentId}: ${error.error}`);
            }
        }

        if (dryRun) {
            console.log("");
            console.log("DRY RUN COMPLETE: Run without --dry-run to apply changes.");
        } else if (result.migrated.length > 0) {
            console.log("");
            console.log("Migration complete. You can now remove the .agent/agents/ directory if desired.");
        }

        process.exit(result.errors.length > 0 ? 1 : 0);
    } catch (error: any) {
        console.error("Migration failed:", error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();