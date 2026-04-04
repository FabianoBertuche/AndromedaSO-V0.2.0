# SDD Compilation Rule — Verifique Após Cada Task

## VERIFICAÇÃO OBRIGATÓRIA

Após completar cada task obrigatória (sem `*`):

### Backend (`core/kernel/`)
```bash
cd core/kernel && npx tsc --noEmit
```

### Frontend (`frontend/`)
```bash
cd frontend && npx tsc --noEmit
```

## REGRA

Se houver erros de compilação, **CORRIJA ANTES** de avançar para a próxima task.

## Não Ignore Erros

- Erros de TypeScript são problemas reais
- Erros de lint são problemas reais
- Warnings são sinais de alerta

## Fluxo Correto

```
Task 1 → Implementar → tsc --noEmit → [OK] → Task 2
                                      ↓
                                  [ERRO] → Corrigir → tsc --noEmit → [OK] → Task 2
```

## Testes Também

Após implementar tasks de teste:
```bash
cd core/kernel && npm run test
cd frontend && npm run test
```

Testes passando = task completa
Testes falhando = tarefa não está pronta

---

**Compilação passando = implementação válida. Compilação falhando = PARE.**

## Testes Obrigatórios (NOVA SEÇÃO)

Após verificar compilação, **testes são obrigatórios**:

### Backend
```bash
cd core/kernel && npm run test
```

### Frontend
```bash
cd frontend && npm run test
```

## REGRA

Se os testes falharem, **CORRIJA ANTES** de avançar para a próxima task.

## Fluxo Completo

```
Task → Implementar → tsc --noEmit → [OK] → npm run test → [OK] → Task Complete
                              ↓              ↓
                          [ERRO]          [FALHOU]
                             ↓                 ↓
                         Corrigir          Corrigir
```

---

**Testes passando = task completa. Testes falhando = PARE.**
