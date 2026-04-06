import { createSandboxConfig, createSandboxProfile, SandboxProfile } from "./types";

export function createSystemSandboxProfiles(): SandboxProfile[] {
    const now = new Date().toISOString();

    return [
        createSandboxProfile(
            "sbx_safe_readonly",
            "Safe Readonly",
            "Uso para agentes consultivos com leitura e auditoria restritas.",
            "process",
            "low",
            createSandboxConfig("process", {
                filesystem: {
                    allowedReadPaths: ["/workspace", "/docs"],
                    allowedWritePaths: [],
                    persistArtifacts: false,
                },
                network: {
                    mode: "off",
                    blockPrivateNetworks: true,
                    allowDns: false,
                    httpOnly: true,
                },
                execution: {
                    allowShell: false,
                    blockedBinaries: ["sudo", "su", "ssh", "scp", "docker", "kubectl"],
                },
                approvals: {
                    requireApprovalForExec: true,
                    requireApprovalForWriteOutsideWorkspace: true,
                    requireApprovalForNetwork: true,
                    requireApprovalForLargeArtifacts: true,
                },
            }),
            now,
        ),
        createSandboxProfile(
            "sbx_research",
            "Research",
            "Uso para pesquisa e coleta controlada na web.",
            "process",
            "moderate",
            createSandboxConfig("process", {
                network: {
                    mode: "restricted",
                    allowedDomains: ["openai.com", "github.com", "docs.github.com"],
                    blockPrivateNetworks: true,
                    allowDns: true,
                    httpOnly: true,
                },
                execution: {
                    allowShell: false,
                    allowedBinaries: ["node", "python", "python3", "curl"],
                },
                ioPolicy: {
                    allowedOutputTypes: ["text", "json"],
                    retention: "session",
                },
            }),
            now,
        ),
        createSandboxProfile(
            "sbx_code_runner",
            "Code Runner",
            "Uso para transformacao de arquivos, scripts controlados e artefatos.",
            "process",
            "high",
            createSandboxConfig("process", {
                filesystem: {
                    allowedReadPaths: ["/workspace"],
                    allowedWritePaths: ["/workspace/output", "/workspace/tmp"],
                    persistArtifacts: true,
                },
                execution: {
                    allowShell: false,
                    allowedBinaries: ["node", "python", "python3", "bash", "npm"],
                    allowSubprocessSpawn: true,
                },
                approvals: {
                    requireApprovalForExec: true,
                    requireApprovalForWriteOutsideWorkspace: true,
                    requireApprovalForNetwork: true,
                    requireApprovalForLargeArtifacts: false,
                },
            }),
            now,
        ),
        createSandboxProfile(
            "sbx_automation_restricted",
            "Automation Restricted",
            "Uso para automacoes recorrentes com limitacao forte.",
            "process",
            "high",
            createSandboxConfig("process", {
                network: {
                    mode: "off",
                    blockPrivateNetworks: true,
                    allowDns: false,
                    httpOnly: true,
                },
                execution: {
                    allowShell: false,
                    allowPackageInstall: false,
                },
                approvals: {
                    requireApprovalForExec: true,
                    requireApprovalForWriteOutsideWorkspace: true,
                    requireApprovalForNetwork: true,
                    requireApprovalForLargeArtifacts: true,
                },
            }),
            now,
        ),
        createSandboxProfile(
            "sbx_operator_elevated",
            "Operator Elevated",
            "Uso para agentes especiais, ainda auditados e com barreiras extras.",
            "container",
            "critical",
            createSandboxConfig("container", {
                network: {
                    mode: "tool_only",
                    blockPrivateNetworks: true,
                    allowDns: true,
                    httpOnly: true,
                },
                execution: {
                    allowShell: false,
                    allowSubprocessSpawn: true,
                },
                approvals: {
                    requireApprovalForExec: true,
                    requireApprovalForWriteOutsideWorkspace: true,
                    requireApprovalForNetwork: true,
                    requireApprovalForLargeArtifacts: true,
                },
            }),
            now,
        ),
    ];
}
