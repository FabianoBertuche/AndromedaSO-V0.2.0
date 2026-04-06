import { MemoryEntry } from "../../../memory/domain/memory";

export interface PlaybookSuggestionView {
    id: string;
    agentId: string;
    title: string;
    summary: string;
    suggestion: string;
    confidence: number;
    status: string;
    sourceEpisodeIds: string[];
    sourceEpisodes: Array<{
        id: string;
        summary: string;
        createdAt: string;
        importanceScore: number;
    }>;
    reviewedBy: string | null;
    reviewedAt: string | null;
    rejectionReason: string | null;
    createdAt: string;
}

export interface SuggestionAnalysisResult {
    title: string;
    summary: string;
    suggestion: string;
    confidence: number;
    sourceEpisodeIds: string[];
}

export interface SuggestionAnalysisPort {
    analyzeEpisodes(input: {
        requestId: string;
        correlationId: string;
        tenantId: string;
        agentId: string;
        episodes: MemoryEntry[];
    }): Promise<SuggestionAnalysisResult[]>;
}

export interface PlaybookSuggestionRepository {
    listByAgent(agentId: string, tenantId: string): Promise<PlaybookSuggestionView[]>;
    getById(agentId: string, suggestionId: string, tenantId: string): Promise<PlaybookSuggestionView | null>;
    createMany(agentId: string, tenantId: string, suggestions: SuggestionAnalysisResult[], episodesById: Map<string, MemoryEntry>): Promise<PlaybookSuggestionView[]>;
    review(agentId: string, suggestionId: string, tenantId: string, input: {
        status: "approved" | "rejected";
        reviewedBy: string;
        rejectionReason?: string;
    }): Promise<PlaybookSuggestionView>;
}
