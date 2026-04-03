export type ConflictVote = {
  option: string;
  agentId: string;
};

export type ConflictResolutionResult = {
  winner: string | null;
  requiresHumanFallback: boolean;
  votesByOption: Record<string, number>;
};

export class ConflictResolution {
  resolve(votes: ConflictVote[]): ConflictResolutionResult {
    const counts = votes.reduce<Record<string, number>>((acc, vote) => {
      acc[vote.option] = (acc[vote.option] ?? 0) + 1;
      return acc;
    }, {});

    const ordered = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (ordered.length === 0) {
      return { winner: null, requiresHumanFallback: true, votesByOption: counts };
    }

    const [topOption, topVotes] = ordered[0];
    const secondVotes = ordered[1]?.[1] ?? -1;
    const requiresHumanFallback = topVotes === secondVotes;

    return {
      winner: requiresHumanFallback ? null : topOption,
      requiresHumanFallback,
      votesByOption: counts
    };
  }
}

export const conflictResolution = new ConflictResolution();
