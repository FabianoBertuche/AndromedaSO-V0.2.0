import { Skill, SkillRegistry } from "@andromeda/core";

export class InMemorySkillRegistry implements SkillRegistry {
    private skills: Map<string, Skill> = new Map();
    private readonly initialization: Promise<void>;

    constructor(initializer?: () => Promise<Skill[]>) {
        this.initialization = this.initialize(initializer);
    }

    private async initialize(initializer?: () => Promise<Skill[]>): Promise<void> {
        if (!initializer) {
            return;
        }

        const skills = await initializer();
        for (const skill of skills) {
            this.skills.set(skill.getId(), skill);
        }
    }

    async register(skill: Skill): Promise<void> {
        await this.initialization;
        this.skills.set(skill.getId(), skill);
    }

    async findById(id: string): Promise<Skill | null> {
        await this.initialization;
        return this.skills.get(id) || null;
    }

    async findByName(name: string): Promise<Skill | null> {
        await this.initialization;
        return Array.from(this.skills.values()).find(s => s.getName() === name) || null;
    }

    async listAll(): Promise<Skill[]> {
        await this.initialization;
        return Array.from(this.skills.values());
    }

    async searchByCapability(query: string): Promise<Skill[]> {
        await this.initialization;
        const lowerQuery = query.toLowerCase();
        return Array.from(this.skills.values()).filter(s =>
            lowerQuery.includes(s.getName().toLowerCase()) ||
            lowerQuery.includes(s.getDescription().toLowerCase())
        );
    }
}
