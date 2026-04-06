# EDD — MVP10: Agent Evolution & Budget Control
# Engineering Design Document

**Data:** 23/03/2026
**Status:** 🔄 Em design/implementação
**Autor:** Andromeda OS Team (Antigravity)

---

## Contexto e Motivação

Com MVP09 concluído, o sistema tem fundação sólida: Auth/IAM, multi-tenancy, DLQ, rate limiting e health checks. O próximo desafio é tornar os **agentes entidades que evoluem e são controladas financeiramente**.

Três lacunas estruturais a resolver:
1. **Agentes não têm histórico** — uma edição sobrescreve tudo sem rastro
2. **Custos são medidos mas não controlados** — sem teto, o sistema pode gastar indefinidamente
3. **Humanos não têm voz** — sem mecanismo de feedback, o sistema só aprende com dados sintéticos

---

## Decisões Arquiteturais

### ADR-001: Snapshot como JSON vs. tabelas relacionais por campo

**Decisão:** Snapshot como `Json` no Prisma (coluna JSONB no Postgres).

**Justificativa:**
- AgentProfile tem estrutura complexa e variável (identity.md, soul.md, rules.md, playbook.md, context.md + configs numéricas)
- JSONB permite diff via código sem schema rígido por versão
- Rollback = deserializar e regravar campos — simples e direto
- Custo de armazenamento desprezível (~5–20KB por perfil)

**Trade-off aceito:** Não é possível fazer queries SQL dentro do snapshot. Aceitável porque versões são acessadas por `agentId + version`.

---

### ADR-002: Budget no Execution Engine vs. middleware HTTP

**Decisão:** Verificação dentro do `ExecuteTaskUseCase`, antes da chamada ao LLM.

**Justificativa:**
- Budget é regra de domínio, não de transporte
- Middleware HTTP bloquearia antes de saber o custo estimado
- Lança `BudgetExceededError` → controller converte em HTTP 402

**Fluxo:**
```
ExecuteTaskUseCase
→ CheckBudgetBeforeExecutionUseCase(agentId, estimatedCostUsd)
→ Se hardStop=true e (dailySpend + estimated) > dailyLimit → throw BudgetExceededError
→ [executa LLM]
→ RecordSpendUseCase(agentId, actualCostUsd)
```

---

### ADR-003: Reputação materializada vs. on-demand

**Decisão:** Materializada — campo `reputationScores: Json` em Agent, recalculado via job e trigger de feedback.

**Justificativa:**
- On-demand exigiria agregar 30 dias de tasks por capability em cada leitura — caro para UI
- Dado materializado é lido em O(1)
- Freshness aceitável: recalcula após cada feedback e diariamente

---

### ADR-004: Lições aprendidas via Python vs. TypeScript

**Decisão:** Python (`cognitive-python`) processa os episódios.

**Justificativa:**
- Análise semântica de padrões requer LLM ou embeddings
- Python é a camada cognitiva do sistema (princípio inegociável)
- TypeScript apenas: agenda job → coleta → envia ao Python → persiste → notifica

**Contrato:**
```typescript
// packages/core/src/contracts/evolution.ts
export interface AnalyzeEpisodesRequest {
  agentId: string
  episodes: { id: string; content: string; importance: number; createdAt: string }[]
}
export interface AnalyzeEpisodesResponse {
  suggestions: { text: string; sourceEpisodeIds: string[]; confidence: number }[]
}
```

---

### ADR-005: Feedback como evento vs. sincronização direta

**Decisão:** `SubmitTaskFeedbackUseCase` emite evento `feedback.submitted`. Consumidores escutam de forma desacoplada.

**Implementação:** EventEmitter interno (Node.js) — não requer BullMQ pois é in-process.

---

## Schema — Diagrama Lógico

```
Agent (existente)
├── AgentVersion[]              ← snapshot por edição
├── AgentPerformanceRecord[]    ← consolidação diária
├── AgentBudgetPolicy           ← 1:1
├── TaskFeedback[]              ← via Task
└── PlaybookSuggestion[]        ← geradas pelo job semanal

Task (existente)
└── TaskFeedback[]
```

---

## Riscos e Mitigações

| Risco | Prob | Impacto | Mitigação |
|-------|------|---------|-----------|
| Job de consolidação falha silenciosamente | Média | Médio | BullMQ retry + DLQ (MVP09) |
| Snapshot de agente cresce muito | Baixa | Baixo | Política de retenção: últimas 20 versões |
| Budget reset não executa no horário | Baixa | Alto | Health check: alerta se > 25h sem reset |
| Sugestões de playbook de baixa qualidade | Média | Baixo | Filtro confidence >= 0.7 + aprovação humana obrigatória |
| RecordSpend falha após LLM executar | Baixa | Médio | Try/catch separado + retry via fila |

---

## Módulos Afetados (código existente)

| Módulo | Arquivo | Mudança |
|--------|---------|---------|
| `tasks` | `ExecuteTaskUseCase.ts` | + CheckBudget + RecordSpend |
| `agent-management` | `UpdateAgentProfileUseCase.ts` | + snapshotBeforeUpdate |
| `model-center` | `LlmRouterScoreService.ts` | + listener feedback.submitted |
| `cognitive-python` | `app/routes/evolution.py` | + endpoint /evolution/analyze-episodes |

---

## Critérios de Aceite Técnico

- Nenhuma chamada LLM passa pela budget check sem ser registrada
- Snapshot sempre criado **antes** (não depois) da mutação do perfil
- Feedback persistido antes de qualquer side effect
- Job idempotente: rodar 2× no mesmo dia não duplica AgentPerformanceRecord
- Reputação nunca calculada com dados de mais de 30 dias
- Sugestão nunca aplicada ao playbook sem `status = "approved"` por humano
