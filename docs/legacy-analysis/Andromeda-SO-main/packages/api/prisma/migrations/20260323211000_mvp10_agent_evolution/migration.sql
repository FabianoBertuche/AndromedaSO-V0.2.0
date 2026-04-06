-- CreateTable
CREATE TABLE "agent_budget_policies" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "agentId" TEXT NOT NULL,
    "dailyLimitUsd" DECIMAL(12,4) NOT NULL,
    "monthlyLimitUsd" DECIMAL(12,4) NOT NULL,
    "dailySpentUsd" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "monthlySpentUsd" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "alertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastDailyResetAt" TIMESTAMP(3),
    "lastMonthlyResetAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "agent_budget_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_versions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "agentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "sourceVersionLabel" TEXT,
    "snapshot" JSONB NOT NULL,
    "changeSummary" TEXT NOT NULL,
    "restoredFromVersionNumber" INTEGER,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "agent_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_feedback" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "taskId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "metadata" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "task_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_performance_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "agentId" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "tasksTotal" INTEGER NOT NULL DEFAULT 0,
    "tasksSucceeded" INTEGER NOT NULL DEFAULT 0,
    "tasksFailed" INTEGER NOT NULL DEFAULT 0,
    "successRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "avgConformance" DECIMAL(5,4),
    "feedbackScore" DECIMAL(5,4),
    "avgLatencyMs" INTEGER,
    "totalTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "totalCostUsd" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "reputationScores" JSONB,
    "reputationUpdatedAt" TIMESTAMP(3),
    "metricsSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "agent_performance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playbook_suggestions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "agentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "proposedChange" JSONB NOT NULL,
    "confidence" DECIMAL(4,3) NOT NULL,
    "status" TEXT NOT NULL,
    "sourceEpisodeIds" JSONB,
    "analysisPayload" JSONB,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "playbook_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_execution_ledger" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "taskId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "sessionId" TEXT,
    "capability" TEXT,
    "status" TEXT NOT NULL,
    "model" TEXT,
    "provider" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "latencyMs" INTEGER,
    "costUsd" DECIMAL(12,4),
    "conformanceScore" DECIMAL(5,4),
    "feedbackRating" INTEGER,
    "executionStartedAt" TIMESTAMP(3),
    "executionCompletedAt" TIMESTAMP(3),
    "resultSnapshot" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "agent_execution_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_budget_policies_tenantId_idx" ON "agent_budget_policies"("tenantId");

-- CreateIndex
CREATE INDEX "agent_budget_policies_tenantId_agentId_idx" ON "agent_budget_policies"("tenantId", "agentId");

-- CreateIndex
CREATE INDEX "agent_budget_policies_tenantId_deletedAt_idx" ON "agent_budget_policies"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "agent_budget_policies_tenantId_agentId_key" ON "agent_budget_policies"("tenantId", "agentId");

-- CreateIndex
CREATE INDEX "agent_versions_tenantId_idx" ON "agent_versions"("tenantId");

-- CreateIndex
CREATE INDEX "agent_versions_tenantId_agentId_idx" ON "agent_versions"("tenantId", "agentId");

-- CreateIndex
CREATE INDEX "agent_versions_tenantId_agentId_createdAt_idx" ON "agent_versions"("tenantId", "agentId", "createdAt");

-- CreateIndex
CREATE INDEX "agent_versions_tenantId_deletedAt_idx" ON "agent_versions"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "agent_versions_tenantId_agentId_versionNumber_key" ON "agent_versions"("tenantId", "agentId", "versionNumber");

-- CreateIndex
CREATE INDEX "task_feedback_tenantId_idx" ON "task_feedback"("tenantId");

-- CreateIndex
CREATE INDEX "task_feedback_tenantId_agentId_idx" ON "task_feedback"("tenantId", "agentId");

-- CreateIndex
CREATE INDEX "task_feedback_tenantId_taskId_idx" ON "task_feedback"("tenantId", "taskId");

-- CreateIndex
CREATE INDEX "task_feedback_tenantId_submittedAt_idx" ON "task_feedback"("tenantId", "submittedAt");

-- CreateIndex
CREATE INDEX "task_feedback_tenantId_deletedAt_idx" ON "task_feedback"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "task_feedback_tenantId_taskId_userId_key" ON "task_feedback"("tenantId", "taskId", "userId");

-- CreateIndex
CREATE INDEX "agent_performance_records_tenantId_idx" ON "agent_performance_records"("tenantId");

-- CreateIndex
CREATE INDEX "agent_performance_records_tenantId_agentId_idx" ON "agent_performance_records"("tenantId", "agentId");

-- CreateIndex
CREATE INDEX "agent_performance_records_tenantId_periodType_periodStart_idx" ON "agent_performance_records"("tenantId", "periodType", "periodStart");

-- CreateIndex
CREATE INDEX "agent_performance_records_tenantId_deletedAt_idx" ON "agent_performance_records"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "agent_performance_records_tenantId_agentId_periodType_perio_key" ON "agent_performance_records"("tenantId", "agentId", "periodType", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "playbook_suggestions_tenantId_idx" ON "playbook_suggestions"("tenantId");

-- CreateIndex
CREATE INDEX "playbook_suggestions_tenantId_agentId_idx" ON "playbook_suggestions"("tenantId", "agentId");

-- CreateIndex
CREATE INDEX "playbook_suggestions_tenantId_status_idx" ON "playbook_suggestions"("tenantId", "status");

-- CreateIndex
CREATE INDEX "playbook_suggestions_tenantId_confidence_idx" ON "playbook_suggestions"("tenantId", "confidence");

-- CreateIndex
CREATE INDEX "playbook_suggestions_tenantId_deletedAt_idx" ON "playbook_suggestions"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "agent_execution_ledger_tenantId_idx" ON "agent_execution_ledger"("tenantId");

-- CreateIndex
CREATE INDEX "agent_execution_ledger_tenantId_agentId_idx" ON "agent_execution_ledger"("tenantId", "agentId");

-- CreateIndex
CREATE INDEX "agent_execution_ledger_tenantId_executionCompletedAt_idx" ON "agent_execution_ledger"("tenantId", "executionCompletedAt");

-- CreateIndex
CREATE INDEX "agent_execution_ledger_tenantId_status_idx" ON "agent_execution_ledger"("tenantId", "status");

-- CreateIndex
CREATE INDEX "agent_execution_ledger_tenantId_deletedAt_idx" ON "agent_execution_ledger"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "agent_execution_ledger_tenantId_taskId_key" ON "agent_execution_ledger"("tenantId", "taskId");
