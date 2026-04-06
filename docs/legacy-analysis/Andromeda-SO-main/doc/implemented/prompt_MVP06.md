Você está trabalhando no projeto Andromeda OS, um sistema operacional de agentes de IA.

O documento principal desta tarefa é:

/doc/Andromeda_PRD_MVP06.md

Esse arquivo deve ser tratado como a fonte oficial de requisitos, arquitetura e escopo desta implementação.

OBJETIVO

Implementar o MVP06 conforme descrito no arquivo /doc/Andromeda_PRD_MVP06.md.

O foco deste MVP é criar o sistema de:

Agent Identity System

Behavior Safeguards

Agent Management UI

chat/conversa com agentes

seleção de agente no console

configuração comportamental por sliders/toggles

políticas de aderência comportamental

estrutura de identidade baseada em arquivos como identity.md, soul.md, rules.md, playbook.md, context.md

DIRETRIZES GERAIS DE EXECUÇÃO

Leia primeiro o arquivo /doc/Andromeda_PRD_MVP06.md por completo.

Considere esse documento como a verdade principal desta implementação.

Preserve a arquitetura já existente no projeto.

Não faça soluções improvisadas que conflitem com os MVPs anteriores.

Sempre que possível, implemente de forma:

modular

extensível

compatível com múltiplos agentes

compatível com futura integração com memória e RAG

Evite retrabalho estrutural.

Se algum detalhe menor não estiver explícito no PRD, tome uma decisão técnica coerente com a arquitetura existente e registre a decisão.

Trabalhe de forma incremental, mas entregando código funcional.

Não responda apenas com plano; comece a implementar.

Ao final de cada etapa, informe:

o que foi implementado

quais arquivos foram criados/alterados

o que ainda falta

eventuais decisões técnicas adotadas

CONTEXTO ARQUITETURAL

O projeto Andromeda já possui base anterior implementada nos MVPs anteriores, incluindo elementos como:

backend principal

gateway de comunicação

console web

sessões

websocket / realtime

model center / roteamento de modelos

agents registry/runtime em algum nível

arquitetura inspirada em Clean Architecture + Ports & Adapters

O MVP06 deve se encaixar nessa base existente, e não criar um sistema paralelo.

ESCOPO A IMPLEMENTAR

Implemente o que estiver descrito no /doc/Andromeda_PRD_MVP06.md, incluindo principalmente os seguintes blocos:

1. Sistema de identidade de agentes

Criar suporte para identidade configurável por agente, com separação lógica entre:

identity.md

soul.md

rules.md

playbook.md

context.md

Esses arquivos devem poder ser carregados, versionados e usados pelo runtime do agente.

1. Montagem de contexto do agente

Criar mecanismo que monte o contexto base do agente em camadas, combinando:

identidade

alma/persona

regras

playbook

contexto

demais elementos necessários definidos no PRD

1. Salvaguardas comportamentais

Implementar mecanismo de governança comportamental, incluindo quando aplicável:

validação de aderência ao papel

validação de tom/comportamento

validação de regras obrigatórias

bloqueios/fallbacks

score de conformidade

políticas de comportamento

1. Policy layer para agentes

Criar ou expandir policies ligadas a:

identidade

tom

limites

delegação

feedback

aderência comportamental

1. Estruturas de domínio e serviços

Criar entidades, value objects, serviços, casos de uso e contratos necessários para suportar o MVP06 de forma limpa.

1. API/backend para gestão de agentes

Criar endpoints necessários para:

listar agentes

consultar perfil

editar identidade

editar parâmetros comportamentais

editar safeguards

conversar com um agente

consultar histórico/configuração relevante

1. Interface web — nova aba de gestão de agentes

Criar nova aba/tela para gestão de agentes, com recursos como:

listagem de agentes

visualização de perfil

edição textual

sliders de comportamento

toggles de safeguards

visualização de configurações

acesso ao chat do agente

1. Console com seleção de agente

Expandir o console existente para permitir selecionar com qual agente conversar/executar interação.

Essa seleção deve refletir na chamada backend e no contexto de execução.

1. Chat por agente

Permitir conversa direcionada com agente específico, seja:

dentro do console

ou a partir da aba Agents

ou ambos, se isso estiver previsto no PRD

1. Observabilidade e rastreabilidade

Adicionar logs, metadados, auditoria e rastreabilidade suficientes para entender:

qual identidade estava ativa

quais safeguards foram aplicados

score de aderência

agente selecionado

versão de perfil utilizada

FORMA DE IMPLEMENTAÇÃO

Execute em fases.

Fase 1 — Leitura e mapeamento

ler o PRD

localizar módulos existentes relevantes

mapear pontos de integração

identificar arquivos e camadas que serão alterados

Fase 2 — Backend base

entidades

serviços

policies

carregamento dos arquivos de identidade

assembler de contexto do agente

endpoints principais

Fase 3 — Integração no runtime

integrar identidade e safeguards ao fluxo real de execução

garantir que o targetAgentId ou equivalente seja respeitado

garantir que o runtime carregue o perfil correto

Fase 4 — Frontend

nova aba Agents

editor/configurador

sliders/toggles

integração com API

console com seletor de agente

Fase 5 — Validação

testar fluxos principais

corrigir inconsistências

garantir que tudo compile/rode

documentar o que foi feito

REGRAS IMPORTANTES

Não invente outro escopo fora do documento.

Não remova funcionalidades existentes.

Não quebre compatibilidade desnecessariamente.

Não trate o PRD como mera referência; trate como escopo de implementação.

Se encontrar lacunas, resolva com decisões sensatas e documente.

Priorize funcionamento real.

Priorize estrutura pronta para evolução futura.

Se houver dúvida entre “rápido porém frágil” e “um pouco mais estruturado”, escolha a opção estruturada.

Evite hardcode excessivo.

Evite acoplamento desnecessário entre frontend e runtime.

Preserve separação entre identidade do agente e modelo LLM.

RESULTADO ESPERADO

Ao final, quero que você tenha:

implementado o MVP06 no código

criado/alterado os arquivos necessários

integrado backend e frontend

deixado a feature utilizável

informado claramente:

arquivos alterados

arquitetura adotada

endpoints criados

componentes de UI criados

pendências, se houver

próximos passos recomendados

FORMATO DE TRABALHO

Comece agora.

Sua resposta deve seguir este padrão:

resumo do que entendeu

leitura do PRD e mapeamento do projeto

plano objetivo de implementação

início imediato da implementação

atualizações contínuas do progresso

conclusão com relatório final

Não pare no planejamento.
Implemente.
