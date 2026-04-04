# Product — Andromeda SO

Andromeda SO is a modular, agent-driven operating system platform. It provides a kernel that manages the lifecycle of pluggable modules (channels, LLM providers, etc.) and coordinates a pool of specialized AI agents to decompose and execute tasks.

## Core Concepts

- **Kernel**: Central runtime that discovers, registers, and manages module lifecycles via a state machine.
- **Modules**: Self-contained plugins declared via YAML manifests. Grouped by type (channels, providers) and activated by the kernel.
- **Agent Orchestration**: A pool of role-based agents (planner, designer, coder, reviewer, copywriter) collaborate via a message bus to handle decomposed tasks.
- **Evolution Service**: Tracks agent reputation and task outcomes over time.
- **Frontend Dashboard**: React-based UI for monitoring kernel status, modules, providers, and orchestrator activity.

## Development Philosophy

- Spec-Driven Development (SDD): all features must start from an approved spec.
- Test-Driven Development (TDD): tests are written before implementation; no code without a contract.
- Modular growth: features are small, traceable, and linked by explicit dependencies.
