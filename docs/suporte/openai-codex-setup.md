# Configurar login OpenAI Codex no Andromeda SO

## Quando usar este guia

Use este guia se você quer conectar o login do OpenAI Codex no Andromeda SO sem mexer em código. Ele foi escrito para iniciantes e mostra apenas o necessário para configurar, testar e identificar os erros mais comuns.

Se você precisa de análise técnica detalhada do fluxo OAuth, consulte `docs/suporte/logincodex.md`.

## Status deste guia

Este guia documenta o **comportamento implementado hoje** no repositório: um fluxo **BYO web OAuth client** que depende de `OPENAI_CODEX_WEB_CLIENT_ID`, mas agora termina em uma experiência **manual link/copy-return**.

O trabalho mais amplo de OpenAI Codex está **pausado/deferido** no momento. Portanto, este material deve ser lido como guia do fluxo manual atualmente implementado, e não como indicação de avanço ativo dessa frente.

Para o motivo da pausa, o bloqueador prático em aberto e o lembrete de onde retomar depois, consulte `docs/suporte/openai-codex-auth-status.md`.

Em vez de a tela `/oauth/callback` completar o OAuth sozinha, ela agora funciona como uma página auxiliar onde você copia a URL de retorno completa ou os valores `code` + `state` e cola esses dados de volta na tela de providers.

## Antes de começar

Antes de iniciar, confirme estes quatro pontos:

- o backend (kernel) está rodando;
- o frontend está rodando;
- você tem um OpenAI web client ID válido;
- o callback configurado usa exatamente o caminho `/oauth/callback`.

Anote também esta regra de segurança: não compartilhe client IDs, access tokens, refresh tokens nem capturas de tela que mostrem segredos.

## Configurar OPENAI_CODEX_WEB_CLIENT_ID

A variável obrigatória para o login web do OpenAI Codex fica em `core/kernel/.env`.

```dotenv
OPENAI_CODEX_WEB_CLIENT_ID=your_openai_web_client_id
```

- Esse valor é o identificador do aplicativo web OAuth usado no lado da OpenAI.
- Você deve obter esse valor na configuração do aplicativo web OAuth do OpenAI usada pelo seu workspace.
- Depois de salvar `core/kernel/.env`, reinicie o kernel para que a mudança seja aplicada.

## Redirect URIs exatas

Use estas URIs exatamente como estão:

| Ambiente | Redirect URI |
|---|---|
| Desenvolvimento local | `http://localhost:5173/oauth/callback` |
| Produção (exemplo) | `https://app.example.com/oauth/callback` |

Importante: este repositório aceita somente o caminho `/oauth/callback`. O caminho `/auth/callback` está errado e não deve ser usado.

## Passo a passo local

Antes de seguir, tenha em mãos o OpenAI web client ID do aplicativo web OAuth configurado no lado da OpenAI para o seu workspace.

1. Confirme que o frontend abre em `http://localhost:5173`.
2. Abra o arquivo `core/kernel/.env`.
3. Adicione `OPENAI_CODEX_WEB_CLIENT_ID` com o valor do seu OpenAI web client ID.
4. Salve o arquivo e reinicie o kernel.
5. Inicie ou confirme que backend e frontend estão rodando localmente.
6. Abra o app no navegador.
7. Vá para a tela de providers/modelos.
8. Escolha `OpenAI Codex (Sign in)`.
9. Clique em `Sign in with OpenAI Codex`.
10. Copie ou abra o link de autorização mostrado pelo app em uma nova aba.
11. Conclua a tela de login e consentimento da OpenAI.
12. Quando a OpenAI voltar para `/oauth/callback`, use essa página como helper: copie a URL completa de retorno ou os valores `code` e `state`.
13. Volte para a tela de providers/modelos.
14. Cole a URL completa ou os valores `code` + `state` na seção manual do OpenAI Codex.
15. Clique em `Complete sign-in`.

## Checklist de teste manual

Use a lista abaixo sem abrir DevTools e sem editar código:

- [ ] `http://localhost:5173` abre com sucesso.
- [ ] O app carrega normalmente sem pedir para você editar código.
- [ ] A lista de providers mostra `OpenAI Codex (Sign in)`.
- [ ] Ao clicar no botão de login, uma página da OpenAI é aberta.
- [ ] Depois da aprovação, o navegador volta para uma URL terminando em `/oauth/callback`.
- [ ] A página `/oauth/callback` mostra a URL completa de retorno e os valores `code` e `state` para copiar.
- [ ] Você consegue colar a URL completa ou `code` + `state` de volta na tela de providers.
- [ ] O provider `openai-codex:<email>` aparece na lista depois do passo manual de conclusão.
- [ ] Nenhum segredo foi copiado para chats, tickets, e-mails ou screenshots.

## Solução de problemas

### OPENAI_CODEX_WEB_CLIENT_ID ausente

**O que você provavelmente vai ver**

Uma mensagem indicando que a configuração é obrigatória no backend, ou que falta configurar o login web do OpenAI Codex.

**O que isso significa**

O kernel não encontrou a variável `OPENAI_CODEX_WEB_CLIENT_ID` em `core/kernel/.env`, então não consegue iniciar o fluxo de OAuth web.

**O que fazer agora**

1. Abra `core/kernel/.env`.
2. Confirme que existe a linha `OPENAI_CODEX_WEB_CLIENT_ID=your_openai_web_client_id` com o valor correto no lugar do exemplo.
3. Salve o arquivo.
4. Reinicie o kernel.
5. Tente o login novamente.

### Redirect URI incorreta

**O que você provavelmente vai ver**

Falha ao voltar do login, erro de callback, helper page sem dados suficientes para copiar ou configuração rejeitada no lado da OpenAI.

**O que isso significa**

O app espera somente o caminho `/oauth/callback`. Se a Redirect URI estiver com outro caminho, como `/auth/callback`, o fluxo não será aceito corretamente. Mesmo no fluxo manual, a URL de retorno precisa continuar sendo a callback configurada no aplicativo OAuth web.

**O que fazer agora**

1. Verifique a Redirect URI configurada no lado da OpenAI.
2. Para desenvolvimento local, use exatamente `http://localhost:5173/oauth/callback`.
3. Para produção, use exatamente a URL cadastrada com o mesmo caminho `/oauth/callback`.
4. Não use `/auth/callback`, porque esse caminho está errado para este repositório.
5. Salve a configuração e tente de novo.

### Codex não habilitado no workspace

**O que você provavelmente vai ver**

Uma mensagem de acesso negado, ou um erro com o texto `missing_codex_entitlement`.

**O que isso significa**

Sua conta ou seu workspace ainda não têm acesso liberado ao Codex, então o login pode começar, mas não termina com sucesso.

**O que fazer agora**

1. Entre em contato com o administrador do workspace.
2. Informe que o erro exibido foi `missing_codex_entitlement`.
3. Peça a confirmação de que o Codex está habilitado para sua organização ou workspace.
4. Depois da liberação, refaça o login.

## Quando pedir ajuda

Peça ajuda ao time responsável quando:

- `OPENAI_CODEX_WEB_CLIENT_ID` já está em `core/kernel/.env` e o erro continua;
- a Redirect URI já está correta e mesmo assim o retorno não vai para `/oauth/callback`;
- aparece `missing_codex_entitlement` e você não é administrador do workspace;
- você não sabe onde encontrar o OpenAI web client ID.

Ao pedir ajuda, envie apenas o que for seguro: qual passo falhou, a mensagem visível na tela e se você estava em ambiente local ou produção. Não envie tokens, segredos ou screenshots com dados sensíveis.
