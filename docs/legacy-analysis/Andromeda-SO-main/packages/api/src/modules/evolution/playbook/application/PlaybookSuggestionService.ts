import { AgentProfileService } from "../../../agent-management/application/AgentProfileService";
import { MemoryService } from "../../../memory/application/MemoryService";
import { MemoryEntry } from "../../../memory/domain/memory";
import { PlaybookSuggestionRepository, SuggestionAnalysisPort } from "../domain/PlaybookSuggestion";

export class PlaybookSuggestionService {
    constructor(
        private readonly repository: PlaybookSuggestionRepository,
        private readonly analyzer: SuggestionAnalysisPort,
        private readonly memoryService: MemoryService,
        private readonly agentProfileService: AgentProfileService,
    ) { }

    async listByAgent(agentId: string, tenantId = "default") {
        return this.repository.listByAgent(agentId, tenantId);
    }

    async generateForAgent(agentId: string, tenantId = "default", referenceAt = new Date()) {
        const since = new Date(referenceAt.getTime() - 14 * 24 * 60 * 60 * 1000);
        const episodes = (await this.memoryService.listMemory({
            tenantId,
            type: "episodic",
            agentId,
            status: "active",
            limit: 200,
        })).filter((entry) => entry.createdAt >= since);

        if (episodes.length < 3) {
            return [];
        }

        const suggestions = await this.analyzer.analyzeEpisodes({
            requestId: `suggestions-${agentId}-${referenceAt.getTime()}`,
            correlationId: `suggestions-${agentId}`,
            tenantId,
            agentId,
            episodes,
        });

        const accepted = suggestions.filter((item) => item.confidence >= 0.7);
        if (accepted.length === 0) {
            return [];
        }

        return this.repository.createMany(agentId, tenantId, accepted, new Map(episodes.map((episode) => [episode.id, episode])));
    }

    async approve(agentId: string, suggestionId: string, reviewedBy: string, tenantId = "default") {
        const suggestion = await this.repository.getById(agentId, suggestionId, tenantId);
        if (!suggestion) {
            throw new Error(`Playbook suggestion ${suggestionId} not found for agent ${agentId}`);
        }
        if (suggestion.status !== "pending") {
            throw new Error("Playbook suggestion already reviewed");
        }

        const profile = await this.agentProfileService.getProfile(agentId);
        const nextPlaybookMarkdown = mergePlaybookSuggestion(profile.markdown.playbook, suggestion.suggestion);
        await this.agentProfileService.updateProfile(agentId, {
            markdown: {
                ...profile.markdown,
                playbook: nextPlaybookMarkdown,
            },
        });

        return this.repository.review(agentId, suggestionId, tenantId, {
            status: "approved",
            reviewedBy,
        });
    }

    async reject(agentId: string, suggestionId: string, reviewedBy: string, rejectionReason: string | undefined, tenantId = "default") {
        const suggestion = await this.repository.getById(agentId, suggestionId, tenantId);
        if (!suggestion) {
            throw new Error(`Playbook suggestion ${suggestionId} not found for agent ${agentId}`);
        }
        if (suggestion.status !== "pending") {
            throw new Error("Playbook suggestion already reviewed");
        }

        return this.repository.review(agentId, suggestionId, tenantId, {
            status: "rejected",
            reviewedBy,
            rejectionReason,
        });
    }

    async generateForAllAgents(tenantId = "default", referenceAt = new Date()) {
        const episodes = await this.memoryService.listMemory({
            tenantId,
            type: "episodic",
            status: "active",
            limit: 500,
        });
        const grouped = new Map<string, MemoryEntry[]>();
        for (const episode of episodes) {
            if (!episode.agentId) continue;
            const current = grouped.get(episode.agentId) || [];
            current.push(episode);
            grouped.set(episode.agentId, current);
        }

        const created: Array<Awaited<ReturnType<PlaybookSuggestionService["generateForAgent"]>>> = [];
        for (const agentId of grouped.keys()) {
            try {
                created.push(await this.generateForAgent(agentId, tenantId, referenceAt));
            } catch (error) {
                console.error("[playbook.suggestions.generate.failed]", {
                    agentId,
                    tenantId,
                    code: "episode_analysis_failed",
                    error,
                });
            }
        }
        return created.flat();
    }
}

function mergePlaybookSuggestion(playbookMarkdown: string, suggestion: string): string {
    const line = `- ${suggestion.trim()}`;
    if (playbookMarkdown.includes(line)) {
        return playbookMarkdown;
    }
    return `${playbookMarkdown.trim()}\n\n## Learned Suggestions\n${line}\n`;
}
