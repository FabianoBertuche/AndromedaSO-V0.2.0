import { MessageRepository } from "../domain/types";

export const PT_BR_MESSAGES: Array<{ key: string; value: string; category: string }> = [
    // system
    { key: "task.created", value: "Tarefa criada com sucesso", category: "system" },
    { key: "task.completed", value: "Tarefa concluída com sucesso", category: "system" },
    { key: "task.failed", value: "Falha ao executar tarefa", category: "system" },
    { key: "task.cancelled", value: "Tarefa cancelada", category: "system" },
    { key: "task.in_progress", value: "Tarefa em andamento", category: "system" },
    { key: "task.pending", value: "Tarefa aguardando execução", category: "system" },

    // agent.error.*
    { key: "agent.error.budget_exceeded", value: "Orçamento do agente excedido", category: "system" },
    { key: "agent.error.timeout", value: "Tempo limite de execução excedido", category: "system" },
    { key: "agent.error.not_found", value: "Agente não encontrado", category: "system" },
    { key: "agent.error.conformance_failed", value: "Falha de conformidade do agente", category: "system" },

    // notification
    { key: "budget.warning", value: "Aviso: Orçamento próximo do limite", category: "notification" },
    { key: "budget.exceeded", value: "Orçamento excedido", category: "notification" },
    { key: "health.degraded", value: "Saúde do sistema degradada", category: "notification" },
    { key: "health.recovered", value: "Sistema recuperado", category: "notification" },

    // error validation.*
    { key: "validation.required", value: "Campo obrigatório não informado", category: "error" },
    { key: "validation.invalid_format", value: "Formato inválido", category: "error" },
    { key: "validation.min_length", value: "Valor muito curto", category: "error" },
    { key: "validation.max_length", value: "Valor muito longo", category: "error" },

    // error auth.*
    { key: "auth.unauthorized", value: "Não autorizado", category: "error" },
    { key: "auth.forbidden", value: "Acesso negado", category: "error" },
    { key: "auth.token_expired", value: "Token expirado", category: "error" },
    { key: "auth.invalid_credentials", value: "Credenciais inválidas", category: "error" },

    // error rate_limit.*
    { key: "rate_limit.exceeded", value: "Limite de requisições excedido", category: "error" },
    { key: "rate_limit.retry_after", value: "Tente novamente em {{seconds}} segundos", category: "error" },
];

export async function seedPtBrMessages(repo: MessageRepository): Promise<number> {
    const messages = PT_BR_MESSAGES.map((msg) => ({
        ...msg,
        locale: "pt-BR",
    }));

    return repo.createMany(messages);
}