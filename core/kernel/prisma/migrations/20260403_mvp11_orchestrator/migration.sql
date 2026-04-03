-- MVP11 Multi-Agent Orchestration
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'running', 'completed', 'conflict', 'human_fallback');

CREATE TABLE "MultiTask" (
  "id" TEXT PRIMARY KEY,
  "status" "TaskStatus" NOT NULL DEFAULT 'pending',
  "subtasks" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AgentMultiTask" (
  "id" TEXT PRIMARY KEY,
  "agentId" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  CONSTRAINT "AgentMultiTask_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "MultiTask"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX "AgentMultiTask_agentId_idx" ON "AgentMultiTask"("agentId");
CREATE INDEX "AgentMultiTask_taskId_idx" ON "AgentMultiTask"("taskId");
