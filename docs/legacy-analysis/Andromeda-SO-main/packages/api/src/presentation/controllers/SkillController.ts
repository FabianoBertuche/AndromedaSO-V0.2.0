import { Request, Response } from "express";
import { SkillRegistry, Skill, SkillType } from "@andromeda/core";
import { SandboxedSkillExecutor } from "../../infrastructure/skills/SandboxedSkillExecutor";
import { buildSkillDiagnostics, isExecutableSkill } from "../../infrastructure/skills/SkillMetadata";
import { discoverLocalAgentAssets } from "../../infrastructure/agent-assets/LocalAgentAssetDiscovery";

export class SkillController {
    constructor(
        private readonly registry: SkillRegistry,
        private readonly executor: SandboxedSkillExecutor,
    ) { }

    async register(req: Request, res: Response) {
        try {
            const { id, name, description, type, schema, code } = req.body;
            const normalizedSchema = {
                ...(schema || {}),
                source: schema?.source || "manual-api",
                executionMode: schema?.executionMode || "executable",
                classification: schema?.classification || "executable",
            };
            const skill = new Skill({ id, name, description, type: type as SkillType, schema: normalizedSchema, code });
            await this.registry.register(skill);
            return res.status(201).json(skill.toJSON());
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async list(req: Request, res: Response) {
        try {
            const skills = await this.registry.listAll();
            return res.json(skills.map((s) => s.toJSON()));
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async diagnostics(req: Request, res: Response) {
        try {
            const skills = await this.registry.listAll();
            const assets = await discoverLocalAgentAssets();
            return res.json(buildSkillDiagnostics(skills, assets));
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async execute(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { input } = req.body;
            const skill = await this.registry.findById(id);

            if (!skill) return res.status(404).json({ error: "Skill não encontrada" });
            if (!isExecutableSkill(skill)) {
                return res.status(409).json({
                    error: "Skill instrucional não pode ser executada",
                    skillId: skill.getId(),
                });
            }

            const result = await this.executor.execute(skill, input || {}, {
                taskId: req.body?.taskId,
                metadata: req.body?.metadata || {},
            });

            return res.json({ result });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
}
