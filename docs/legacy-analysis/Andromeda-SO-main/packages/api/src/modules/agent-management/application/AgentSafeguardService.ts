import { AgentExecutionPrecheck, AgentProfile } from "../domain/agent-profile";

const REQUEST_TAG_PATTERNS: Record<string, RegExp[]> = {
    security: [/\bsecurity\b/i, /\baudit\b/i, /\bcompliance\b/i, /\bvulnerab/i, /\bseguran/i, /\bauditar/i, /\breview\b/i],
    coding: [/\bcode\b/i, /\bcoding\b/i, /\bimplement/i, /\btypescript\b/i, /\breact\b/i, /\bapi\b/i, /\bwebsocket\b/i, /\btest/i],
    planning: [/\bplan\b/i, /\borchestrat/i, /\broadmap\b/i, /\barchitecture\b/i, /\bfluxo\b/i, /\bstrategy\b/i],
    creative: [/\bpoem\b/i, /\bstory\b/i, /\bbrainstorm\b/i, /\bcreative\b/i, /\bidea\b/i, /\bcopy\b/i, /\bwhimsical\b/i],
    research: [/\bresearch\b/i, /\bcompare\b/i, /\bbenchmark\b/i, /\banalys/i, /\binvestigat/i],
};

export class AgentSafeguardService {
    evaluateBeforeExecution(profile: AgentProfile, userPrompt: string): AgentExecutionPrecheck {
        const inferredRequestTags = inferRequestTags(userPrompt);
        const specializationSet = new Set(profile.identity.specializations.map(normalizeTag));
        const outOfRole = inferredRequestTags.length > 0
            && specializationSet.size > 0
            && inferredRequestTags.every((tag) => !specializationSet.has(normalizeTag(tag)));

        const violations = outOfRole
            ? ["Request appears outside the agent role specialization boundary."]
            : [];

        if (outOfRole && profile.safeguards.blockOutOfRoleResponses && profile.safeguards.mode === "strict") {
            return {
                allowed: false,
                outOfRole: true,
                inferredRequestTags,
                appliedPolicies: profile.safeguards.activePolicies,
                violations,
                fallbackContent: buildOutOfRoleFallback(profile, inferredRequestTags),
            };
        }

        return {
            allowed: true,
            outOfRole,
            inferredRequestTags,
            appliedPolicies: profile.safeguards.activePolicies,
            violations,
        };
    }

    buildCorrectiveResponse(profile: AgentProfile, originalContent: string, action: "rewrite" | "fallback" | "allow_with_notice" | "block"): string {
        if (action === "fallback" || action === "block") {
            return buildConformanceFallback(profile);
        }

        if (action === "allow_with_notice") {
            return [
                "Conformance notice: the response was delivered with a behavior-policy warning.",
                "",
                originalContent,
            ].join("\n");
        }

        return rewriteForConformance(profile, originalContent);
    }
}

function inferRequestTags(prompt: string): string[] {
    const tags = new Set<string>();
    for (const [tag, patterns] of Object.entries(REQUEST_TAG_PATTERNS)) {
        if (patterns.some((pattern) => pattern.test(prompt))) {
            tags.add(tag);
        }
    }
    return [...tags];
}

function normalizeTag(value: string): string {
    return value.trim().toLowerCase();
}

function buildOutOfRoleFallback(profile: AgentProfile, tags: string[]): string {
    const requestedDomain = tags.length > 0 ? tags.join(", ") : "the requested domain";
    return [
        `The request is outside the agent role currently assigned to ${profile.identity.name}.`,
        `Requested domain: ${requestedDomain}.`,
        `Assigned domain: ${profile.identity.specializations.join(", ") || "general execution"}.`,
        `Use a different agent or relax the safeguard mode before proceeding.`,
    ].join(" ");
}

function buildConformanceFallback(profile: AgentProfile): string {
    return [
        `${profile.identity.name} withheld the answer because the response did not satisfy the active behavior safeguards.`,
        "Review the profile, safeguards, or request scope and try again.",
    ].join(" ");
}

function rewriteForConformance(profile: AgentProfile, originalContent: string): string {
    const rewritten = [
        `Policy-adjusted response from ${profile.identity.name}:`,
        "",
        originalContent.trim(),
    ];

    if (profile.safeguards.alwaysSuggestNextSteps && !/next steps?|proximos passos/i.test(originalContent)) {
        rewritten.push("", "Next steps: verify the missing evidence, then continue with the smallest safe change.");
    }

    return rewritten.join("\n");
}
