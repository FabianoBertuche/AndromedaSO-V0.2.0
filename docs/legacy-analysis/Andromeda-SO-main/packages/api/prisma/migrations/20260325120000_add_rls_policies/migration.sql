-- Row Level Security (RLS) para isolamento multi-tenant
-- LEI 03: Blindagem Multi-Tenant
-- LEI 12: RLS Policies

-- Habilitar RLS em todas as tabelas com tenantId
ALTER TABLE "sandbox_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agent_sandbox_configs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sandbox_executions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memory_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memory_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memory_retrieval_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memory_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "knowledge_collections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "knowledge_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "knowledge_chunks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "retrieval_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agent_knowledge_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "communication_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "communication_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "api_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agent_budget_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agent_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "task_feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agent_performance_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "playbook_suggestions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agent_execution_ledger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "execution_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "plan_steps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agent_handoffs" ENABLE ROW LEVEL SECURITY;

-- Criar função auxiliar para extrair company_id do JWT
CREATE OR REPLACE FUNCTION auth_company_id() RETURNS TEXT AS $$
BEGIN
    -- Extrai tenantId do JWT do usuário autenticado
    -- Retorna 'default' se não houver contexto de autenticação
    RETURN COALESCE(
        current_setting('app.current_tenant', true),
        'default'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas RLS para sandbox_profiles
CREATE POLICY "tenant_isolation_sandbox_profiles" ON "sandbox_profiles"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_agent_sandbox_configs" ON "agent_sandbox_configs"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_sandbox_executions" ON "sandbox_executions"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_memory_entries" ON "memory_entries"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_memory_links" ON "memory_links"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_memory_retrieval_records" ON "memory_retrieval_records"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_memory_policies" ON "memory_policies"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_knowledge_collections" ON "knowledge_collections"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_knowledge_documents" ON "knowledge_documents"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_knowledge_chunks" ON "knowledge_chunks"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_retrieval_records" ON "retrieval_records"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_agent_knowledge_policies" ON "agent_knowledge_policies"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_communication_sessions" ON "communication_sessions"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_communication_messages" ON "communication_messages"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_users" ON "users"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_api_keys" ON "api_keys"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_agent_budget_policies" ON "agent_budget_policies"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_agent_versions" ON "agent_versions"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_task_feedback" ON "task_feedback"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_agent_performance_records" ON "agent_performance_records"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_playbook_suggestions" ON "playbook_suggestions"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_agent_execution_ledger" ON "agent_execution_ledger"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_audit_logs" ON "audit_logs"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_execution_plans" ON "execution_plans"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_plan_steps" ON "plan_steps"
    FOR ALL USING ("tenantId" = auth_company_id());

CREATE POLICY "tenant_isolation_agent_handoffs" ON "agent_handoffs"
    FOR ALL USING ("tenantId" = auth_company_id());

-- Refresh tokens herdam tenantId do user
CREATE POLICY "tenant_isolation_refresh_tokens" ON "refresh_tokens"
    FOR ALL USING (
        "userId" IN (
            SELECT id FROM "users" WHERE "tenantId" = auth_company_id()
        )
    );