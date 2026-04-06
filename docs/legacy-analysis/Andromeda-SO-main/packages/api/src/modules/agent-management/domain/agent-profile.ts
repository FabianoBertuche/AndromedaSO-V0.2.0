import { v4 as uuidv4 } from "uuid";

export type AgentStatus = "active" | "archived";
export type AgentSafeguardMode = "strict" | "balanced" | "flexible";
export type AgentCorrectiveAction = "allow_with_notice" | "rewrite" | "fallback" | "block";
export type AgentConformanceStatus = "approved" | "approved_with_observation" | "review" | "blocked";

export interface AgentMarkdownSections {
    identity: string;
    soul: string;
    rules: string;
    playbook: string;
    context: string;
}

export interface AgentIdentity {
    name: string;
    role: string;
    mission: string;
    scope: string;
    communicationStyle: string;
    ecosystemRole: string;
    agentType: string;
    specializations: string[];
}

export interface AgentSoul {
    personality: string;
    values: string[];
    posture: string;
    reasoningStyle: string;
    userRelation: string;
    ambiguityResponse: string;
    failureResponse: string;
    initiativeLevel: string;
    subagentRelation: string;
}

export interface AgentRuleSet {
    must: string[];
    mustNot: string[];
    delegateWhen: string[];
    reviewWhen: string[];
    feedbackWhen: string[];
    interruptWhen: string[];
    evidenceWhen: string[];
}

export interface AgentPlaybook {
    start: string[];
    brainstorm: string[];
    execute: string[];
    review: string[];
    report: string[];
    conclude: string[];
    longTask: string[];
}

export interface AgentProjectContext {
    stack: string[];
    architecture: string[];
    objectives: string[];
    decisions: string[];
    constraints: string[];
    patterns: string[];
}

export interface AgentPersonaConfig {
    formality: number;
    warmth: number;
    objectivity: number;
    detailLevel: number;
    caution: number;
    autonomy: number;
    creativity: number;
    ambiguityTolerance: number;
    proactivity: number;
    delegationTendency: number;
    feedbackFrequency: number;
    playbookStrictness: number;
    complianceStrictness: number;
    selfReviewIntensity: number;
    evidenceRequirements: number;
}

export interface AgentSafeguards {
    mode: AgentSafeguardMode;
    minOverallConformance: number;
    requireAuditOnCriticalTasks: boolean;
    alwaysProvideIntermediateFeedback: boolean;
    preferSpecialistDelegation: boolean;
    blockOutOfRoleResponses: boolean;
    runSelfReview: boolean;
    prioritizeSkillFirst: boolean;
    alwaysSuggestNextSteps: boolean;
    correctiveAction: AgentCorrectiveAction;
    fallbackAgentId?: string;
    activePolicies: string[];
}

export interface AgentProfile {
    id: string;
    version: string;
    status: AgentStatus;
    description: string;
    teamId: string;
    category: string;
    type: string;
    defaultModel: string;
    isDefault: boolean;
    identity: AgentIdentity;
    soul: AgentSoul;
    rules: AgentRuleSet;
    playbook: AgentPlaybook;
    context: AgentProjectContext;
    markdown: AgentMarkdownSections;
    persona: AgentPersonaConfig;
    safeguards: AgentSafeguards;
    createdAt: string;
    updatedAt: string;
    lastUpdatedBy?: string;
}

export interface AgentProfilePatch {
    description?: string;
    teamId?: string;
    category?: string;
    type?: string;
    defaultModel?: string;
    status?: AgentStatus;
    isDefault?: boolean;
    identity?: Partial<AgentIdentity>;
    soul?: Partial<AgentSoul>;
    rules?: Partial<AgentRuleSet>;
    playbook?: Partial<AgentPlaybook>;
    context?: Partial<AgentProjectContext>;
    markdown?: Partial<AgentMarkdownSections>;
    persona?: Partial<AgentPersonaConfig>;
    safeguards?: Partial<AgentSafeguards>;
}

export interface CreateAgentInput {
    id?: string;
    name: string;
    role: string;
    description: string;
    teamId?: string;
    category?: string;
    type?: string;
    defaultModel?: string;
    isDefault?: boolean;
    specializations?: string[];
}

export interface AgentBehaviorSnapshot {
    agentId: string;
    profileVersion: string;
    persona: AgentPersonaConfig;
    safeguards: AgentSafeguards;
    appliedPolicies: string[];
    generatedAt: string;
}

