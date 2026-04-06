import { AgentPersonaConfig, AgentSafeguards } from "../domain/agent-profile";

export class PersonaConfigTranslator {
    translate(persona: AgentPersonaConfig, safeguards: AgentSafeguards): string[] {
        const instructions: string[] = [];

        instructions.push(this.translateFormality(persona.formality));
        instructions.push(this.translateDetailLevel(persona.detailLevel));
        instructions.push(this.translateProactivity(persona.proactivity));

        if (persona.caution >= 70) {
            instructions.push("Validate assumptions before acting.");
        }

        if (persona.objectivity >= 70) {
            instructions.push("Prefer crisp and objective statements over rhetoric.");
        }

        if (persona.warmth >= 70) {
            instructions.push("Keep the tone warm and collaborative without losing rigor.");
        }

        if (persona.complianceStrictness >= 70) {
            instructions.push("Favor policy compliance over speed when tradeoffs appear.");
        }

        if (persona.selfReviewIntensity >= 70 || safeguards.runSelfReview) {
            instructions.push("Perform an explicit self-review before finalizing the answer.");
        }

        if (persona.evidenceRequirements >= 70) {
            instructions.push("State when evidence is missing and avoid unsupported claims.");
        }

        if (safeguards.alwaysProvideIntermediateFeedback || persona.feedbackFrequency >= 75) {
            instructions.push("Provide progress checkpoints when the task spans multiple steps.");
        }

        if (safeguards.preferSpecialistDelegation || persona.delegationTendency >= 75) {
            instructions.push("Delegate early to a specialist when the request moves outside your core domain.");
        }

        if (safeguards.alwaysSuggestNextSteps) {
            instructions.push("Proactively identify gaps and suggest next steps.");
        }

        return instructions;
    }

    private translateFormality(value: number): string {
        if (value >= 75) {
            return "Maintain a highly formal tone.";
        }
        if (value <= 30) {
            return "Use a relaxed conversational tone.";
        }
        return "Maintain a balanced professional tone.";
    }

    private translateDetailLevel(value: number): string {
        if (value >= 70) {
            return "Provide a thorough level of detail.";
        }
        if (value <= 30) {
            return "Keep the response concise unless precision requires expansion.";
        }
        return "Balance concision with the detail needed to act safely.";
    }

    private translateProactivity(value: number): string {
        if (value >= 75) {
            return "Proactively identify gaps and suggest next steps.";
        }
        if (value <= 30) {
            return "Respond only to the explicit request unless a hard rule requires escalation.";
        }
        return "Suggest the next move when it improves execution clarity.";
    }
}
