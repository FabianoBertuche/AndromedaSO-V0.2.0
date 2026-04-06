import { Request, Response } from "express";
import { GetAgentBudgetPolicyUseCase } from "../../application/use-cases/GetAgentBudgetPolicyUseCase";
import { GetBudgetReportUseCase } from "../../application/use-cases/GetBudgetReportUseCase";
import { UpsertAgentBudgetPolicyUseCase } from "../../application/use-cases/UpsertAgentBudgetPolicyUseCase";
import { sendError } from "../../../../shared/http/error-response";
import { RequestWithContext } from "../../../../shared/http/request-context";

export class BudgetController {
    constructor(
        private readonly getAgentBudgetPolicyUseCase: GetAgentBudgetPolicyUseCase,
        private readonly upsertAgentBudgetPolicyUseCase: UpsertAgentBudgetPolicyUseCase,
        private readonly getBudgetReportUseCase: GetBudgetReportUseCase,
    ) { }

    async getAgentBudget(req: RequestWithContext, res: Response) {
        try {
            const tenantId = requireTenantId(req);
            const policy = await this.getAgentBudgetPolicyUseCase.execute(tenantId, req.params.id);
            if (!policy) {
                return sendError(req, res, 404, "BUDGET_POLICY_NOT_FOUND", "Budget policy not found");
            }
            return res.status(200).json(policy);
        } catch (error: any) {
            return sendError(req, res, 400, "BAD_REQUEST", error.message || "Failed to load budget policy");
        }
    }

    async upsertAgentBudget(req: RequestWithContext, res: Response) {
        try {
            const tenantId = requireTenantId(req);
            const policy = await this.upsertAgentBudgetPolicyUseCase.execute({
                tenantId,
                agentId: req.params.id,
                dailyLimitUsd: toNumber(req.body?.dailyLimitUsd),
                monthlyLimitUsd: toNumber(req.body?.monthlyLimitUsd),
                currency: req.body?.currency,
                alertsEnabled: req.body?.alertsEnabled,
            });
            return res.status(200).json(policy);
        } catch (error: any) {
            return sendError(req, res, 422, "INVALID_BUDGET_LIMIT", error.message || "Invalid budget policy");
        }
    }

    async getBudgetReport(req: RequestWithContext, res: Response) {
        try {
            const tenantId = requireTenantId(req);
            const from = parseDate(req.query.from, startOfCurrentMonth());
            const to = parseDate(req.query.to, new Date());
            const report = await this.getBudgetReportUseCase.execute({
                tenantId,
                from,
                to,
                agentId: typeof req.query.agentId === "string" ? req.query.agentId : undefined,
            });
            return res.status(200).json(report);
        } catch (error: any) {
            return sendError(req, res, 400, "INVALID_REPORT_RANGE", error.message || "Invalid budget report filters");
        }
    }
}

function requireTenantId(req: RequestWithContext): string {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
        throw new Error("Tenant context required");
    }
    return tenantId;
}

function toNumber(value: unknown): number {
    if (typeof value === "number") {
        return value;
    }
    return Number(value);
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

function startOfCurrentMonth(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}
