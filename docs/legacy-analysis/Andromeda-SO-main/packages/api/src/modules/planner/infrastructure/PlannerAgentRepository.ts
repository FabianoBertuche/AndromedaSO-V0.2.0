import { AgentProfileService } from "../../agent-management/application/AgentProfileService";
import { IAgentRepository, PlannerAgentSummary } from "../domain/ports";

export class PlannerAgentRepository implements IAgentRepository {
    constructor(private readonly profileService: AgentProfileService) { }

    async findByTenant(_tenantId: string): Promise<PlannerAgentSummary[]> {
        const profiles = await this.profileService.listProfilesRaw();
        return profiles
            .filter((profile) => profile.status === "active")
            .map((profile) => ({
                id: profile.id,
                name: profile.identity.name,
                description: profile.description,
                capabilities: profile.identity.specializations || [],
            }));
    }
}
