## Why

A UI atual de gestão de agentes no Andromeda SO está incompleta e não expõe a totalidade dos parâmetros canônicos definidos para o sistema. Com aproximadamente ~170 campos canônicos documentados, a atual implementação cobre apenas uma fração desses parâmetros, limitando severamente a capacidade de personalização e controle granular dos agentes. Esta mudança é necessária para:

- Habilitar configuração completa de todos os parâmetros canônicos do agente
- Garantir que o agente receba todos os parâmetros e possa agir/pensar de acordo com eles
- Alinhar a UI com o layout estruturado do sistema legado
- Fornecer uma interface unificada e completa para gestão de agentes

## What Changes

- Reestruturar a UI de agentes para seguir o layout do legado com 8 tabs principais: Identity, History, Performance, Suggestions, Behavior, Safeguards, Sandbox, Chat
- Adicionar 2 novas tabs dedicadas: Capabilities e Channels
- Implementar seção de Configuração Resolvida (read-only) para visualização dos parâmetros efetivos
- Expor e tornar editáveis TODOS os ~170 campos canônicos definidos em `docs/suporte/andromeda-agents-canonical-fields.md`
- Adaptar o layout ao novo stack (React 18 + TanStack Query + TailwindCSS)
- Garantir persistência correta de todos os campos via API do kernel

## Capabilities

### New Capabilities
- `agent-canonical-fields-ui`: Cobre a exposição completa de todos os ~170 campos canônicos em interface organizada por tabs
- `agent-resolved-config-view`: Visualização read-only da configuração resolvida do agente

### Modified Capabilities
- `agent-management-ui`: Expandida para incluir todas as tabs e campos canônicos

## Impact

- Frontend: reestruturação completa da página `Agents.tsx`
- Componentes: novos componentes de formulário para cada categoria de campos
- API contracts: reutilização dos contratos existentes, mas com cobertura total dos campos
- UX: mudança significativa na organização da informação, alinhada ao layout legado
- Performance: potencial impacto devido ao grande número de campos (mitigado com lazy loading de tabs)
