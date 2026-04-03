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

## Execução local (sem conflito com Docker prod)

Se o stack de produção estiver ativo (`docker-compose.prod.yml`), as portas padrão podem ficar ocupadas.
Use os scripts locais abaixo:

1. Backend kernel (porta `4001`):

```bash
cd core/kernel
npm run start:local
```

2. Frontend (porta `5175`, proxy para backend local):

```bash
cd frontend
npm run dev:local
```

Endpoints úteis:

- Backend health: `http://localhost:4001/health`
- Frontend local: `http://localhost:5175/`
