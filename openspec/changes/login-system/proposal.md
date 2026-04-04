## Why

O sistema atualmente nao possui autenticacao de usuarios, o que impede controle de acesso por identidade e aumenta risco de uso indevido. Este cambio e necessario agora para habilitar acesso seguro por conta e servir de base para autorizacao futura.

## What Changes

- Adicionar fluxo de login com credenciais para usuarios cadastrados.
- Adicionar fluxo de logout para encerrar sessao ativa com seguranca.
- Adicionar validacao de sessao para proteger rotas que exigem autenticacao.
- Expor respostas de erro padronizadas para credenciais invalidas e sessoes expiradas.
- Atualizar frontend para incluir tela de login e redirecionamento com base no estado autenticado.

## Capabilities

### New Capabilities
- `user-authentication`: Cobre login, logout, gerenciamento de sessao e protecao de recursos autenticados.

### Modified Capabilities
- Nenhuma.

## Impact

- Backend kernel: novas rotas e servicos de autenticacao/sessao.
- Persistencia: armazenamento de usuarios e/ou sessoes conforme design.
- Frontend: nova interface de login e controle de acesso a paginas protegidas.
- API contracts: novos endpoints de autenticacao e novos codigos de erro relacionados.
