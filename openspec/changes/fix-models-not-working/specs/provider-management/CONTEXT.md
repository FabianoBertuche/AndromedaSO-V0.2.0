# Provider Management

## Overview

This capability covers the management of AI providers in the system. Providers are external AI services (OpenAI, Ollama, Azure OpenAI, etc.) that provide access to models for inference and other AI tasks.

## Key Concepts

- **Provider**: An external AI service identified by `type` (e.g., "openai", "ollama", "azure-openai")
- **Provider Name**: A unique identifier for a provider instance within the system
- **Duplicate Provider**: A provider with the same name AND type as an existing provider

## Technical Details

**Implementation:** `core/kernel/src/modules/providers/services/providerOrchestratorService.ts`

**Repository Interface:** `core/kernel/src/modules/providers/domain/repositories/provider.repository.ts`

**Route Handler:** `core/kernel/src/routes/providers/index.ts`
