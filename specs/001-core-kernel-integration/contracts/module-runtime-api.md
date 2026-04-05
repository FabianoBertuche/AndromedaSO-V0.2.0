# Contract: Module Runtime API

## Base Path

`/api/modules`

## Endpoints

### `POST /discover`

Descobre módulos a partir de uma raiz no filesystem e registra apenas os válidos e habilitados.

**Request body**

```json
{
  "rootPath": "C:/FB/Andromeda SO V0.2.0/modules"
}
```

**Success response**

```json
{
  "registered": [
    {
      "id": "providers.openai-api",
      "group": "providers",
      "variant": "openai-api",
      "state": "registered"
    }
  ]
}
```

### `GET /`

Lista módulos presentes no registry operacional.

**Success response**

```json
{
  "modules": []
}
```

### `GET /:id`

Retorna os metadados e o estado atual de um módulo registrado.

### `POST /:id/validate`

Executa validação de manifesto, contratos, dependências e compatibilidade de variante.

**Success response**

```json
{
  "valid": true,
  "state": "validated"
}
```

**Failure response**

```json
{
  "valid": false,
  "error": "Circular dependency detected"
}
```

### `POST /:id/load`

Carrega o módulo previamente validado.

### `POST /:id/start`

Inicializa o módulo e o coloca em execução.

### `POST /:id/stop`

Solicita parada controlada e liberação de recursos.

### `GET /:id/status`

Retorna apenas o estado do lifecycle.

**Success response**

```json
{
  "state": "running"
}
```

## Error Semantics

- `400`: entrada inválida ou falha de validação.
- `404`: módulo não encontrado no registry.
- `500`: falha operacional durante carga, start ou stop.

## Notes

- Módulos críticos podem bloquear subsistemas dependentes quando falham em validação ou carregamento.
- O contrato HTTP expõe apenas estados e erros canônicos; detalhes internos da variante não devem vazar pela API.