export interface AgentExecutionPrecheck {
    allowed: boolean;
    outOfRole: boolean;
    inferredRequestTags: string[];
    appliedPolicies: string[];
    violations: string[];
    fallbackContent?: string;
}

export interface AgentConformanceScores {
    identityAlignmentScore: number;
    toneAlignmentScore: number;
    policyComplianceScore: number;
    feedbackComplianceScore: number;
    delegationAlignmentScore: number;
    playbookAlignmentScore: number;
    overallConformanceScore: number;
}

export interface AgentConformanceReport extends AgentConformanceScores {
    agentId: string;
    agentName: string;
    profileVersion: string;
    selectedModel: string;
    status: AgentConformanceStatus;
    appliedPolicies: string[];
    violations: string[];
    actionTaken: string;
    createdAt: string;
}

export interface AgentListItem {
    id: string;
    name: string;
    role: string;
    category: string;
    teamId: string;
    status: AgentStatus;
    type: string;
    defaultModel: string;
    profileVersion: string;
    identityActive: boolean;
    recentConformanceScore?: number;
    lastExecutionAt?: string;
}

export interface AgentHistoryItem {
    taskId: string;
    sessionId?: string;
    prompt: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    model?: string;
    audit?: AgentConformanceReport;
}

export interface AgentProfileHistoryEntry {
    version: string;
    updatedAt: string;
    summary: string;
    restoredFromVersion?: string;
    profile: AgentProfile;
}

export interface AgentSessionHistoryItem {
    sessionId: string;
    lastActivityAt: string;
    taskCount: number;
}

export const DEFAULT_AGENT_POLICIES = [
    "AgentIdentityPolicy",
    "AgentBehaviorPolicy",
    "AgentTonePolicy",
    "AgentDelegationPolicy",
    "AgentFeedbackPolicy",
    "AgentBoundaryPolicy",
    "AgentConformancePolicy",
];

export function createDefaultPersonaConfig(): AgentPersonaConfig {
    return {
        formality: 60,
        warmth: 58,
        objectivity: 78,
        detailLevel: 72,
        caution: 74,
        autonomy: 68,
        creativity: 52,
        ambiguityTolerance: 46,
        proactivity: 82,
        delegationTendency: 56,
        feedbackFrequency: 74,
        playbookStrictness: 70,
        complianceStrictness: 84,
        selfReviewIntensity: 72,
        evidenceRequirements: 68,
    };
}

export function createDefaultSafeguards(): AgentSafeguards {
    return {
        mode: "balanced",
        minOverallConformance: 70,
        requireAuditOnCriticalTasks: false,
        alwaysProvideIntermediateFeedback: false,
        preferSpecialistDelegation: false,
        blockOutOfRoleResponses: false,
        runSelfReview: true,
        prioritizeSkillFirst: false,
        alwaysSuggestNextSteps: true,
        correctiveAction: "rewrite",
        activePolicies: [...DEFAULT_AGENT_POLICIES],
    };
}

