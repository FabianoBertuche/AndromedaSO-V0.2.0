# Andromeda Spec Bootstrap

Este pacote contém a base inicial para iniciar o Andromeda SO V0.2.0 com spec-kit.

## Conteúdo

- `memory/constitution.md`: constituição inicial do projeto com stack, organização modular, ciclos de implementação e princípios SDD/TDD.

## Como usar

1. Extraia este conteúdo na raiz do projeto.
2. Confirme se a pasta `memory/` está na raiz.
3. Revise `memory/constitution.md`.
4. Ajuste termos, nomes de diretórios e regras finas conforme sua decisão final.
5. Depois comece o primeiro ciclo com as specs:
   - core/kernel
   - providers
   - canais de comunicação

## Próximo passo sugerido

Após validar esta constituição:

1. Rodar `/speckit.constitution` se quiser alinhar com o fluxo do kit.
2. Criar a primeira spec do core registry/kernel integration.
3. Depois criar specs de providers e canais.
4. Só então seguir para o módulo de agentes.
