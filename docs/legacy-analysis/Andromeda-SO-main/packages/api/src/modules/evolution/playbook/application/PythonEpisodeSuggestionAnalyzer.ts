import { MemoryEntry } from "../../../memory/domain/memory";
import { PythonCognitiveServiceAdapter } from "../../../cognitive/infrastructure/python/PythonCognitiveServiceAdapter";
import { SuggestionAnalysisPort, SuggestionAnalysisResult } from "../domain/PlaybookSuggestion";

export class PythonEpisodeSuggestionAnalyzer implements SuggestionAnalysisPort {
    constructor(private readonly adapter: PythonCognitiveServiceAdapter) { }

    async analyzeEpisodes(input: {
        requestId: string;
        correlationId: string;
        tenantId: string;
        agentId: string;
        episodes: MemoryEntry[];
    }): Promise<SuggestionAnalysisResult[]> {
        return this.adapter.analyzeEpisodes({
            requestId: input.requestId,
            correlationId: input.correlationId,
            tenantId: input.tenantId,
            agentId: input.agentId,
            episodes: input.episodes.map((episode) => ({
                id: episode.id,
                title: episode.title,
                summary: episode.summary,
                content: episode.content,
                importanceScore: episode.importanceScore,
                createdAt: episode.createdAt.toISOString(),
                tags: episode.tags,
            })),
        });
    }
}
