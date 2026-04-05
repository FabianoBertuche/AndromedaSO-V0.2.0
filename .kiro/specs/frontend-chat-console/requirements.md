# Documento de Requisitos — Frontend Chat Console

## Introdução

Esta feature substitui o foco atual da aba `models` por uma **tela de console de bate-papo** no frontend do Andromeda. A tela deve permitir que o usuário escolha um modelo já disponível no sistema, envie mensagens, veja respostas do assistente, acompanhe o histórico da conversa atual, receba feedback de carregamento e erro, e limpe a conversa quando quiser.

O escopo é **estritamente frontend**. Esta spec não cobre criação de providers, sincronização de modelos, gestão de catálogo, mudanças na navegação principal, benchmark, router UI nem qualquer feature além do chat.

> Dependência conhecida: o repositório atual não expõe uma rota de chat de provider/modelo no kernel. Esta spec assume a existência de um endpoint de chat compatível no momento da implementação. Se esse endpoint não existir, a implementação deve parar e solicitar uma spec backend dedicada.

---

## Glossário

- **Chat console**: tela única de conversa com seleção de modelo e histórico local.
- **Modelo disponível**: modelo já presente no sistema via catálogos já sincronizados dos providers existentes.
- **Conversa atual**: histórico mantido apenas em memória durante a sessão aberta da tela.
- **Mensagem do usuário**: texto digitado e enviado pelo operador.
- **Mensagem do assistente**: resposta retornada pelo backend para o modelo selecionado.
- **Estado de envio**: período entre o envio da mensagem e a chegada da resposta.

---

## Requisitos

### Requisito 1: Tela única de chat no frontend

**User Story:** Como operador, quero uma tela única de chat no frontend, para conversar diretamente com um modelo sem navegar por fluxos de configuração de provider.

#### Critérios de Aceitação

1. THE frontend SHALL exibir uma tela dedicada de chat na aba já existente de `models`, sem adicionar nova navegação principal.
2. THE tela SHALL priorizar a experiência de conversa e SHALL NOT expor controles de criação de provider, sync de catálogo, benchmark ou router intelligence.
3. THE implementação SHALL reutilizar a estrutura visual do frontend atual em React + Tailwind, mantendo a linguagem neon matrix já adotada.
4. THE tela SHALL funcionar em desktop e mobile.

---

### Requisito 2: Combobox de seleção de modelos já disponíveis

**User Story:** Como operador, quero selecionar um modelo já adicionado ao sistema, para decidir com qual modelo conversar antes de enviar mensagens.

#### Critérios de Aceitação

1. THE tela SHALL exibir um combobox para seleção de modelo.
2. THE combobox SHALL ser preenchido apenas com modelos já disponíveis no sistema a partir dos providers/catálogos existentes, sem introduzir nova lógica de gestão de catálogo.
3. THE opções do combobox SHALL identificar claramente o modelo e sua origem suficiente para desambiguar itens repetidos entre providers.
4. WHEN não houver nenhum modelo disponível, THEN a tela SHALL exibir um estado vazio amigável e SHALL desabilitar o envio de mensagens.
5. THE tela SHALL exigir um modelo selecionado antes de permitir envio.

---

### Requisito 3: Envio de mensagens e exibição de respostas

**User Story:** Como operador, quero enviar mensagens para o modelo selecionado e ver as respostas na mesma tela, para usar o frontend como um console de conversa.

#### Critérios de Aceitação

1. THE tela SHALL exibir uma área de composição de mensagem com campo de texto e ação explícita de envio.
2. WHEN o usuário enviar uma mensagem válida com um modelo selecionado, THEN o frontend SHALL chamar o endpoint de chat disponível no kernel usando o modelo selecionado e o histórico atual da conversa.
3. WHEN a resposta for concluída com sucesso, THEN a tela SHALL exibir a nova mensagem do assistente no histórico da conversa atual.
4. THE tela SHALL NOT permitir envio de mensagem vazia ou composta apenas por espaços.
5. WHILE houver envio em andamento, THE tela SHALL impedir reenvios concorrentes da mesma conversa.

---

### Requisito 4: Histórico da conversa atual

