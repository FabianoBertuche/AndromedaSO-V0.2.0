# Status do login OpenAI Codex no Andromeda SO

## Resumo rápido

- **Comportamento implementado hoje:** o repositório implementa hoje um fluxo manual `openai-codex` do tipo **BYO web OAuth client**, dependente de `OPENAI_CODEX_WEB_CLIENT_ID`, com conclusão **manual link/copy-return**.
- **Status atual:** o trabalho mais amplo de OpenAI Codex está **pausado/deferido por enquanto**. Esta atualização é apenas de documentação e não altera código, config ou testes.
- **Bloqueador prático:** ainda falta um modelo viável de auth/client que não dependa de premissas impraticáveis para operação real.
- **Onde retomar depois:** antes de retomar esse esforço, revisar `.kiro/specs/openai-codex-manual-auth-flow/`, `docs/suporte/openai-codex-setup.md`, esta nota de status e a investigação pendente sobre um auth/client model viável.

## Comportamento implementado hoje

Hoje, o comportamento efetivamente implementado no Andromeda SO para login OpenAI Codex é um fluxo **BYO web OAuth client** com UX de conclusão **manual/headless-style**.

Na prática, isso significa que o ambiente precisa fornecer `OPENAI_CODEX_WEB_CLIENT_ID` para que o login web funcione. Depois do login na OpenAI, a aplicação não troca tokens automaticamente no callback: a página `/oauth/callback` mostra a URL retornada e os valores `code` e `state` para que o usuário copie esses dados de volta para a tela de providers.

## Limitação atual

O fluxo atual existe e funciona como a implementação presente do repositório, mas continua com uma limitação importante: ele ainda depende de um web OAuth client BYO configurado no ambiente.

Também é importante deixar explícito que esse fluxo atual **não deve ser descrito como eliminando** a necessidade do client ID. A principal limitação hoje segue sendo a dependência de um web OAuth client fornecido pelo usuário, time ou workspace, via configuração de `OPENAI_CODEX_WEB_CLIENT_ID`.

## Status atual: trabalho pausado/deferido

O repositório continua preservando e documentando o fluxo manual já implementado, mas o avanço mais amplo dessa linha de trabalho está **pausado/deferido** neste momento.

Isso significa que a existência do fluxo manual atual **não** deve ser lida como sinal de evolução ativa do tema. A documentação agora registra explicitamente que a implementação atual permanece como está, enquanto qualquer progresso adicional depende de futura investigação/redesign — sem compromisso de prazo.

## Bloqueador prático em aberto

O bloqueador prático continua sendo a ausência de um modelo viável de autenticação/cliente que funcione sem depender de premissas impraticáveis para uso real no repositório.

Em outras palavras, o fluxo manual implementado hoje continua sendo o estado atual documentado, mas o problema maior de auth/client **não está resolvido**. Por isso, o trabalho foi pausado até que exista base melhor para validar ou redesenhar essa integração.

## Como o fluxo manual funciona hoje

1. A tela de providers pede ao backend uma sessão OAuth do `openai-codex`.
2. O backend devolve o link de autorização e mantém `state`, PKCE e redirect URI no servidor.
3. O usuário abre o link manualmente.
4. A OpenAI redireciona para `/oauth/callback`.
5. A página `/oauth/callback` atua apenas como helper de cópia.
6. O usuário cola a URL completa ou `code` + `state` na tela de providers para finalizar a autenticação.

## Onde retomar depois

Se esse esforço voltar no futuro, retome nesta ordem curta:

1. releia `.kiro/specs/openai-codex-manual-auth-flow/` para recuperar o ponto de partida da linha manual já documentada;
2. revise `docs/suporte/openai-codex-setup.md` para confirmar o que funciona hoje na prática;
3. releia `docs/suporte/openai-codex-auth-status.md` para o status canônico de pausa/deferimento;
4. só então reabra a investigação do auth/client model viável que não dependa de premissas impraticáveis.

## Como ler as referências do repositório

Use as referências atuais do repositório desta forma:

- `docs/suporte/openai-codex-setup.md` = como configurar e testar o **comportamento implementado hoje**;
- `docs/suporte/logincodex.md` = referência técnica mais profunda, com pesquisa, contexto e histórico;
- `docs/suporte/openai-codex-auth-status.md` = nota canônica de status, pausa/deferimento, bloqueador prático e ponto de retomada.

Sobre materiais antigos: `.kiro/specs/openai-codex-hardcoded-client/` continua existindo como exploração histórica e referência antiga, mas **não representa a direção ativa atual** desta documentação. Esse spec não deve ser reescrito; ele deve ser lido apenas como material histórico, enquanto a conclusão atual fica concentrada nesta nota de status.
