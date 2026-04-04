## 1. Backend Authentication API

- [ ] 1.1 Criar contratos de API para `/auth/login`, `/auth/logout` e `/auth/session` com respostas padronizadas de sucesso e erro
- [ ] 1.2 Implementar servico de autenticacao para validar credenciais e emitir sessao autenticada com expiracao
- [ ] 1.3 Implementar endpoint de logout para invalidar sessao ativa e retornar confirmacao
- [ ] 1.4 Implementar endpoint de consulta de sessao para retornar estado autenticado/nao autenticado

## 2. Session Protection And Security

- [ ] 2.1 Implementar middleware de autenticacao para proteger rotas privadas e responder 401 para acessos nao autenticados
- [ ] 2.2 Integrar middleware nas rotas protegidas existentes que exigem identidade autenticada
- [ ] 2.3 Configurar validacao obrigatoria de segredo de assinatura em ambiente e falha de inicializacao quando ausente

## 3. Frontend Login Flow

- [ ] 3.1 Criar tela de login com formulario de credenciais e tratamento de erros de autenticacao
- [ ] 3.2 Implementar gerenciamento centralizado de estado autenticado e utilitarios para login/logout/check de sessao
- [ ] 3.3 Adicionar guarda de rotas para redirecionar usuarios nao autenticados para a tela de login
- [ ] 3.4 Implementar tratamento global de sessao expirada (401) com redirecionamento controlado

## 4. Verification

- [ ] 4.1 Adicionar testes backend para cenarios de login valido, login invalido, logout e sessao
- [ ] 4.2 Adicionar testes backend para acesso a rota protegida com e sem autenticacao
- [ ] 4.3 Adicionar testes frontend para fluxo de login e redirecionamento de rotas protegidas
- [ ] 4.4 Executar suites de teste e ajustar inconsistencias de contrato entre frontend e backend
