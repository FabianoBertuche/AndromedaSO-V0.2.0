# SDD Reading Rule — Leia o Spec Completo Antes de Código

## ORDEM OBRIGATÓRIA DE LEITURA

Antes de escrever qualquer linha de código, leia nesta ordem:

1. **`CONTEXT.md`** (se existir) — resumo do spec, ponto de entrada
2. **`requirements.md`** — critérios de aceitação, o que fazer e por quê
3. **`design.md`** — arquitetura, interfaces, código exato a implementar
4. **`tasks.md`** — lista de tasks na ordem exata de execução

## PROIBIDO

- Pular etapas
- Reordenar tasks
- Começar a implementar antes de entender todo o design
- Fazer suposições sobre o que o design significa

## O Que Você Ganha

- Entender o **porquê** antes do **como**
- Saber exatamente quais arquivos criar/modificar
- Conhecer as constraints antes de implementar
- Evitar refazer trabalho

## Sinal de Alucinação

Se você começar a implementar algo sem ter lido todos os arquivos de spec, isso é uma violação. **PARA** e leia os arquivos primeiro.

## Como Verificar

Antes de criar qualquer arquivo ou escrever código, confirme:
- "Li o CONTEXT.md de {spec}"
- "Li o requirements.md de {spec}"
- "Li o design.md de {spec}"
- "Li o tasks.md de {spec}"
- "Entendo todas as tasks"

---

**Sem leitura completa = sem implementação.**
