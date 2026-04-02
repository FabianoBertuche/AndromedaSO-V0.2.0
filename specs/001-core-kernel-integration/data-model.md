# Data Model: Core Kernel Integration

## Entity: Module
- id (UUID)
- name (string)
- group (string)
- variant (string)
- version (string, semver)
- entrypoint (string)
- path (string)
- contracts (JSON object)
- dependencies (array of module ids / names)
- critical (boolean)
- enabled (boolean)
- status (enum)
- last_seen (timestamp)

## Entity: Contract
- id (UUID)
- module_id (FK Module.id)
- name (string)
- input_schema (Zod / JSON Schema)
- output_schema (Zod / JSON Schema)
- version (string)
- created_at

## Entity: RegistryEntry
- id (UUID)
- module_id (FK Module.id)
- status (enum: discovered/registered/validated/loaded/initialized/running/stopped/failed)
- metadata (JSON)
- registered_at
- last_updated

## Entity: LifecycleEvent
- id
- module_id
- state_from
- state_to
- timestamp
- reason
- context

## Entity: Group
- name
- description
- policies

## Entity: Variant
- module_id
- name
- compatibility
- contract_overrides
