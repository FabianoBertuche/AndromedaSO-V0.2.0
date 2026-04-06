export function summarizeAppliedAgentAssets(appliedAgentAssets: any) {
    if (!appliedAgentAssets || typeof appliedAgentAssets !== "object") {
        return null;
    }

    const readCount = (key: string) => Array.isArray(appliedAgentAssets[key]) ? appliedAgentAssets[key].length : 0;

    return {
        agents: readCount("agents"),
        rules: readCount("rules"),
        workflows: readCount("workflows"),
        skills: readCount("skills"),
        resolvedAgent: appliedAgentAssets.resolvedAgent?.name || appliedAgentAssets.resolvedAgent?.id || null,
        strategyUsed: typeof appliedAgentAssets.strategyUsed === "string" ? appliedAgentAssets.strategyUsed : null,
    };
}
