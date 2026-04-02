# Constituição do Projeto — Andromeda SO V0.2.0

## Preâmbulo

Esta constituição define os princípios arquiteturais, organizacionais e operacionais imutáveis do Andromeda SO V0.2.0.

Todo agente de IA, desenvolvedor ou processo automatizado DEVE ler e respeitar este documento antes de criar, alterar, planejar ou implementar qualquer parte do sistema.

O Andromeda DEVE ser desenvolvido segundo os princípios de Spec-Driven Development (SDD) e Test-Driven Development (TDD), com foco em modularidade, coesão sistêmica, contratos explícitos, previsibilidade de comportamento e crescimento arquitetural controlado.

---

## Artigo I — Primazia da Especificação

1. A especificação é a fonte primária da verdade do projeto.
2. Código serve à especificação; código não redefine a especificação por conta própria.
3. Toda nova funcionalidade DEVE nascer a partir de uma spec aprovada.
4. Toda mudança arquitetural relevante DEVE ser refletida primeiro em specification, plan ou constitution, conforme o nível da decisão.

---

## Artigo II — SDD Obrigatório

1. Todo trabalho DEVE seguir o fluxo do spec-kit:
   - constitution
   - specify
   - clarify
   - plan
   - tasks
   - implement
2. Nenhum módulo ou funcionalidade pode ser implementado sem:
   - spec existente;
   - ambiguidades resolvidas;
   - plano técnico aprovado;
   - tasks derivadas do plano.
3. O uso do spec-kit DEVE ser incremental, com features pequenas, rastreáveis e encadeadas por dependências claras.

---

## Artigo III — TDD Obrigatório

1. Toda implementação DEVE seguir Test-Driven Development.
2. Nenhuma implementação pode ser aceita sem:
   - contrato definido;
   - teste escrito antes;
   - teste executado em estado RED;
   - implementação mínima para estado GREEN;
   - refatoração segura.
3. Testes de contrato, integração e cenário têm prioridade sobre abstrações especulativas.
4. Todo comportamento crítico do sistema DEVE ser coberto por testes reproduzíveis.

---

## Artigo IV — Coesão Sistêmica

1. O Andromeda DEVE evoluir como um sistema coeso, integrado e extensível.
2. Nenhum módulo pode ser tratado como ilha isolada.
3. Toda funcionalidade DEVE poder se integrar ao restante do sistema por contratos claros e previsíveis.
4. O core/kernel é o centro de integração sistêmica do projeto.
5. Toda evolução do sistema DEVE fortalecer a coesão geral, e não fragmentá-la.

---

## Artigo V — Core/Kernel como Centro Vivo do Sistema

1. O core/kernel DEVE ser estruturado para absorver novas capacidades ao longo do crescimento do sistema.
2. Sempre que um novo tipo de módulo, grupo funcional, capacidade ou função for introduzido, o core/kernel DEVE ser revisado e, quando necessário, ampliado para absorver essa nova capacidade de forma estrutural.
3. O core/kernel NÃO DEVE crescer por remendos locais, exceções ad hoc ou lógica espalhada.
4. Toda expansão do core/kernel DEVE:
   - preservar retrocompatibilidade sempre que possível;
   - reduzir acoplamento;
   - fortalecer contratos comuns;
   - manter capacidade de descoberta, registro, validação e execução de módulos.

---

## Artigo VI — Estrutura Obrigatória por Módulo

1. Todo novo módulo DEVE nascer em uma pasta raiz própria.
2. Nenhuma funcionalidade de módulo pode ser espalhada pelo repositório sem uma raiz de domínio explícita.
3. A estrutura padrão de módulos DEVE seguir o padrão abaixo:

```text
modules/
  <module-name>/
    module.manifest.yaml
    README.md
    contracts/
    config/
    groups/
      <group-name>/
        group.manifest.yaml
        README.md
        contracts/
        variants/
          <variant-name>/
            variant.manifest.yaml
            README.md
            config/
            adapter/
            metadata/
            tests/
            scenarios/
```

4. Todo módulo herda esta constituição.
5. Regras locais podem complementar a organização do módulo, mas nunca contradizer esta constituição.

---

## Artigo VII — Organização por Grupos e Variantes

1. Módulos com múltiplas famílias de aplicações, integrações ou especializações DEVEM usar `groups/`.
2. Cada implementação concreta DEVE existir em sua própria pasta em `variants/<variant-name>/`.
3. Adicionar uma nova integração, template, variante ou cenário DEVE significar criar novo diretório ou novo arquivo dentro da estrutura padrão do módulo.
4. O crescimento do sistema DEVE ocorrer por adição organizada, e nunca por espalhamento de código em múltiplos pontos arbitrários.

---

