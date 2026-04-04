# SDD Task Marking Rule — Marque Tasks Ao Executar

## FORMATO DE TASKS

```
- [ ] 1. Task obrigatória        ← pendente
- [-] 1. Task obrigatória        ← em progresso
- [x] 1. Task obrigatória        ← completa
- [ ]* 2. Task opcional           ← pendente (opcional)
```

## COMO MARCAR

### Ao Iniciar Uma Task
```
- [ ]  →  - [-]
```
Mude de espaço para hífen中间的短划线.

### Ao Completar Uma Task
```
- [-]  →  - [x]
```
Mude de hífen para x.

## EXEMPLO

**Antes:**
```markdown
- [ ] 1. Criar arquivo utils.ts
- [ ] 2. Implementar função validate
- [ ] 3. Exportar no index.ts
```

**Durante (task 2 em progresso):**
```markdown
- [x] 1. Criar arquivo utils.ts
- [-] 2. Implementar função validate
- [ ] 3. Exportar no index.ts
```

**Depois (task 3 completa):**
```markdown
- [x] 1. Criar arquivo utils.ts
- [x] 2. Implementar função validate
- [x] 3. Exportar no index.ts
```

## Lembre-se

- Tasks com `*` são opcionais — implemente apenas se pedido
- Tasks já marcadas `[x]` não devem ser reimplementadas
- Manter tasks atualizadas = visibilidade de progresso

---

**Task atualizada = progresso visível.**
