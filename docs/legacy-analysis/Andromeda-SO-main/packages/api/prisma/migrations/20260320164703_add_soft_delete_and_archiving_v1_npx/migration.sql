-- AlterTable
ALTER TABLE "agent_sandbox_configs" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "communication_messages" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "communication_sessions" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "knowledge_chunks" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "knowledge_collections" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "knowledge_documents" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "memory_entries" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "memory_policies" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "sandbox_executions" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "sandbox_profiles" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "agent_sandbox_configs_deletedAt_idx" ON "agent_sandbox_configs"("deletedAt");

-- CreateIndex
CREATE INDEX "communication_messages_deletedAt_idx" ON "communication_messages"("deletedAt");

-- CreateIndex
CREATE INDEX "communication_sessions_deletedAt_idx" ON "communication_sessions"("deletedAt");

-- CreateIndex
CREATE INDEX "knowledge_chunks_deletedAt_idx" ON "knowledge_chunks"("deletedAt");

-- CreateIndex
CREATE INDEX "knowledge_collections_deletedAt_idx" ON "knowledge_collections"("deletedAt");

-- CreateIndex
CREATE INDEX "knowledge_documents_deletedAt_idx" ON "knowledge_documents"("deletedAt");

-- CreateIndex
CREATE INDEX "memory_entries_deletedAt_idx" ON "memory_entries"("deletedAt");

-- CreateIndex
CREATE INDEX "sandbox_executions_deletedAt_idx" ON "sandbox_executions"("deletedAt");

-- CreateIndex
CREATE INDEX "sandbox_profiles_deletedAt_idx" ON "sandbox_profiles"("deletedAt");
