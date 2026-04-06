# Andromeda SO - Agent Operating Guide

## Objetivo
Este projeto usa rules, skills e workflows locais para orientar o agente de desenvolvimento.

## Ordem de precedência
1. Este arquivo (`AGENTS.md`)
2. Arquivos em `.agent/rules/`
3. Arquivos em `.agent/workflows/`
4. Arquivos em `.agent/skills/`

## Princípios globais
- Nunca invente fatos sobre o código sem verificar os arquivos relevantes.
- Nunca faça mudanças arquiteturais grandes sem passar por análise ou design explícito.
- Toda feature nova deve seguir TDD sempre que viável.
- Toda alteração relevante deve passar por validação das rules locais.
- Prefira mudanças pequenas, reversíveis e bem testadas.
- Não duplique lógica já existente.
- Não introduza dependências sem justificar necessidade.
- Não altere contratos de API sem validar consistência.
- Não exponha segredos, dados sensíveis ou credenciais.
- Sempre adapte a solução à stack detectada no repositório.
- Se o runtime não expuser skills carregáveis automaticamente, use leitura direta de `.agent/` como fallback oficial.

## Roteamento inicial
Ao receber uma tarefa:
1. Detecte a stack e a área afetada.
2. Escolha o workflow apropriado.
3. Carregue as rules relevantes.
4. Execute as skills necessárias.
5. Valide Definition of Done antes de encerrar.

## Escolha de workflow
- Use `quickstart` para iniciar qualquer tarefa ambígua.
- Use `probe` para entender código existente antes de alterar.
- Use `genesis` para features novas ou mudanças estruturais.
- Use `challenge` para revisar propostas complexas ou arriscadas.
- Use `execute-feature` para implementação de feature aprovada.
- Use `bugfix` para correções.
- Use `refactor` para melhorias internas sem mudança de comportamento.

## Critério de encerramento
Uma tarefa só pode ser considerada concluída quando:
- regras aplicáveis foram respeitadas
- testes relevantes existem e passam
- impactos foram verificados
- documentação mínima foi atualizada, se necessário
- riscos conhecidos foram declarados