**User Story:** Como operador, quero manter o histórico da conversa atual na tela, para acompanhar o contexto sem perder as mensagens já trocadas.

#### Critérios de Aceitação

1. THE tela SHALL manter em memória a sequência de mensagens da conversa atual durante a permanência do usuário na página.
2. THE histórico SHALL distinguir visualmente mensagens do usuário e do assistente.
3. THE histórico SHALL preservar a ordem cronológica de envio e resposta.
4. THE conversa atual SHALL NOT ser persistida em backend, storage local ou catálogo como parte desta feature.
5. WHEN o usuário trocar o modelo selecionado, THEN a conversa atual SHALL ser limpa para evitar mistura de contexto entre modelos diferentes.

---

### Requisito 5: Loading e feedback operacional

**User Story:** Como operador, quero ver um estado de loading durante o envio, para saber que a mensagem foi recebida e está sendo processada.

#### Critérios de Aceitação

1. WHEN uma mensagem estiver em envio, THEN a tela SHALL exibir um estado visual claro de loading.
2. WHEN uma mensagem estiver em envio, THEN o botão de enviar SHALL ficar desabilitado.
3. WHEN uma mensagem estiver em envio, THEN o combobox de modelo SHALL ficar desabilitado.
4. WHEN a resposta chegar, THEN o estado de loading SHALL ser removido automaticamente.

---

### Requisito 6: Erro amigável

**User Story:** Como operador, quero receber um erro amigável quando o envio falhar, para entender o problema sem perder a conversa atual.

#### Critérios de Aceitação

1. IF o envio falhar, THEN a tela SHALL exibir uma mensagem amigável de erro inline, toast ou banner compatível com o padrão atual do frontend.
2. IF o backend retornar mensagem utilizável, THEN a tela SHALL preferir essa mensagem; caso contrário SHALL usar fallback amigável.
3. IF o envio falhar, THEN o histórico anterior da conversa SHALL ser preservado.
4. IF o envio falhar, THEN o usuário SHALL poder tentar novamente após o estado de loading ser encerrado.

---

### Requisito 7: Limpeza da conversa atual

**User Story:** Como operador, quero limpar a conversa atual, para começar um novo contexto rapidamente sem sair da tela.

#### Critérios de Aceitação

1. THE tela SHALL exibir uma ação explícita para limpar a conversa atual.
2. WHEN o usuário acionar a limpeza, THEN todas as mensagens da conversa atual SHALL ser removidas.
3. WHEN o usuário acionar a limpeza, THEN qualquer erro visível da conversa atual SHALL ser removido.
4. WHEN o usuário acionar a limpeza, THEN o modelo atualmente selecionado SHALL ser preservado.

---

### Requisito 8: Escopo restrito ao chat

**User Story:** Como time técnico, queremos entregar apenas o chat, para evitar que esta feature volte a crescer para gestão de providers e outras capacidades fora do objetivo.

#### Critérios de Aceitação

1. THE implementação SHALL NOT adicionar fluxos de criação, edição, exclusão ou autenticação de providers.
2. THE implementação SHALL NOT adicionar sync manual de modelos, seleção de modelo preferido, benchmark, router intelligence ou qualquer dashboard adicional.
3. THE implementação SHALL reutilizar APIs e hooks existentes de providers apenas para descobrir modelos já disponíveis.
4. IF a implementação depender de endpoint backend de chat inexistente, THEN o trabalho SHALL parar e o bloqueio SHALL ser reportado ao usuário em vez de inventar comportamento falso.

---

## Restrições de Escopo

### Dentro do escopo

- Tela de chat no frontend
- Combobox de seleção de modelo já disponível
- Envio de mensagem para modelo selecionado
- Exibição de resposta
- Histórico local da conversa atual
- Estados de loading, vazio e erro amigável
- Ação de limpar conversa
- Testes frontend necessários para a tela

### Fora do escopo

- Criação, edição, remoção ou autenticação de providers
- Sync de modelos
- Gestão de catálogo
- Mudanças na navegação principal do app
- Router UI e Router Intelligence
- Benchmark
- Persistência de histórico de conversa
- Streaming de tokens
- Upload de arquivos, tools, imagens, voz ou qualquer capacidade adicional
