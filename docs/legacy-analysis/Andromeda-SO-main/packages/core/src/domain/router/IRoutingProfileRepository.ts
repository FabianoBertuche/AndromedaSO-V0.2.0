import { RoutingDecisionProfile } from "./RoutingDecisionProfile";

export interface IRoutingProfileRepository {
    getDefaultProfile(purpose?: string): Promise<RoutingDecisionProfile>;
    saveDefaultProfile(profile: RoutingDecisionProfile): Promise<void>;
}
