# AutoResearch × Andromeda OS — Análise e Plano de Integração

> **Documento criado em:** 25/03/2026  
> **Status do projeto:** MVP13 em curso  
> **Repos analisados:**
> - [karpathy/autoresearch](https://github.com/karpathy/autoresearch) — o protocolo original
> - [uditgoenka/autoresearch](https://github.com/uditgoenka/autoresearch) — a generalização para Claude Code

---

## 1. O que é o AutoResearch

O AutoResearch é um protocolo criado por Andrej Karpathy que demonstrou que um script Python de ~630 linhas podia rodar **100+ experimentos por noite** de forma totalmente autônoma. A estrutura é minimalista por design:

```
LOOP (FOREVER ou N vezes):
  1. Lê estado atual + histórico git + log de resultados
  2. Escolhe a próxima mudança (baseado no que funcionou, falhou, não foi tentado)
  3. Faz UMA mudança focada
  4. Git commit (antes da verificação)
  5. Roda verificação mecânica (testes, benchmarks, scores)
  6. Melhorou → mantém. Piorou → git revert. Quebrou → corrige ou pula.
  7. Loga o resultado em TSV
  8. Repete. Nunca para.
```

**Os 3 pilares obrigatórios:**
1. **Métrica objetiva mensurável** — um número que diz se melhorou ou piorou
2. **Algo editável automaticamente** — código, prompt, config
3. **Ciclo de feedback curto** — testar, medir, decidir

---

## 2. karpathy/autoresearch — O Original

**Foco:** Pesquisa de ML em GPU única  
**Alcance:** Treinamento de modelos de linguagem (nanoGPT / nanoCLM)  
**Resultado real:** Em 2 dias, executou 700 experimentos e descobriu 20 otimizações que melhoraram o modelo em 11%. O CEO da Shopify testou overnight e obteve 19% de ganho com 37 experimentos.

**Por que é relevante para o Andromeda:**
- O `program.md` do Karpathy é conceitualmente idêntico ao `AgentProfile + playbook.md` do Andromeda (MVP06)
- O loop de experimentos com git como memória é a base do que o MVP18 (Autonomy) precisa implementar
- A métrica `val/bpb` equivale ao `AgentPerformanceRecord` que o MVP10 modelou

---

## 3. uditgoenka/autoresearch — A Generalização

**Foco:** Plugin universal para Claude Code — qualquer domínio  
**Instalação:** `/plugin marketplace add uditgoenka/autoresearch`  
**Versão atual:** v1.8.2

### Comandos disponíveis

| Comando | O que faz |
|---|---|
| `/autoresearch` | Loop ilimitado de melhoria com métrica |
| `/autoresearch:plan` | Wizard: Goal → Scope → Metric → Verify |
| `/autoresearch:debug` | Caça bugs com método científico |
| `/autoresearch:fix` | Correge erros até zero falhas |
| `/autoresearch:security` | Auditoria STRIDE + OWASP + red-team |
| `/autoresearch:ship` | Workflow completo de entrega (PR, deploy, post) |
| `/autoresearch:predict` | 5 personas especialistas analisam o código |
| `/autoresearch:scenario` | Explora 12 dimensões de casos de uso |
| `/autoresearch:learn` | Gera e mantém documentação automaticamente |

### 8 Regras Críticas do Loop

1. **Loop until done** — ilimitado por padrão, ou N vezes com `Iterations: N`
2. **Read before write** — entende contexto completo antes de modificar
3. **One change per iteration** — mudanças atômicas
4. **Mechanical verification only** — sem "parece bom". Só números.
5. **Automatic rollback** — mudanças ruins revertidas instantaneamente
6. **Simplicity wins** — resultado igual + menos código = mantém
7. **Git is memory** — experimentos com prefixo `experiment:`, agente lê `git log` antes de cada iteração
8. **When stuck, think harder** — re-lê, combina near-misses, tenta mudanças radicais

### Guard — Prevenção de Regressões

```
/autoresearch
Goal: Reduzir tempo de resposta da API para <100ms
Verify: npm run bench:api | grep "p95"
Guard: npm test
```

- **Verify** = "A métrica melhorou?" (o objetivo)
- **Guard** = "Algo quebrou?" (a proteção)

---

## 4. Comparação Direta: AutoResearch vs Andromeda OS

| Dimensão | karpathy/autoresearch | uditgoenka/autoresearch | Andromeda OS |
|---|---|---|---|
| **Propósito** | Loop de pesquisa ML | Plugin universal de melhoria | OS cognitivo completo |
| **Domínio** | ML / GPU | Qualquer coisa | Agentes empresariais |
| **Execução** | Script Python standalone | Plugin Claude Code | Monorepo TS + Python |
| **Persistência** | Git + TSV | Git + TSV + relatórios | PostgreSQL, Redis, BullMQ, RAG |
| **Agentes** | 1 agente LLM | 1 agente Claude | 20+ agentes especializados |
| **Multi-tenancy** | ❌ | ❌ | ✅ (MVP09) |
| **Auditoria** | Log TSV básico | Log TSV + relatórios estruturados | Audit trail completo com Prisma |
| **Segurança** | ❌ | Scan STRIDE/OWASP | Sandbox, DLQ, rate limiting |
| **UI operacional** | ❌ | ❌ | Console WebSocket em tempo real |
| **RAG / Memória** | ❌ | ❌ | MVP07 + MVP08 completos |
| **Budget Control** | ❌ | ❌ | MVP10 |
| **Curva de setup** | Alta (requer GPU + ML) | Baixa (1 comando) | Alta (sistema complexo) |

**Conclusão:** O Andromeda é arquiteturalmente mais maduro. O que vale absorver são os **padrões conceituais**: disciplina de métrica objetiva, rollback automático e log estruturado de experimentos.

---

## 5. Mapeamento por MVP — O que absorver e quando

### ✅ MVP13 (ATUAL) — Multi-channel + Notificações Proativas

**Conceito a absorver:** `/autoresearch:ship` — workflow de entrega em 8 fases  
**Onde entra no Andromeda:**
- Notificações proativas como o `--monitor N` do autoresearch:ship — o sistema avisa quando algo conclui, falha ou ultrapassa threshold
- O padrão **Identify → Inventory → Checklist → Prepare → Dry-run → Ship → Verify → Log** pode ser incorporado no fluxo de notificações do MVP13 como um `ShipEvent` rastreável
- `/autoresearch:predict` (5 personas) → referência de UX para o futuro `Agent Swarm` de análise paralela

**Ação concreta:** Quando implementar notificações proativas, adotar o mesmo ciclo de verificação mecânica: threshold definido → alerta disparado → log de evento → confirmação de recebimento.

---

### MVP14 — Eval Engine + Benchmark Cognitivo

**Conceito a absorver:** Loop AutoResearch aplicado a avaliação de agentes  
**Equivalência direta:**

```
AutoResearch original          Andromeda MVP14
─────────────────────          ───────────────
val/bpb (métrica ML)      →   EvalSuite score por agente
N experimentos por noite  →   EvalRun com N casos por suite
git como memória          →   EvalRun history + drift detection
revert automático         →   AgentVersion rollback
program.md                →   EvalCase / golden case congelado
```

**O que implementar:**
- `EvalEngine` roda N casos do `EvalSuite` de forma autônoma
- Compara resultado entre versões do agente (como o loop compara iterações)
- Mantém apenas versões que melhoram a métrica (como o revert automático)
- Datasets internos funcionam como o `val/bpb` — métrica objetiva e mensurável
- **Guard** do autoresearch = suite de regressão comportamental: se o score novo é melhor mas quebra golden cases → rejeita

**Entidades novas confirmadas para MVP14:**
- `EvalCase` — caso de teste congelado com input + expected output
- `EvalSuite` — conjunto de EvalCases por domínio/capability
- `EvalRun` — execução formal com score, drift e status
- `GoldenCase` — caso imutável que não pode regredir

---

### MVP15 — Skill Marketplace + Intelligence

**Conceito a absorver:** `/autoresearch:security` — auditoria STRIDE + OWASP automatizada  
**Onde entra:**
- O `Skill Security Audit` (já planejado no MVP15) ganha um **loop formal** de auditoria análogo ao autoresearch:security
- Score de segurança por skill: Static (30%) + Sandbox (40%) + LLM-Judge (30%)
- Badge permanente no Skill Center com re-run automático em cada nova versão instalada
- Flag equivalente ao `--fail-on <severity>` → bloqueia instalação de skill com score abaixo de 70

---

### MVP18 — Autonomy + Long-running Agents

**Conceito a absorver:** O AutoResearch completo — loop overnight sem humano no loop  
**Esta é a integração mais profunda e direta:**

```
karpathy/autoresearch          Andromeda MVP18
─────────────────────          ───────────────
program.md                →   AgentProfile + AutonomyPolicy
Loop infinito ou N vezes  →   LongRunningTask com checkpoints
Git commit por iteração   →   AgentVersion por experimento
Revert automático         →   VersionRollback automático
Log TSV                   →   AgentPerformanceRecord
Métrica objetiva          →   KPI definido na AutonomyPolicy
Stuck → think harder      →   Escalação humana automática
12 experimentos/hora      →   Throughput configurável por tenant
```

**AutonomyPolicy** (nova entidade para MVP18):
```typescript
interface AutonomyPolicy {
  agentId: string;
  tenantId: string;
  maxIterations: number | 'unlimited';
  metric: {
    command: string;         // comando que retorna número
    direction: 'minimize' | 'maximize';
    threshold?: number;      // para quando atingir
  };
  guard?: string;            // comando de proteção contra regressão
  checkpointInterval: number; // a cada N iterações
  escalationPolicy: {
    maxConsecutiveFailures: number;
    notifyVia: 'nebula' | 'telegram' | 'webhook';
  };
  schedule?: CronExpression;  // rodar overnight
}
```

---

## 6. O que NÃO absorver

| O que | Por quê não |
|---|---|
| `uditgoenka/autoresearch` como dependência externa | Andromeda é mais completo; não deve depender de plugin externo |
| AIOX/SynkraAI como framework de orquestração | Andromeda já cobre tudo que o AIOX oferece, com mais maturidade |
| AIOS AGI Research como kernel | Conflito arquitetural — Andromeda já tem seu próprio kernel TS |
| Agent Teams Claude Code como arquitetura | É feature de IDE, não arquitetura. MVP11 implementa nativamente com contratos mais ricos |

---

## 7. Tabela Resumo — Conceitos × MVPs

| Conceito AutoResearch | Valor | Onde entra | MVP |
|---|---|---|---|
| Loop métrica objetiva + avalia + guarda/descarta | 🔴 Alto | EvalEngine com loop autônomo | MVP14 |
| Guard — proteção contra regressão | 🔴 Alto | EvalRun golden cases | MVP14 |
| Auditoria STRIDE/OWASP automatizada | 🔴 Alto | Skill Security Audit loop | MVP15 |
| Notificações pós-ship com verify + log | 🟡 Médio | ShipEvent + Notificações proativas | MVP13 |
| Loop overnight completo (AutonomyPolicy) | 🔴 Alto | LongRunningTask + checkpoints | MVP18 |
| program.md → objetivo claro por agente | 🔴 Alto | AgentProfile + AutonomyPolicy | MVP18 |
| Multi-persona análise (predict) | 🟡 Médio | Referência UX para Agent Swarm futuro | MVP19+ |
| Scenario Explorer (12 dimensões) | 🟡 Médio | Referência para EvalCase generation | MVP14 |
| `/autoresearch:learn` — doc engine | 🟢 Baixo | Andromeda já tem skill de documentação | Nativo |

---

## 8. Regra de Ouro para o Time

> **O Andromeda não copia nenhum desses projetos — ele os supera em maturidade arquitetural.**
> O que vale absorver são os **padrões conceituais**:
> 1. Toda melhoria precisa de uma **métrica objetiva mensurável**
> 2. Toda mudança deve ser **atômica e revertível**
> 3. **Git é memória** — cada experimento logado é aprendizado acumulado
> 4. **Mechanical verification only** — sem "parece bom". Só números.
> 5. Falhou? **Descarta e tenta outra coisa.** Nunca fica preso.

Esses 5 princípios devem guiar o design do `EvalEngine` (MVP14) e da `AutonomyPolicy` (MVP18).

---

## 9. Referências

- [karpathy/autoresearch](https://github.com/karpathy/autoresearch)
- [uditgoenka/autoresearch](https://github.com/uditgoenka/autoresearch) — v1.8.2
- [Andromeda OS — Base de Documentação](https://www.notion.so/Andromeda-OS-Base-de-Documenta-o-328b260a53a681d38ee8c840fa8d3533)
- Análise prévia: `mvp09-finalizado` chat — seção "Análise AutoResearch + AIOX para o Andromeda OS"
