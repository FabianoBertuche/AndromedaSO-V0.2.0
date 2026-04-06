import {
    AgentBehaviorSnapshot,
    AgentConformanceReport,
    AgentConformanceStatus,
    AgentExecutionPrecheck,
    AgentProfile,
} from "../domain/agent-profile";

export class BehaviorEvaluationService {
    evaluate(input: {
        profile: AgentProfile;
        userPrompt: string;
        responseText: string;
        selectedModel: string;
        behaviorSnapshot: AgentBehaviorSnapshot;
        precheck: AgentExecutionPrecheck;
    }): AgentConformanceReport {
        const { profile, responseText, selectedModel, behaviorSnapshot, precheck } = input;
        const normalized = responseText.trim();
        const wordCount = normalized.split(/\s+/).filter(Boolean).length;
        const hasStructure = /(^|\n)(- |\d+\. )/.test(normalized) || /\bstatus\b/i.test(normalized);
        const hasNextSteps = /\bnext steps?\b/i.test(normalized) || /\bproximos passos\b/i.test(normalized);
        const politeTone = /\bplease\b|\bthank\b|\bglad\b|\bhappy\b|\bobrigad/i.test(normalized);
        const slangTone = /\bgonna\b|\bwanna\b|\blol\b|\bmano\b|\bbro\b/i.test(normalized);
        const reviewMention = /\breview(ed)?\b|\bvalidated\b|\bverify\b|\brevisei\b|\bvalidei\b/i.test(normalized);
        const delegationMention = /\bdelegate\b|\bspecialist\b|\bespecialista\b|\broute\b|\brotear\b/i.test(normalized);
        const forbiddenMatches = profile.rules.mustNot.filter((rule) => matchesRule(normalized, rule));

        const identityAlignmentScore = clampScore(precheck.outOfRole ? (precheck.allowed ? 55 : 20) : 92);
        const toneAlignmentScore = clampScore(average([
            profile.persona.formality >= 75 ? (slangTone ? 40 : 88) : 78,
            profile.persona.warmth >= 70 ? (politeTone ? 88 : 68) : 82,
            profile.persona.detailLevel >= 70 ? (wordCount >= 16 ? 90 : 54) : (wordCount <= 120 ? 86 : 68),
            profile.persona.objectivity >= 70 ? (hasStructure ? 88 : 72) : 80,
        ]));

        let policyComplianceScore = 92 - forbiddenMatches.length * 35;
        if ((profile.persona.selfReviewIntensity >= 70 || profile.safeguards.runSelfReview) && !reviewMention) {
            policyComplianceScore -= 12;
        }
        policyComplianceScore = clampScore(policyComplianceScore);

        const feedbackComplianceScore = clampScore(
            profile.safeguards.alwaysProvideIntermediateFeedback || profile.persona.feedbackFrequency >= 75
                ? (hasStructure || hasNextSteps ? 90 : 58)
                : 84
        );

        const delegationAlignmentScore = clampScore(
            precheck.outOfRole && profile.safeguards.preferSpecialistDelegation
                ? (delegationMention ? 92 : 42)
                : 88
        );

        const playbookAlignmentScore = clampScore(
            profile.persona.playbookStrictness >= 70
                ? (hasStructure ? 90 : 60)
                : 84
        );

        const overallConformanceScore = clampScore(weightedAverage([
            [identityAlignmentScore, 0.2],
            [toneAlignmentScore, 0.2],
            [policyComplianceScore, 0.2],
            [feedbackComplianceScore, 0.15],
            [delegationAlignmentScore, 0.1],
            [playbookAlignmentScore, 0.15],
        ]));

        const violations = [
            ...precheck.violations,
            ...forbiddenMatches.map((rule) => `Forbidden behavior overlap detected: ${rule}`),
        ];

        return {
            agentId: profile.id,
            agentName: profile.identity.name,
            profileVersion: behaviorSnapshot.profileVersion,
            selectedModel,
            identityAlignmentScore,
            toneAlignmentScore,
            policyComplianceScore,
            feedbackComplianceScore,
            delegationAlignmentScore,
            playbookAlignmentScore,
            overallConformanceScore,
            status: classifyConformanceStatus(overallConformanceScore, precheck.allowed),
            appliedPolicies: behaviorSnapshot.appliedPolicies,
            violations,
            actionTaken: "allow",
            createdAt: new Date().toISOString(),
        };
    }
}

function matchesRule(text: string, rule: string): boolean {
    const normalizedText = text.toLowerCase();
    const normalizedRule = rule.trim().toLowerCase();

    if (normalizedRule.length > 3 && normalizedText.includes(normalizedRule)) {
        return true;
    }

    const keywords = normalizedRule
        .split(/\s+/)
        .map((part) => part.replace(/[^a-z0-9]/g, ""))
        .filter((part) => part.length >= 5);

    return keywords.some((keyword) => normalizedText.includes(keyword));
}

function classifyConformanceStatus(score: number, allowed: boolean): AgentConformanceStatus {
    if (!allowed || score < 50) {
        return "blocked";
    }
    if (score >= 85) {
        return "approved";
    }
    if (score >= 70) {
        return "approved_with_observation";
    }
    return "review";
}

function average(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function weightedAverage(values: Array<[number, number]>): number {
    const totalWeight = values.reduce((sum, [, weight]) => sum + weight, 0);
    if (totalWeight === 0) {
        return 0;
    }
    return values.reduce((sum, [value, weight]) => sum + value * weight, 0) / totalWeight;
}

function clampScore(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
}
