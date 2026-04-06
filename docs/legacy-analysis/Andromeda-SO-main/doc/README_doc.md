# 📚 /doc — Documentação do Andromeda OS

> **Princípio:** Esta pasta é a fonte de verdade documental do projeto.
> Documentos aqui são lidos pelo agente no Antigravity como contexto de execução.
> Mantenha apenas o necessário em cada subdiretório.

---

## 📂 Estrutura

```
doc/
├── active/        ← PRD do MVP em desenvolvimento ativo (sempre 1 arquivo)
├── planned/       ← PRDs de MVPs futuros (referência, não execução)
├── implemented/   ← Tudo que já foi para o Antigravity e está em produção
│   └── legado/    ← Artefatos intermediários (.docx, .resolved, chats)
└── README.md      ← Este arquivo
```

---

## 📌 Regras de uso

| Regra | Descrição |
|---|---|
| **1 arquivo em `active/`** | Sempre apenas o PRD do MVP corrente. Ao fechar o MVP, mover para `implemented/`. |
| **`planned/` é rascunho** | Documentos em `planned/` são intenção, não ordem. O agente NÃO os executa. |
| **`implemented/` é imutável** | Não editar documentos já implementados. Registrar correções no Notion. |
| **Sem `.docx` na raiz** | Arquivos Word e `.resolved` vão direto para `implemented/legado/`. |
| **README sempre atualizado** | A cada MVP fechado, atualizar a tabela de status abaixo. |

---

## 🗺️ Status dos MVPs

| MVP | Arquivo | Status | Observação |
|---|---|---|---|
| MVP01 | `implemented/PRD_MVP01.md` | ✅ Implementado | Kernel fundacional |
| MVP02 | `implemented/PRD_MVP02.md` | ✅ Implementado | Communication Gateway |
| MVP03 | `implemented/PRD_MVP03.md` | ✅ Implementado | Realtime Console |
| MVP04 | `implemented/PRD_MVP04.md` | ✅ Implementado | Model Center & LLM Router |
| MVP05 | `implemented/DOCUMENTACAO_TECNICA_mvp05.md` | ✅ Implementado | Fundação Híbrida TS/Python |
| MVP06 | `implemented/PRD_MVP06.md` | ✅ Implementado | Agent Identity & Safeguards |
| MVP06B | `implemented/PRD_MVP06B.md` | ✅ Implementado | Sandbox Subsystem |
| MVP06C | `implemented/PRD_MVP06C.md` | ✅ Implementado | Sandbox Complete + Hybrid Bridge |
| MVP-Rev | `implemented/PRD_MVP-Revisao.md` | ✅ Implementado | Saneamento Estrutural |
| MVP07 | `implemented/PRD_MVP07.md` | ✅ Implementado | Memory Layer v1 |
| MVP08 | `active/PRD_MVP08.md` | ✅ Implementado | Knowledge Layer v1 + Obsidian |
| MVP09 | `active/PRD_MVP09.md` | 🔄 Em desenvolvimento | Security, Resilience & DevOps (Fase 8) |
| MVP10 | `planned/PRD_MVP10.md` | 📋 Planejado | Agent Evolution + Budget Control |
| MVP11+ | — | 🔮 Horizonte | Ver Notion para roadmap completo |

---

## 🔄 Fluxo de ciclo de vida de um documento

```
1. Novo MVP planejado  →  criar em planned/PRD_MVPxx.md
2. MVP entra em dev    →  mover para active/PRD_MVPxx.md
3. MVP concluído       →  mover para implemented/PRD_MVPxx.md
4. Atualizar README    →  mudar status na tabela acima
```

---

## 🧠 Fonte de verdade central

O documento consolidado do projeto vive no Notion:
**🪐 Andromeda OS — Base de Documentação**
https://www.notion.so/328b260a53a681d38ee8c840fa8d3533

Em caso de conflito entre um PRD local e o Notion, **o Notion prevalece**.

---

_Última atualização: 2026-03-19_
