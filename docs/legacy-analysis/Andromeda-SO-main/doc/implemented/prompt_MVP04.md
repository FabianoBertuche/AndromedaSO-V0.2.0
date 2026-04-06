Leia e execute integralmente o documento `/doc/Andromeda_PRD_MVP04.md` como especificação oficial do próximo ciclo do projeto Andromeda.

Objetivo:
Implementar o MVP04 exatamente conforme definido no PRD, com foco em:
- Central de Modelos
- gestão de providers
- catálogo de modelos
- capability registry
- benchmark engine
- intelligent llm router
- integração inicial com Ollama local e Ollama cloud
- interface de administração e observabilidade

Instruções de execução:
1. Leia todo o documento antes de alterar qualquer arquivo.
2. Extraia a arquitetura, módulos, entidades, fluxos, páginas, endpoints e critérios de aceite.
3. Gere um plano de implementação em etapas curtas e lógicas.
4. Comece pela base estrutural do backend.
5. Em seguida implemente os contratos, entidades e serviços centrais.
6. Depois implemente os adapters/providers.
7. Depois implemente os endpoints.
8. Depois implemente a interface web do módulo.
9. Preserve o padrão arquitetural já existente no projeto.
10. Não faça gambiarra, não acople a UI diretamente ao provider e não quebre a separação entre core, application e adapters.
11. Sempre que houver ambiguidade, decida da forma mais aderente ao PRD e registre a decisão.
12. Sempre mostre progresso, arquivos criados/alterados e justificativa técnica curta.
13. Ao final de cada etapa, informe:
   - o que foi feito
   - o que falta
   - riscos ou pendências
   - próximos passos

Regras importantes:
- tratar o PRD como fonte de verdade
- manter extensibilidade para futuros providers além de Ollama
- implementar usando API dos providers, não CLI como base principal
- deixar preparado para benchmark, score, custo, fallback e explicabilidade do roteador
- registrar decisões de roteamento de forma auditável
- priorizar código limpo, modular e evolutivo

Entregas esperadas:
- estrutura de módulos do MVP04
- contratos e entidades principais
- provider registry
- model catalog
- pricing model
- capability registry
- benchmark engine inicial
- llm router inicial
- integração com Ollama
- páginas da interface
- endpoints necessários
- documentação técnica complementar, se necessário

Comece agora pela análise do documento e pela criação do plano de implementação.