export function createDefaultAgentProfile(input: CreateAgentInput): AgentProfile {
    const now = new Date().toISOString();
    const specializations = input.specializations?.length
        ? input.specializations
        : ["general", "coordination"];

    const identity: AgentIdentity = {
        name: input.name,
        role: input.role,
        mission: `Deliver ${input.role.toLowerCase()} outcomes with high operational discipline.`,
        scope: `Operate within ${input.category || "general"} responsibilities and escalate when the request moves outside the assigned domain.`,
        communicationStyle: "Structured, direct, and evidence-aware.",
        ecosystemRole: `${input.role} inside the Andromeda ecosystem.`,
        agentType: input.type || "specialist",
        specializations,
    };

    const soul: AgentSoul = {
        personality: "Calm, methodical, and accountable.",
        values: ["clarity", "traceability", "delivery discipline"],
        posture: "Direct and collaborative.",
        reasoningStyle: "Stepwise analysis with explicit assumptions.",
        userRelation: "Treat the user as an engineering partner.",
        ambiguityResponse: "Surface uncertainty and ask for evidence when required.",
        failureResponse: "Contain blast radius and report corrective action.",
        initiativeLevel: "High within the current scope.",
        subagentRelation: "Delegate early when specialist knowledge is needed.",
    };

    const rules: AgentRuleSet = {
        must: [
            "Preserve existing architecture unless change is explicitly required.",
            "Report known risks when confidence is limited.",
        ],
        mustNot: [
            "invent facts",
            "ignore mandatory safeguards",
        ],
        delegateWhen: [
            "A request requires a specialist outside the assigned domain.",
        ],
        reviewWhen: [
            "A change affects contracts, safety, or critical paths.",
        ],
        feedbackWhen: [
            "The task spans multiple phases or has hidden risk.",
        ],
        interruptWhen: [
            "The request would violate a hard rule or system boundary.",
        ],
        evidenceWhen: [
            "The user asks for verification, audit, or root-cause claims.",
        ],
    };

    const playbook: AgentPlaybook = {
        start: ["Confirm the target scope and active constraints."],
        brainstorm: ["Explore alternatives only when they improve the current architecture."],
        execute: ["Apply the smallest reversible change that satisfies the requirement."],
        review: ["Validate impact, tests, and behavior regressions."],
        report: ["Explain what changed, what remains, and the known risks."],
        conclude: ["Close with the next concrete action or decision."],
        longTask: ["Provide short checkpoints during long-running work."],
    };

    const context: AgentProjectContext = {
        stack: ["TypeScript", "Express", "React", "Vitest"],
        architecture: ["Clean Architecture", "Ports and Adapters", "Module-oriented backend"],
        objectives: ["Keep agents governable and observable."],
        decisions: ["Preserve the existing task and gateway flow."],
        constraints: ["Do not break existing API contracts without explicit validation."],
        patterns: ["Small reversible changes", "Behavioral audit trail", "Policy-first runtime"],
    };

    return {
        id: input.id || slugifyAgentName(input.name) || uuidv4(),
        version: "v1.0.0",
        status: "active",
        description: input.description,
        teamId: input.teamId || "team-core",
        category: input.category || "general",
        type: input.type || "specialist",
        defaultModel: input.defaultModel || "automatic-router",
        isDefault: input.isDefault ?? false,
        identity,
        soul,
        rules,
        playbook,
        context,
        markdown: {
            identity: createIdentityMarkdown(identity),
            soul: createSoulMarkdown(soul),
            rules: createRuleMarkdown(rules),
            playbook: createPlaybookMarkdown(playbook),
            context: createContextMarkdown(context),
        },
        persona: createDefaultPersonaConfig(),
        safeguards: createDefaultSafeguards(),
        createdAt: now,
        updatedAt: now,
    };
}

export function mergeAgentProfile(profile: AgentProfile, patch: AgentProfilePatch): AgentProfile {
    return normalizeAgentProfile({
        ...profile,
        description: patch.description ?? profile.description,
        teamId: patch.teamId ?? profile.teamId,
        category: patch.category ?? profile.category,
        type: patch.type ?? profile.type,
        defaultModel: patch.defaultModel ?? profile.defaultModel,
        status: patch.status ?? profile.status,
        isDefault: patch.isDefault ?? profile.isDefault,
        identity: {
            ...profile.identity,
            ...patch.identity,
            specializations: patch.identity?.specializations ?? profile.identity.specializations,
        },
        soul: {
            ...profile.soul,
            ...patch.soul,
            values: patch.soul?.values ?? profile.soul.values,
        },
        rules: {
            ...profile.rules,
            ...patch.rules,
            must: patch.rules?.must ?? profile.rules.must,
            mustNot: patch.rules?.mustNot ?? profile.rules.mustNot,
            delegateWhen: patch.rules?.delegateWhen ?? profile.rules.delegateWhen,
            reviewWhen: patch.rules?.reviewWhen ?? profile.rules.reviewWhen,
            feedbackWhen: patch.rules?.feedbackWhen ?? profile.rules.feedbackWhen,
            interruptWhen: patch.rules?.interruptWhen ?? profile.rules.interruptWhen,
            evidenceWhen: patch.rules?.evidenceWhen ?? profile.rules.evidenceWhen,
        },
        playbook: {
            ...profile.playbook,
            ...patch.playbook,
            start: patch.playbook?.start ?? profile.playbook.start,
            brainstorm: patch.playbook?.brainstorm ?? profile.playbook.brainstorm,
            execute: patch.playbook?.execute ?? profile.playbook.execute,
            review: patch.playbook?.review ?? profile.playbook.review,
            report: patch.playbook?.report ?? profile.playbook.report,
            conclude: patch.playbook?.conclude ?? profile.playbook.conclude,
            longTask: patch.playbook?.longTask ?? profile.playbook.longTask,
        },
        context: {
            ...profile.context,
            ...patch.context,
            stack: patch.context?.stack ?? profile.context.stack,
            architecture: patch.context?.architecture ?? profile.context.architecture,
            objectives: patch.context?.objectives ?? profile.context.objectives,
            decisions: patch.context?.decisions ?? profile.context.decisions,
            constraints: patch.context?.constraints ?? profile.context.constraints,
            patterns: patch.context?.patterns ?? profile.context.patterns,
        },
        markdown: {
            ...profile.markdown,
            ...patch.markdown,
        },
        persona: {
            ...profile.persona,
            ...sanitizePersonaPatch(patch.persona),
        },
        safeguards: {
            ...profile.safeguards,
            ...patch.safeguards,
            minOverallConformance: patch.safeguards?.minOverallConformance !== undefined
                ? clampSlider(patch.safeguards.minOverallConformance)
                : profile.safeguards.minOverallConformance,
            activePolicies: patch.safeguards?.activePolicies ?? profile.safeguards.activePolicies,
        },
    });
}

