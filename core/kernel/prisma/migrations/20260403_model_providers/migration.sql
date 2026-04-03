-- MVP04 Model Providers Management v2.0
CREATE TABLE "Provider" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "displayName" TEXT NOT NULL,
  "apiBase" TEXT,
  "apiKeyEnc" TEXT,
  "health" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ModelCatalogItem" (
  "id" TEXT PRIMARY KEY,
  "providerId" TEXT NOT NULL,
  "modelId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "capability" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "latencyMs" INTEGER NOT NULL DEFAULT 0,
  "costUSD" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ModelCatalogItem_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ModelCatalogItem_providerId_idx" ON "ModelCatalogItem"("providerId");
CREATE INDEX "ModelCatalogItem_modelId_idx" ON "ModelCatalogItem"("modelId");

CREATE TABLE "ModelBenchmarkResult" (
  "id" TEXT PRIMARY KEY,
  "modelId" TEXT NOT NULL,
  "taskType" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "latencyMs" INTEGER NOT NULL,
  "tokensIn" INTEGER NOT NULL,
  "tokensOut" INTEGER NOT NULL,
  "costUSD" DOUBLE PRECISION,
  "success" BOOLEAN NOT NULL DEFAULT true,
  "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
