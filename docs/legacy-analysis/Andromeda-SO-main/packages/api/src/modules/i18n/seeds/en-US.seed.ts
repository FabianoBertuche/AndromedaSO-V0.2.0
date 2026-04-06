import { MessageRepository } from "../domain/types";

export const EN_US_MESSAGES: Array<{ key: string; value: string; category: string }> = [
    // system
    { key: "task.created", value: "Task created successfully", category: "system" },
    { key: "task.completed", value: "Task completed successfully", category: "system" },
    { key: "task.failed", value: "Task execution failed", category: "system" },
    { key: "task.cancelled", value: "Task cancelled", category: "system" },
    { key: "task.in_progress", value: "Task in progress", category: "system" },
    { key: "task.pending", value: "Task pending execution", category: "system" },

    // agent.error.*
    { key: "agent.error.budget_exceeded", value: "Agent budget exceeded", category: "system" },
    { key: "agent.error.timeout", value: "Execution timeout exceeded", category: "system" },
    { key: "agent.error.not_found", value: "Agent not found", category: "system" },
    { key: "agent.error.conformance_failed", value: "Agent conformance check failed", category: "system" },

    // notification
    { key: "budget.warning", value: "Warning: Budget near limit", category: "notification" },
    { key: "budget.exceeded", value: "Budget exceeded", category: "notification" },
    { key: "health.degraded", value: "System health degraded", category: "notification" },
    { key: "health.recovered", value: "System recovered", category: "notification" },

    // error validation.*
    { key: "validation.required", value: "Required field not provided", category: "error" },
    { key: "validation.invalid_format", value: "Invalid format", category: "error" },
    { key: "validation.min_length", value: "Value too short", category: "error" },
    { key: "validation.max_length", value: "Value too long", category: "error" },

    // error auth.*
    { key: "auth.unauthorized", value: "Unauthorized", category: "error" },
    { key: "auth.forbidden", value: "Access denied", category: "error" },
    { key: "auth.token_expired", value: "Token expired", category: "error" },
    { key: "auth.invalid_credentials", value: "Invalid credentials", category: "error" },

    // error rate_limit.*
    { key: "rate_limit.exceeded", value: "Rate limit exceeded", category: "error" },
    { key: "rate_limit.retry_after", value: "Retry after {{seconds}} seconds", category: "error" },
];

export async function seedEnUsMessages(repo: MessageRepository): Promise<number> {
    const messages = EN_US_MESSAGES.map((msg) => ({
        ...msg,
        locale: "en-US",
    }));

    return repo.createMany(messages);
}