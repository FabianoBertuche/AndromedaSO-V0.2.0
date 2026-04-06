-- CreateTable
CREATE TABLE "sandbox_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "isSystem" BOOLEAN NOT NULL,
    "mode" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sandbox_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_sandbox_configs" (
    "agentId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "profileId" TEXT,
    "overrides" JSONB NOT NULL,
    "enforcement" JSONB NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_sandbox_configs_pkey" PRIMARY KEY ("agentId")
);

-- CreateTable
CREATE TABLE "sandbox_executions" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "taskId" TEXT,
    "skillId" TEXT,
    "capability" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "command" JSONB NOT NULL,
    "policySnapshot" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "exitCode" INTEGER,
    "resourceUsage" JSONB,
    "errorMessage" TEXT,
    "stdout" TEXT,
    "stderr" TEXT,
    "tenantId" TEXT NOT NULL DEFAULT 'default',

    CONSTRAINT "sandbox_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sandbox_artifacts" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "mimeType" TEXT,
    "retainedUntil" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "sandbox_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_requests" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "taskId" TEXT,
    "executionId" TEXT,
    "reason" TEXT NOT NULL,
    "requestedAction" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),

    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_entries" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "agentId" TEXT,
    "taskId" TEXT,
    "sessionId" TEXT,
    "projectId" TEXT,
    "userId" TEXT,
    "teamId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "tags" JSONB NOT NULL,
    "source" TEXT NOT NULL,
    "sourceEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isPinned" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "importanceScore" DOUBLE PRECISION NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "metadata" JSONB NOT NULL,

    CONSTRAINT "memory_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_links" (
    "id" TEXT NOT NULL,
    "memoryEntryId" TEXT NOT NULL,
    "linkedEntityType" TEXT NOT NULL,
    "linkedEntityId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_retrieval_records" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "agentId" TEXT,
    "sessionId" TEXT,
    "memoryEntryId" TEXT NOT NULL,
    "retrievalReason" TEXT NOT NULL,
    "retrievalScore" DOUBLE PRECISION NOT NULL,
    "usedInPromptAssembly" BOOLEAN NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_retrieval_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memory_policies" (
    "id" TEXT NOT NULL,
    "memoryType" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "retentionMode" TEXT NOT NULL,
    "ttlDays" INTEGER,
    "maxEntries" INTEGER,
    "allowAutoPromotion" BOOLEAN NOT NULL,
    "allowManualPin" BOOLEAN NOT NULL,
    "allowSemanticExtraction" BOOLEAN NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_collections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_documents" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourcePath" TEXT,
    "mimeType" TEXT,
    "rawText" TEXT,
    "checksum" TEXT,
    "status" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_chunks" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "tokenEstimate" INTEGER,
    "embeddingRef" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retrieval_records" (
    "id" TEXT NOT NULL,
    "taskId" TEXT,
    "sessionId" TEXT,
    "agentId" TEXT,
    "query" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "selectedChunkIds" TEXT NOT NULL,
    "selectedDocumentIds" TEXT NOT NULL,
    "scoreSummary" JSONB NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retrieval_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_knowledge_policies" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "knowledgeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "vaultReadEnabled" BOOLEAN NOT NULL DEFAULT false,
    "vaultWriteEnabled" BOOLEAN NOT NULL DEFAULT false,
    "writeMode" TEXT NOT NULL DEFAULT 'disabled',
    "approvalRequired" BOOLEAN NOT NULL DEFAULT true,
    "allowedCollectionIds" TEXT NOT NULL,
    "allowedPaths" TEXT NOT NULL,
    "maxChunks" INTEGER NOT NULL DEFAULT 5,
    "maxContextTokens" INTEGER NOT NULL DEFAULT 2000,
    "rerankEnabled" BOOLEAN NOT NULL DEFAULT false,
    "preferMemoryOverKnowledge" BOOLEAN NOT NULL DEFAULT true,
    "preferKnowledgeOverMemory" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_knowledge_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_sessions" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "externalSessionId" TEXT,
    "internalUserId" TEXT,
    "externalUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3),
    "context" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "tenantId" TEXT NOT NULL DEFAULT 'default',

    CONSTRAINT "communication_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "sender" JSONB NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sandbox_profiles_tenantId_idx" ON "sandbox_profiles"("tenantId");

-- CreateIndex
CREATE INDEX "agent_sandbox_configs_tenantId_idx" ON "agent_sandbox_configs"("tenantId");

-- CreateIndex
CREATE INDEX "sandbox_executions_tenantId_idx" ON "sandbox_executions"("tenantId");

-- CreateIndex
CREATE INDEX "sandbox_executions_agentId_idx" ON "sandbox_executions"("agentId");

-- CreateIndex
CREATE INDEX "sandbox_executions_taskId_idx" ON "sandbox_executions"("taskId");

-- CreateIndex
CREATE INDEX "sandbox_artifacts_executionId_idx" ON "sandbox_artifacts"("executionId");

-- CreateIndex
CREATE INDEX "approval_requests_agentId_idx" ON "approval_requests"("agentId");

-- CreateIndex
CREATE INDEX "approval_requests_taskId_idx" ON "approval_requests"("taskId");

-- CreateIndex
CREATE INDEX "approval_requests_executionId_idx" ON "approval_requests"("executionId");

-- CreateIndex
CREATE INDEX "memory_entries_tenantId_idx" ON "memory_entries"("tenantId");

-- CreateIndex
CREATE INDEX "memory_entries_type_idx" ON "memory_entries"("type");

-- CreateIndex
CREATE INDEX "memory_entries_scopeType_scopeId_idx" ON "memory_entries"("scopeType", "scopeId");

-- CreateIndex
CREATE INDEX "memory_entries_agentId_idx" ON "memory_entries"("agentId");

-- CreateIndex
CREATE INDEX "memory_entries_taskId_idx" ON "memory_entries"("taskId");

-- CreateIndex
CREATE INDEX "memory_entries_sessionId_idx" ON "memory_entries"("sessionId");

-- CreateIndex
CREATE INDEX "memory_entries_projectId_idx" ON "memory_entries"("projectId");

-- CreateIndex
CREATE INDEX "memory_entries_userId_idx" ON "memory_entries"("userId");

-- CreateIndex
CREATE INDEX "memory_entries_teamId_idx" ON "memory_entries"("teamId");

-- CreateIndex
CREATE INDEX "memory_entries_status_isPinned_idx" ON "memory_entries"("status", "isPinned");

-- CreateIndex
CREATE INDEX "memory_links_memoryEntryId_idx" ON "memory_links"("memoryEntryId");

-- CreateIndex
CREATE INDEX "memory_links_tenantId_idx" ON "memory_links"("tenantId");

-- CreateIndex
CREATE INDEX "memory_links_linkedEntityType_linkedEntityId_idx" ON "memory_links"("linkedEntityType", "linkedEntityId");

-- CreateIndex
CREATE INDEX "memory_retrieval_records_taskId_idx" ON "memory_retrieval_records"("taskId");

-- CreateIndex
CREATE INDEX "memory_retrieval_records_tenantId_idx" ON "memory_retrieval_records"("tenantId");

-- CreateIndex
CREATE INDEX "memory_retrieval_records_agentId_idx" ON "memory_retrieval_records"("agentId");

-- CreateIndex
CREATE INDEX "memory_retrieval_records_sessionId_idx" ON "memory_retrieval_records"("sessionId");

-- CreateIndex
CREATE INDEX "memory_retrieval_records_memoryEntryId_idx" ON "memory_retrieval_records"("memoryEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "memory_policies_tenantId_memoryType_scopeType_key" ON "memory_policies"("tenantId", "memoryType", "scopeType");

-- CreateIndex
CREATE INDEX "knowledge_collections_tenantId_idx" ON "knowledge_collections"("tenantId");

-- CreateIndex
CREATE INDEX "knowledge_documents_collectionId_idx" ON "knowledge_documents"("collectionId");

-- CreateIndex
CREATE INDEX "knowledge_chunks_documentId_idx" ON "knowledge_chunks"("documentId");

-- CreateIndex
CREATE INDEX "retrieval_records_tenantId_idx" ON "retrieval_records"("tenantId");

-- CreateIndex
CREATE INDEX "retrieval_records_agentId_idx" ON "retrieval_records"("agentId");

-- CreateIndex
CREATE INDEX "retrieval_records_taskId_idx" ON "retrieval_records"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_knowledge_policies_agentId_key" ON "agent_knowledge_policies"("agentId");

-- CreateIndex
CREATE INDEX "agent_knowledge_policies_tenantId_idx" ON "agent_knowledge_policies"("tenantId");

-- CreateIndex
CREATE INDEX "communication_sessions_tenantId_idx" ON "communication_sessions"("tenantId");

-- CreateIndex
CREATE INDEX "communication_messages_tenantId_idx" ON "communication_messages"("tenantId");

-- CreateIndex
CREATE INDEX "communication_messages_sessionId_idx" ON "communication_messages"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_tenantId_idx" ON "api_keys"("tenantId");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- AddForeignKey
ALTER TABLE "agent_sandbox_configs" ADD CONSTRAINT "agent_sandbox_configs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "sandbox_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sandbox_artifacts" ADD CONSTRAINT "sandbox_artifacts_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "sandbox_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "sandbox_executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_links" ADD CONSTRAINT "memory_links_memoryEntryId_fkey" FOREIGN KEY ("memoryEntryId") REFERENCES "memory_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_retrieval_records" ADD CONSTRAINT "memory_retrieval_records_memoryEntryId_fkey" FOREIGN KEY ("memoryEntryId") REFERENCES "memory_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "knowledge_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "knowledge_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "communication_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