export function normalizeAgentProfile(profile: AgentProfile): AgentProfile {
    return {
        ...profile,
        description: profile.description.trim(),
        teamId: profile.teamId.trim(),
        category: profile.category.trim(),
        type: profile.type.trim(),
        defaultModel: profile.defaultModel.trim(),
        identity: {
            ...profile.identity,
            name: profile.identity.name.trim(),
            role: profile.identity.role.trim(),
            mission: profile.identity.mission.trim(),
            scope: profile.identity.scope.trim(),
            communicationStyle: profile.identity.communicationStyle.trim(),
            ecosystemRole: profile.identity.ecosystemRole.trim(),
            agentType: profile.identity.agentType.trim(),
            specializations: normalizeStringList(profile.identity.specializations),
        },
        soul: {
            ...profile.soul,
            personality: profile.soul.personality.trim(),
            values: normalizeStringList(profile.soul.values),
            posture: profile.soul.posture.trim(),
            reasoningStyle: profile.soul.reasoningStyle.trim(),
            userRelation: profile.soul.userRelation.trim(),
            ambiguityResponse: profile.soul.ambiguityResponse.trim(),
            failureResponse: profile.soul.failureResponse.trim(),
            initiativeLevel: profile.soul.initiativeLevel.trim(),
            subagentRelation: profile.soul.subagentRelation.trim(),
        },
        rules: {
            must: normalizeStringList(profile.rules.must),
            mustNot: normalizeStringList(profile.rules.mustNot),
            delegateWhen: normalizeStringList(profile.rules.delegateWhen),
            reviewWhen: normalizeStringList(profile.rules.reviewWhen),
            feedbackWhen: normalizeStringList(profile.rules.feedbackWhen),
            interruptWhen: normalizeStringList(profile.rules.interruptWhen),
            evidenceWhen: normalizeStringList(profile.rules.evidenceWhen),
        },
        playbook: {
            start: normalizeStringList(profile.playbook.start),
            brainstorm: normalizeStringList(profile.playbook.brainstorm),
            execute: normalizeStringList(profile.playbook.execute),
            review: normalizeStringList(profile.playbook.review),
            report: normalizeStringList(profile.playbook.report),
            conclude: normalizeStringList(profile.playbook.conclude),
            longTask: normalizeStringList(profile.playbook.longTask),
        },
        context: {
            stack: normalizeStringList(profile.context.stack),
            architecture: normalizeStringList(profile.context.architecture),
            objectives: normalizeStringList(profile.context.objectives),
            decisions: normalizeStringList(profile.context.decisions),
            constraints: normalizeStringList(profile.context.constraints),
            patterns: normalizeStringList(profile.context.patterns),
        },
        markdown: {
            identity: profile.markdown.identity,
            soul: profile.markdown.soul,
            rules: profile.markdown.rules,
            playbook: profile.markdown.playbook,
            context: profile.markdown.context,
        },
        persona: sanitizePersonaPatch(profile.persona),
        safeguards: {
            ...profile.safeguards,
            minOverallConformance: clampSlider(profile.safeguards.minOverallConformance),
            activePolicies: normalizeStringList(profile.safeguards.activePolicies).length
                ? normalizeStringList(profile.safeguards.activePolicies)
                : [...DEFAULT_AGENT_POLICIES],
        },
    };
}

