import { spawn } from "node:child_process";
import { SandboxConfig, SandboxExecution, SandboxExecutionStatus } from "../domain/types";

export interface SandboxRunnerInput {
    executionId: string;
    command: string[];
    policy: SandboxConfig;
    workingDirectory: string;
    env: Record<string, string>;
    timeoutSeconds: number;
}

export interface SandboxRunnerResult {
    status: SandboxExecutionStatus;
    stdout: string;
    stderr: string;
    exitCode: number | null;
    durationMs: number;
    resourceUsage?: {
        cpuMs?: number;
        memoryPeakMb?: number;
        diskWrittenMb?: number;
        stdoutKb?: number;
        stderrKb?: number;
    };
    errorMessage?: string;
}

export interface SandboxRunner {
    run(input: SandboxRunnerInput): Promise<SandboxRunnerResult>;
}

export class ProcessSandboxRunner implements SandboxRunner {
    async run(input: SandboxRunnerInput): Promise<SandboxRunnerResult> {
        if (input.command.length === 0) {
            return {
                status: "failed",
                stdout: "",
                stderr: "No command provided.",
                exitCode: 1,
                durationMs: 0,
                errorMessage: "No command provided.",
            };
        }

        const [binary, ...args] = input.command;
        const startedAt = Date.now();
        const stdoutChunks: string[] = [];
        const stderrChunks: string[] = [];
        const child = spawn(binary, args, {
            cwd: input.workingDirectory,
            env: {
                ...input.env,
                PATH: process.env.PATH,
            },
            shell: false,
            stdio: ["ignore", "pipe", "pipe"],
            windowsHide: true,
        });

        let timedOut = false;
        const timeout = setTimeout(() => {
            timedOut = true;
            child.kill("SIGKILL");
        }, Math.max(1, input.timeoutSeconds) * 1000);

        child.stdout.on("data", (chunk) => {
            stdoutChunks.push(chunk.toString("utf8"));
        });

        child.stderr.on("data", (chunk) => {
            stderrChunks.push(chunk.toString("utf8"));
        });

        return await new Promise<SandboxRunnerResult>((resolve) => {
            child.on("error", (error) => {
                clearTimeout(timeout);
                resolve({
                    status: "failed",
                    stdout: stdoutChunks.join("").slice(0, input.policy.ioPolicy.maxOutputSizeKb * 1024),
                    stderr: error.message,
                    exitCode: 1,
                    durationMs: Date.now() - startedAt,
                    errorMessage: error.message,
                });
            });

            child.on("close", (code) => {
                clearTimeout(timeout);
                const stdout = trimByKb(stdoutChunks.join(""), input.policy.ioPolicy.maxOutputSizeKb);
                const stderr = trimByKb(stderrChunks.join(""), input.policy.ioPolicy.maxOutputSizeKb);
                resolve({
                    status: timedOut ? "timed_out" : code === 0 ? "completed" : "failed",
                    stdout,
                    stderr,
                    exitCode: code,
                    durationMs: Date.now() - startedAt,
                    resourceUsage: {
                        stdoutKb: Math.ceil(Buffer.byteLength(stdout, "utf8") / 1024),
                        stderrKb: Math.ceil(Buffer.byteLength(stderr, "utf8") / 1024),
                    },
                    errorMessage: timedOut ? "Execution timed out." : code === 0 ? undefined : `Process exited with code ${code}`,
                });
            });
        });
    }
}

export class ContainerSandboxRunner implements SandboxRunner {
    async run(input: SandboxRunnerInput): Promise<SandboxRunnerResult> {
        return {
            status: "failed",
            stdout: "",
            stderr: "Container sandbox runner is not configured in this environment.",
            exitCode: 1,
            durationMs: 0,
            errorMessage: "Container sandbox runner is not configured in this environment.",
        };
    }
}

export class RemoteSandboxRunner implements SandboxRunner {
    async run(input: SandboxRunnerInput): Promise<SandboxRunnerResult> {
        return {
            status: "failed",
            stdout: "",
            stderr: "Remote sandbox runner is not configured in this environment.",
            exitCode: 1,
            durationMs: 0,
            errorMessage: "Remote sandbox runner is not configured in this environment.",
        };
    }
}

export function mapRunnerResultToExecution(
    execution: SandboxExecution,
    result: SandboxRunnerResult,
): SandboxExecution {
    return {
        ...execution,
        status: result.status,
        finishedAt: new Date().toISOString(),
        durationMs: result.durationMs,
        exitCode: result.exitCode,
        resourceUsage: result.resourceUsage,
        errorMessage: result.errorMessage || null,
        stdout: result.stdout,
        stderr: result.stderr,
    };
}

function trimByKb(value: string, maxKb: number): string {
    const maxBytes = Math.max(1, maxKb) * 1024;
    const raw = Buffer.from(value, "utf8");
    if (raw.length <= maxBytes) {
        return value;
    }
    return raw.subarray(0, maxBytes).toString("utf8");
}
