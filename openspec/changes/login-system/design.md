## Context

O backend e frontend atuais nao possuem autenticacao por usuario. Sem login, qualquer pessoa com acesso ao cliente pode usar funcionalidades sem identidade validada. O projeto precisa de uma base segura de autenticacao para liberar recursos protegidos e suportar evolucoes de autorizacao no futuro.

## Goals / Non-Goals

**Goals:**
- Introduzir autenticacao por credenciais com sessao autenticada.
- Definir contrato claro de login, logout e validacao de sessao.
- Proteger rotas privadas no backend e navegacao protegida no frontend.
- Garantir respostas consistentes para estados invalidos (credencial incorreta, sessao expirada).

**Non-Goals:**
- Cadastro publico de usuarios.
- Recuperacao de senha por email.
- Controle de permissao por papeis (RBAC).
- Login social/OAuth externo.

## Decisions

1. Sessao baseada em token assinado com expiracao curta e renovacao via novo login.
Rationale: reduz acoplamento inicial com armazenamento stateful complexo, mantendo validacao eficiente no backend.
Alternativas consideradas: sessao persistida em banco/redis (maior complexidade operacional para o escopo inicial).

2. Endpoints dedicados `/auth/login`, `/auth/logout` e `/auth/session`.
Rationale: separa claramente operacoes de autenticacao de demais recursos da API e facilita testes de contrato.
Alternativas consideradas: embutir autenticacao em endpoints existentes (baixa clareza e pior manutencao).

3. Middleware de autenticacao para rotas protegidas.
Rationale: evita duplicacao de validacao de sessao por handler e padroniza respostas 401.
Alternativas consideradas: validacao manual em cada rota (mais propensa a falhas e inconsistencias).

4. Frontend com guarda de rotas e estado autenticado centralizado.
Rationale: melhora experiencia do usuario, redirecionando para login quando nao autenticado.
Alternativas consideradas: verificacao isolada por pagina (duplicacao de logica e maior risco de divergencia).

## Risks / Trade-offs

- [Token comprometido no cliente] -> Mitigacao: expirar token em janela curta e invalidar no logout.
- [Complexidade futura para revogacao global de sessoes] -> Mitigacao: manter contrato preparado para evoluir para lista de revogacao stateful.
- [Falhas de UX por expiracao inesperada] -> Mitigacao: tratar 401 globalmente no frontend e redirecionar com mensagem clara.
- [Diferencas entre ambientes sobre segredo de assinatura] -> Mitigacao: obrigar configuracao explicita de segredo e falhar startup quando ausente.
