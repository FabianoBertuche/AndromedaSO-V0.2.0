import { Request, Response } from "express";
import { Agent, AgentRegistry } from "@andromeda/core";

export class AgentController {
    constructor(private readonly registry: AgentRegistry) { }

    async register(req: Request, res: Response) {
        try {
            const { name, description, model, systemPrompt, temperature } = req.body;
            const agent = new Agent({ name, description, model, systemPrompt, temperature });
            await this.registry.register(agent);
            return res.status(201).json(agent.toJSON());
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async list(req: Request, res: Response) {
        try {
            const agents = await this.registry.listAll();
            return res.json(agents.map(a => a.toJSON()));
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const agent = await this.registry.findById(req.params.id);
            if (!agent) return res.status(404).json({ error: "Agent not found" });
            return res.json(agent.toJSON());
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
}