## Artigo VIII — Contratos Canônicos

1. Toda integração entre core/kernel e módulos DEVE ocorrer por contratos explícitos e versionáveis.
2. Formatos de entrada e saída DEVEM ser padronizados por domínio.
3. O core/kernel NUNCA deve depender de detalhes internos de uma variante.
4. O core/kernel só pode depender de:
   - contratos;
   - manifestos;
   - capacidades registradas;
   - mecanismos de discovery, validação e registry.
5. Toda mudança em contrato DEVE ter rastreabilidade em spec, plan e testes.

---

## Artigo IX — Stack Oficial V1

A stack oficial inicial do Andromeda SO V0.2.0 é:

- **Core / Kernel lógico:** TypeScript + Node.js
- **API principal:** Fastify
- **Validação de contratos:** Zod
- **Persistência principal:** PostgreSQL
- **Busca vetorial inicial:** pgvector
- **Coordenação efêmera / cache / filas curtas:** Redis
- **Camada especializada de IA / RAG / pipelines semânticos:** Python
- **Armazenamento de artefatos:** S3-compatible storage
- **Acesso relacional principal:** Drizzle ORM

Regras:
1. TypeScript é a linguagem principal do core e da integração sistêmica.
2. Python é permitido apenas em módulos especializados de IA, dados, RAG, avaliação e pipelines correlatos.
3. PostgreSQL é o sistema de registro principal do projeto.
4. Redis não substitui o banco principal.
5. Toda interação entre TypeScript e Python DEVE ocorrer por contratos explícitos e testes de contrato.

---

## Artigo X — Simplicidade Estrutural

1. O projeto DEVE evitar complexidade prematura.
2. Nenhuma tecnologia adicional deve ser adotada sem justificativa clara em plan ou ADR.
3. O sistema DEVE começar simples e crescer apenas quando a spec exigir.
4. Abstrações só devem existir quando reduzirem acoplamento real ou repetição comprovada.

---

## Artigo XI — Ordem de Implementação por Ciclos

A ordem inicial de implementação do Andromeda DEVE respeitar os seguintes ciclos:

### Ciclo 1 — Fundação Sistêmica
Implementar primeiro:
1. core/kernel
2. providers
3. canais de comunicação

Objetivo:
Estabelecer a fundação coesa do sistema, os contratos-base, o registry, os mecanismos de discovery, integração e execução de módulos.

### Ciclo 2 — Base do Módulo de Agentes
Implementar depois:
1. base do módulo de agentes;
2. criação de agentes;
3. personalização de agentes;
4. edição de agentes;
5. exclusão de agentes;
6. resolução de configuração final do agente;
7. sistema de templates pré-configurados.

Objetivo:
Garantir que agentes sejam entidades configuráveis, persistentes e estritamente guiadas por personalidade, parâmetros e regras declaradas.

---

## Artigo XII — Módulo de Agentes

1. O módulo de agentes DEVE seguir o mesmo padrão modular definido para todos os demais módulos.
2. O sistema de agentes DEVE suportar:
   - criação;
   - personalização;
   - edição;
   - exclusão;
   - resolução de configuração consolidada;
   - templates pré-configurados.
3. A configuração final do agente DEVE ser determinística, rastreável e testável.
4. O agente DEVE receber sua configuração consolidada antes da execução.
5. O agente DEVE agir em conformidade estrita com:
   - personalidade;
   - parâmetros;
   - regras operacionais;
   - limites;
   - templates herdados;
   - overrides aplicados.
6. Templates de agentes DEVEM ser modulares.
7. Adicionar um novo template DEVE significar adicionar novo artefato dentro da pasta correspondente, sem modificar o sistema de forma espalhada.

---

## Artigo XIII — Testabilidade por Módulo

1. Todo módulo DEVE possuir testes locais.
2. Toda variante DEVE possuir testes próprios sempre que tiver comportamento específico.
3. Cenários novos DEVEM poder ser adicionados por novos arquivos, sem reescrever a arquitetura do módulo.
4. Scripts, cenários e fixtures DEVEM ser tratados como artefatos de primeira classe do sistema.

---

## Artigo XIV — Rastreabilidade

1. Toda decisão relevante DEVE ser rastreável entre:
   - constitution;
   - spec;
   - plan;
   - tasks;
   - implementação;
   - testes.
2. Nenhuma mudança importante deve existir apenas no código sem reflexo documental correspondente.

---

## Artigo XV — Prevalência Constitucional

1. Esta constituição prevalece sobre convenções locais, preferências pessoais e decisões ad hoc.
2. Em caso de conflito entre implementação e constituição, a constituição prevalece.
3. Mudanças nesta constituição exigem justificativa explícita e revisão cuidadosa.

