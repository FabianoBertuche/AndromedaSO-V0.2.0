import { Skill } from "./Skill";

export interface SkillRegistry {
    register(skill: Skill): Promise<void>;
    findById(id: string): Promise<Skill | null>;
    searchByCapability(query: string): Promise<Skill[]>;
    listAll(): Promise<Skill[]>;
}
