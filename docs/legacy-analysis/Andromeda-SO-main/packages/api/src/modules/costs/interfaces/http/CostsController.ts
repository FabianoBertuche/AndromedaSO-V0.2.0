import { Request, Response } from "express";
import { ExportCostsCsvUseCase } from "../../application/use-cases/ExportCostsCsvUseCase";
import { GetCostsByAgentUseCase } from "../../application/use-cases/GetCostsByAgentUseCase";
import { GetCostsSummaryUseCase } from "../../application/use-cases/GetCostsSummaryUseCase";
import { sendError } from "../../../../shared/http/error-response";
import { RequestWithContext } from "../../../../shared/http/request-context";

export class CostsController {
    constructor(
        private readonly getCostsSummaryUseCase: GetCostsSummaryUseCase,
        private readonly getCostsByAgentUseCase: GetCostsByAgentUseCase,
        private readonly exportCostsCsvUseCase: ExportCostsCsvUseCase,
    ) { }

    async getSummary(req: RequestWithContext, res: Response) {
        try {
            const filters = resolveFilters(req);
            const result = await this.getCostsSummaryUseCase.execute(filters);
            return res.status(200).json(result);
        } catch (error: any) {
            return sendError(req as Request, res, 400, "BAD_REQUEST", error.message || "Failed to load costs summary");
        }
    }

    async getByAgent(req: RequestWithContext, res: Response) {
        try {
            const filters = resolveFilters(req, true);
            const result = await this.getCostsByAgentUseCase.execute(filters);
            return res.status(200).json(result);
        } catch (error: any) {
            return sendError(req as Request, res, 400, "BAD_REQUEST", error.message || "Failed to load costs by agent");
        }
    }

    async exportCsv(req: RequestWithContext, res: Response) {
        try {
            const filters = resolveFilters(req, true);
            const groupBy = req.body?.groupBy === "day" ? "day" : "agent";
            const csv = await this.exportCostsCsvUseCase.execute({ ...filters, groupBy });
            const fileName = `costs-${filters.from.toISOString().slice(0, 10)}-to-${filters.to.toISOString().slice(0, 10)}.csv`;
            return res.status(200).json({
                fileName,
                contentType: "text/csv",
                data: csv,
            });
        } catch (error: any) {
            return sendError(req as Request, res, 400, "BAD_REQUEST", error.message || "Failed to export costs csv");
        }
    }
}

function resolveFilters(req: RequestWithContext, includeLimit = false) {
    const tenantId = req.tenantId || req.user?.tenantId || "default";
    const to = parseDate(typeof req.query.to === "string" ? req.query.to : req.body?.to, new Date());
    const from = parseDate(typeof req.query.from === "string" ? req.query.from : req.body?.from, new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000));
    return {
        tenantId,
        from,
        to,
        ...(includeLimit && typeof req.query.limit === "string" ? { limit: Number(req.query.limit) } : {}),
    };
}

function parseDate(value: unknown, fallback: Date): Date {
    if (typeof value !== "string" || !value.trim()) {
        return fallback;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error(`Invalid date: ${value}`);
    }
    return parsed;
}
