import { describe, expect, it } from "vitest";
import { createSandboxConfig } from "../../../../src/modules/sandbox/domain/types";
import { ProcessSandboxRunner } from "../../../../src/modules/sandbox/infrastructure/ProcessSandboxRunner";

describe("ProcessSandboxRunner", () => {
    it("executes a command and captures stdout", async () => {
        const runner = new ProcessSandboxRunner();
        const result = await runner.run({
            executionId: "exec-1",
            command: [process.execPath, "-e", "console.log('sandbox-ok')"],
            policy: createSandboxConfig("process"),
            workingDirectory: process.cwd(),
            env: {},
            timeoutSeconds: 5,
        });

        expect(result.status).toBe("completed");
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("sandbox-ok");
    });
});
