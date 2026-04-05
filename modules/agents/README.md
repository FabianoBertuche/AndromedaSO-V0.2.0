# Agents Module

This module provides the declarative foundation for the agent system in Andromeda SO V0.2.0.

## Structure

```
modules/agents/
├── module.manifest.yaml          # Module manifest
├── README.md                      # This file
├── contracts/                     # Contract definitions
│   ├── agent-instance.contract.json
│   ├── agent-template.contract.json
│   └── resolved-agent.contract.json
└── groups/                        # Agent groups
    └── default/                   # Default group
        └── variants/
            └── base/             # Base variant
                └── templates/    # Agent templates
                    ├── assistant/
                    └── reviewer/
```

## Templates

Templates are discovered at runtime from the `groups/*/variants/*/templates/*/template.manifest.yaml` pattern.

### Adding a New Template

1. Create a new directory under `groups/default/variants/base/templates/<template-id>/`
2. Add a `template.manifest.yaml` file
3. Add configuration, metadata, tests, and scenarios
4. The template will be automatically discovered on next startup

## Contracts

The module defines three main contracts:

1. **AgentInstance** (`agent-instance.contract.json`): Defines the structure of a created agent instance
2. **AgentTemplate** (`agent-template.contract.json`): Defines the structure of a template manifest
3. **ResolvedAgent** (`resolved-agent.contract.json`): Defines the structure of a resolved agent configuration

## Architecture

- **Groups**: Logical groupings of agent variants (e.g., `default`, `specialized`)
- **Variants**: Implementation strategies within a group (e.g., `base`, `regulated`)
- **Templates**: Concrete agent definitions ready for instantiation

The module follows a declarative approach where adding new templates requires no code changes.