export function sanitizePersonaPatch(patch: Partial<AgentPersonaConfig> | AgentPersonaConfig | undefined): AgentPersonaConfig {
    const base = createDefaultPersonaConfig();
    return {
        formality: clampSlider(patch?.formality ?? base.formality),
        warmth: clampSlider(patch?.warmth ?? base.warmth),
        objectivity: clampSlider(patch?.objectivity ?? base.objectivity),
        detailLevel: clampSlider(patch?.detailLevel ?? base.detailLevel),
        caution: clampSlider(patch?.caution ?? base.caution),
        autonomy: clampSlider(patch?.autonomy ?? base.autonomy),
        creativity: clampSlider(patch?.creativity ?? base.creativity),
        ambiguityTolerance: clampSlider(patch?.ambiguityTolerance ?? base.ambiguityTolerance),
        proactivity: clampSlider(patch?.proactivity ?? base.proactivity),
        delegationTendency: clampSlider(patch?.delegationTendency ?? base.delegationTendency),
        feedbackFrequency: clampSlider(patch?.feedbackFrequency ?? base.feedbackFrequency),
        playbookStrictness: clampSlider(patch?.playbookStrictness ?? base.playbookStrictness),
        complianceStrictness: clampSlider(patch?.complianceStrictness ?? base.complianceStrictness),
        selfReviewIntensity: clampSlider(patch?.selfReviewIntensity ?? base.selfReviewIntensity),
        evidenceRequirements: clampSlider(patch?.evidenceRequirements ?? base.evidenceRequirements),
    };
}

export function clampSlider(value: number): number {
    if (Number.isNaN(value)) {
        return 0;
    }
    return Math.max(0, Math.min(100, Math.round(value)));
}

export function bumpSemanticVersion(version: string): string {
    const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(version.trim());
    if (!match) {
        return "v1.0.0";
    }

    const major = Number(match[1]);
    const minor = Number(match[2]);
    const patch = Number(match[3]) + 1;
    return `v${major}.${minor}.${patch}`;
}

export function createHistoryEntry(profile: AgentProfile, summary: string, restoredFromVersion?: string): AgentProfileHistoryEntry {
    return {
        version: profile.version,
        updatedAt: profile.updatedAt,
        summary,
        restoredFromVersion,
        profile,
    };
}

function normalizeStringList(values: string[]): string[] {
    return values
        .map((value) => value.trim())
        .filter(Boolean);
}

function slugifyAgentName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function createIdentityMarkdown(identity: AgentIdentity): string {
    return [
        `# Identity`,
        "",
        `- Name: ${identity.name}`,
        `- Role: ${identity.role}`,
        `- Mission: ${identity.mission}`,
        `- Scope: ${identity.scope}`,
        `- Communication style: ${identity.communicationStyle}`,
        `- Ecosystem role: ${identity.ecosystemRole}`,
        `- Agent type: ${identity.agentType}`,
        `- Specializations: ${identity.specializations.join(", ")}`,
    ].join("\n");
}

function createSoulMarkdown(soul: AgentSoul): string {
    return [
        `# Soul`,
        "",
        `- Personality: ${soul.personality}`,
        `- Values: ${soul.values.join(", ")}`,
        `- Posture: ${soul.posture}`,
        `- Reasoning style: ${soul.reasoningStyle}`,
        `- User relation: ${soul.userRelation}`,
        `- Ambiguity response: ${soul.ambiguityResponse}`,
        `- Failure response: ${soul.failureResponse}`,
        `- Initiative level: ${soul.initiativeLevel}`,
        `- Subagent relation: ${soul.subagentRelation}`,
    ].join("\n");
}

function createRuleMarkdown(rules: AgentRuleSet): string {
    return [
        `# Rules`,
        "",
        `## Must`,
        ...rules.must.map((item) => `- ${item}`),
        "",
        `## Must not`,
        ...rules.mustNot.map((item) => `- ${item}`),
        "",
        `## Delegate when`,
        ...rules.delegateWhen.map((item) => `- ${item}`),
    ].join("\n");
}

function createPlaybookMarkdown(playbook: AgentPlaybook): string {
    return [
        `# Playbook`,
        "",
        `## Start`,
        ...playbook.start.map((item) => `- ${item}`),
        "",
        `## Execute`,
        ...playbook.execute.map((item) => `- ${item}`),
        "",
        `## Review`,
        ...playbook.review.map((item) => `- ${item}`),
        "",
        `## Report`,
        ...playbook.report.map((item) => `- ${item}`),
    ].join("\n");
}

function createContextMarkdown(context: AgentProjectContext): string {
    return [
        `# Context`,
        "",
        `## Stack`,
        ...context.stack.map((item) => `- ${item}`),
        "",
        `## Architecture`,
        ...context.architecture.map((item) => `- ${item}`),
        "",
        `## Constraints`,
        ...context.constraints.map((item) => `- ${item}`),
    ].join("\n");
}
