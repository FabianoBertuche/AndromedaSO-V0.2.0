---
name: sdd-propose
description: Workflow para criar nova spec/proposta de feature. Use quando o usuário quer adicionar uma nova funcionalidade mas não existe spec.
---

# SDD Propose Workflow

## Quando Usar

- Usuário quer "adicionar feature X"
- Usuário quer "criar algo novo"
- Não existe spec para o que o usuário quer
- Usuário menciona "precisamos de" ou "seria legal ter"

## O Que Faz

Cria uma nova spec em `.kiro/specs/{feature-name}/` com:
- `requirements.md` — o que e por quê
- `design.md` — como fazer (opcional para proposta inicial)
- `tasks.md` — lista de tasks

## NÃO Faz

- Não implementa — só cria a proposta
- Não aprova — usuário aprova
- Não inicia desenvolvimento — só após aprovação

---

## Workflow

### Passo 1: Entender o Request

Se usuário vago: pergunte
> "O que você quer construir? Descreva a feature."

Derive o nome do spec (kebab-case):
- "add delete provider" → `add-delete-provider`
- "oauth support" → `oauth-support`

### Passo 2: Criar Estrutura

```
Spec: {feature-name}
Local: .kiro/specs/{feature-name}/
```

### Passo 3: Criar requirements.md

```markdown
# Requirements — {feature-name}

## Objetivo
[Uma frase do que essa feature faz]

## Problema
[Qual problema resolve]

## Critérios de Aceitação
- [ ] Critério 1
- [ ] Critério 2
- [ ] Critério 3

## Escopo
### Dentro
- Item 1
- Item 2

### Fora
- Item 1
```

### Passo 4: Criar design.md (se solicitado)

Se usuário pediu design detalhado, crie:
```markdown
# Design — {feature-name}

## Arquitetura
[Como funciona]

## Arquivos a Criar/Modificar
| Arquivo | Ação |

## Interfaces
[Código exato]

## Dependencies
[Bibliotecas, outros módulos]
```

### Passo 5: Criar tasks.md

```markdown
# Tasks — {feature-name}

## Implementação

- [ ] 1. Task 1
- [ ] 2. Task 2
- [ ]* 3. Task opcional

## Verificação

- [ ] Compilação passa
- [ ] Testes passam
```

### Passo 6: Reportar

```
## Spec Criada

**Nome:** {feature-name}
**Local:** .kiro/specs/{feature-name}/
**Arquivos:**
- requirements.md ✓
- design.md ✓
- tasks.md ✓

**Próximo passo:** 
1. Revise o spec
2. Se aprovado: `/sdd-implement`
3. Se precisa de ajustes: descreva o que mudar
```

---

## Checklist

- [ ] Entendi o request do usuário
- [ ] Derivei nome válido (kebab-case)
- [ ] Criei requirements.md com critérios de aceitação
- [ ] Criei design.md com arquitetura (se solicitado)
- [ ] Criei tasks.md com lista de tasks
- [ ] Reportei conclusão e próximos passos
