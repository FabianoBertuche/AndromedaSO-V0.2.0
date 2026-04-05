# Contract: Module Manifest

## File Name

`module.manifest.yaml`

## Required fields

```yaml
id: providers.openai-api
name: OpenAI API Provider
group: providers
variant: openai-api
version: 1.0.0
entrypoint: ./adapter/index.js
contracts:
  input: ./contracts/input.json
  output: ./contracts/output.json
capabilities:
  - chat
  - embeddings
status: active
critical: false
dependencies: []
```

## Validation rules

- `id`, `name`, `group`, `variant` e `entrypoint` são obrigatórios e não vazios.
- `version` deve estar em formato semver.
- `contracts.input` e `contracts.output` identificam os contratos canônicos consumidos pelo core.
- `capabilities` é uma lista de strings.
- `status` aceita `active`, `disabled` ou `deprecated`.
- `critical` define se falhas bloqueiam subsistemas dependentes.
- `dependencies` declara IDs de módulos dependentes e não pode formar ciclos.

## Discovery semantics

- O core considera descobrível toda raiz de módulo que contenha `module.manifest.yaml` válido.
- Apenas módulos válidos e habilitados entram automaticamente no registry.
- Variantes incompatíveis por versão e dependências circulares são rejeitadas durante a validação.

## Operational expectation

O manifesto é o único contrato obrigatório para o discovery. O core pode evoluir para suportar novos tipos de módulo, mas deve continuar dependendo apenas de manifesto, contratos, capacidades registradas e regras de validação canônicas.
