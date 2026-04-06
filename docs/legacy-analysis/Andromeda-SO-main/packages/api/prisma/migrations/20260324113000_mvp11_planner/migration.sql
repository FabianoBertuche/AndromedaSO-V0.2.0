-- CreateTable
CREATE TABLE "execution_plans" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "taskId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalSteps" INTEGER NOT NULL DEFAULT 0,
    "completedSteps" INTEGER NOT NULL DEFAULT 0,
    "failedSteps" INTEGER NOT NULL DEFAULT 0,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "rollbackAt" TIMESTAMP(3),
    "metadata" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "execution_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_steps" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "planId" TEXT NOT NULL,
    "stepIndex" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "agentId" TEXT NOT NULL,
    "skillId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "input" JSONB,
    "output" JSONB,
    "errorMessage" TEXT,
    "dependsOn" TEXT[],
    "canRunParallel" BOOLEAN NOT NULL DEFAULT false,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "continuationInstructions" TEXT,
    "expectedOutputFormat" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 2,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_handoffs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "planId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "fromAgentId" TEXT NOT NULL,
    "toAgentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "rejectedReason" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "agent_handoffs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "execution_plans_tenantId_idx" ON "execution_plans"("tenantId");

-- CreateIndex
CREATE INDEX "execution_plans_tenantId_taskId_idx" ON "execution_plans"("tenantId", "taskId");

-- CreateIndex
CREATE INDEX "execution_plans_tenantId_agentId_idx" ON "execution_plans"("tenantId", "agentId");

-- CreateIndex
CREATE INDEX "execution_plans_tenantId_status_idx" ON "execution_plans"("tenantId", "status");

-- CreateIndex
CREATE INDEX "execution_plans_tenantId_deletedAt_idx" ON "execution_plans"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "plan_steps_tenantId_idx" ON "plan_steps"("tenantId");

-- CreateIndex
CREATE INDEX "plan_steps_tenantId_planId_idx" ON "plan_steps"("tenantId", "planId");

-- CreateIndex
CREATE INDEX "plan_steps_tenantId_agentId_idx" ON "plan_steps"("tenantId", "agentId");

-- CreateIndex
CREATE INDEX "plan_steps_tenantId_status_idx" ON "plan_steps"("tenantId", "status");

-- CreateIndex
CREATE INDEX "plan_steps_tenantId_deletedAt_idx" ON "plan_steps"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "plan_steps_planId_stepIndex_key" ON "plan_steps"("planId", "stepIndex");

-- CreateIndex
CREATE INDEX "agent_handoffs_tenantId_idx" ON "agent_handoffs"("tenantId");

-- CreateIndex
CREATE INDEX "agent_handoffs_tenantId_planId_idx" ON "agent_handoffs"("tenantId", "planId");

-- CreateIndex
CREATE INDEX "agent_handoffs_tenantId_stepId_idx" ON "agent_handoffs"("tenantId", "stepId");

-- CreateIndex
CREATE INDEX "agent_handoffs_tenantId_fromAgentId_idx" ON "agent_handoffs"("tenantId", "fromAgentId");

-- CreateIndex
CREATE INDEX "agent_handoffs_tenantId_toAgentId_idx" ON "agent_handoffs"("tenantId", "toAgentId");

-- CreateIndex
CREATE INDEX "agent_handoffs_tenantId_status_idx" ON "agent_handoffs"("tenantId", "status");

-- CreateIndex
CREATE INDEX "agent_handoffs_tenantId_deletedAt_idx" ON "agent_handoffs"("tenantId", "deletedAt");

-- AddForeignKey
ALTER TABLE "plan_steps" ADD CONSTRAINT "plan_steps_planId_fkey" FOREIGN KEY ("planId") REFERENCES "execution_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_handoffs" ADD CONSTRAINT "agent_handoffs_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "plan_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
