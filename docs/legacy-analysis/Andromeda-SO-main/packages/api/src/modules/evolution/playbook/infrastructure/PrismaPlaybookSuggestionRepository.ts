import { MemoryEntry } from "../../../memory/domain/memory";
import { PlaybookSuggestionRepository, PlaybookSuggestionView, SuggestionAnalysisResult } from "../domain/PlaybookSuggestion";

export class PrismaPlaybookSuggestionRepository implements PlaybookSuggestionRepository {
    constructor(private readonly prisma: any) { }

    async listByAgent(agentId: string, tenantId: string): Promise<PlaybookSuggestionView[]> {
        const rows = await this.prisma.playbookSuggestion.findMany({
            where: { agentId, tenantId },
            orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        });
        return rows.map(mapRow);
    }

    async getById(agentId: string, suggestionId: string, tenantId: string): Promise<PlaybookSuggestionView | null> {
        const row = await this.prisma.playbookSuggestion.findFirst({
            where: { id: suggestionId, agentId, tenantId },
        });
        return row ? mapRow(row) : null;
    }

    async createMany(agentId: string, tenantId: string, suggestions: SuggestionAnalysisResult[], episodesById: Map<string, MemoryEntry>): Promise<PlaybookSuggestionView[]> {
        const created: PlaybookSuggestionView[] = [];
        for (const suggestion of suggestions) {
            const duplicate = await this.prisma.playbookSuggestion.findFirst({
                where: {
                    tenantId,
                    agentId,
                    title: suggestion.title,
                    status: "pending",
                },
            });
            if (duplicate) {
                continue;
            }

            const row = await this.prisma.playbookSuggestion.create({
                data: {
                    tenantId,
                    agentId,
                    title: suggestion.title,
                    summary: suggestion.summary,
                    proposedChange: { suggestion: suggestion.suggestion },
                    confidence: suggestion.confidence,
                    status: "pending",
                    sourceEpisodeIds: suggestion.sourceEpisodeIds,
                    analysisPayload: {
                        sourceEpisodes: suggestion.sourceEpisodeIds.map((id) => toEpisodeView(episodesById.get(id))).filter(Boolean),
                    },
                },
            });
            created.push(mapRow(row));
        }
        return created;
    }

    async review(agentId: string, suggestionId: string, tenantId: string, input: { status: "approved" | "rejected"; reviewedBy: string; rejectionReason?: string | undefined; }): Promise<PlaybookSuggestionView> {
        const row = await this.prisma.playbookSuggestion.update({
            where: { id: suggestionId },
            data: {
                status: input.status,
                reviewedBy: input.reviewedBy,
                reviewedAt: new Date(),
                rejectionReason: input.rejectionReason || null,
            },
        });
        return mapRow(row);
    }
}

function mapRow(row: any): PlaybookSuggestionView {
    const proposed = toObject(row.proposedChange);
    const analysis = toObject(row.analysisPayload);
    const sourceEpisodes = Array.isArray(analysis.sourceEpisodes) ? analysis.sourceEpisodes : [];

    return {
        id: row.id,
        agentId: row.agentId,
        title: row.title,
        summary: row.summary,
        suggestion: typeof proposed.suggestion === "string" ? proposed.suggestion : row.summary,
        confidence: toNumber(row.confidence),
        status: row.status,
        sourceEpisodeIds: Array.isArray(row.sourceEpisodeIds) ? row.sourceEpisodeIds.filter((item: unknown): item is string => typeof item === "string") : [],
        sourceEpisodes: sourceEpisodes.filter(Boolean) as PlaybookSuggestionView["sourceEpisodes"],
        reviewedBy: row.reviewedBy || null,
        reviewedAt: row.reviewedAt?.toISOString() || null,
        rejectionReason: row.rejectionReason || null,
        createdAt: row.createdAt.toISOString(),
    };
}

function toEpisodeView(entry: MemoryEntry | undefined) {
    if (!entry) return null;
    return {
        id: entry.id,
        summary: entry.summary || entry.content.slice(0, 180),
        createdAt: entry.createdAt.toISOString(),
        importanceScore: entry.importanceScore,
    };
}

function toObject(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function toNumber(value: unknown): number {
    if (typeof value === "number") return value;
    if (value && typeof value === "object" && "toNumber" in value && typeof (value as { toNumber: () => number }).toNumber === "function") {
        return (value as { toNumber: () => number }).toNumber();
    }
    return Number(value || 0);
}
