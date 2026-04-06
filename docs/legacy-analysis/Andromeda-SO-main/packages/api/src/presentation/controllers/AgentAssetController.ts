import { Request, Response } from "express";
import { discoverLocalAgentAssets } from "../../infrastructure/agent-assets/LocalAgentAssetDiscovery";

export class AgentAssetController {
    async diagnostics(_req: Request, res: Response) {
        try {
            const diagnostics = await discoverLocalAgentAssets();
            return res.json(diagnostics);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
}
