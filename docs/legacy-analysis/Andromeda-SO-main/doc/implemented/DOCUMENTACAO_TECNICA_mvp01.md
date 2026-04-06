# Documentação Técnica - Andromeda OS MVP v0.1

Esta documentação detalha a arquitetura, as funcionalidades implementadas e a referência completa da API do Andromeda OS na sua versão MVP v0.1.

## 🏗️ Arquitetura do Sistema

O Andromeda OS foi construído utilizando os princípios de **Clean Architecture** e **Ports & Adapters**, garantindo que a lógica de negócio (Core) seja independente de tecnologias externas (API, Banco de Dados, Runtimes).

### Estrutura de Pastas
- `packages/api/src/core`: Contém o domínio (entidades, interfaces) e os casos de uso (regras de negócio). Nosso núcleo agora reside dentro da API para facilitar o monorepo simplificado do MVP.
- `packages/api/src/presentation`: Contém os controladores e rotas Express.
- `packages/api/src/infrastructure`: Implementações de infraestrutura como o repositório em memória e runtimes de script.

---

## 📡 Referência da API (REST)

O servidor roda por padrão na porta **5000**.

### 1. Tarefas (Tasks)
Gerencia o ciclo de vida das requisições do usuário.

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `POST` | `/tasks` | Cria uma nova tarefa. |
| `GET` | `/tasks` | Lista todas as tarefas (histórico em memória). |
| `GET` | `/tasks/:id` | Obtém detalhes de uma tarefa específica. |
| `POST` | `/tasks/:id/execute` | Dispara o motor de execução para processar a tarefa. |

#### Exemplo de Criação de Task:
```json
{
  "raw_request": "Use a calculadora para somar 10 + 20",
  "metadata": {
    "input": { "a": 10, "b": 20 }
  }
}
```

---

### 2. Habilidades (Skills)
Gerencia scripts determinísticos executados em sandbox.

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `POST` | `/skills` | Registra uma nova habilidade (script). |
| `GET` | `/skills` | Lista todas as habilidades cadastradas. |
| `POST` | `/skills/:id/execute` | Testa a execução manual de uma skill. |

#### Exemplo de Registro de Skill:
```json
{
  "id": "calc-01",
  "name": "calculadora",
  "description": "soma",
  "type": "script",
  "code": "result = input.a + input.b;"
}
```

---

### 3. Agentes (Agents)
Gerencia as personas de IA e o roteamento de LLM.

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `POST` | `/agents` | Cadastra um novo agente de IA. |
| `GET` | `/agents` | Lista todos os agentes cadastrados. |
| `GET` | `/agents/:id` | Detalhes de um agente específico. |

#### Exemplo de Registro de Agente:
```json
{
  "name": "Poeta",
  "description": "Especialista em rimas",
  "model": "gpt-4",
  "systemPrompt": "Você é um poeta que responde apenas em versos.",
  "temperature": 0.8
}
```

---

## ⚙️ Motor de Execução (Smart Router)

O motor de execução implementa a política **Skill-First**:
1. Ao executar uma tarefa, ele consulta o `SkillRegistry`.
2. Se o pedido (`raw_request`) contiver o nome ou a descrição de uma **Skill**, ele executa o script no sandbox.
3. Caso contrário, ele encaminha o pedido para o **Kernel Agent** via LLM (Mock v1).

---

## 🛠️ Tecnologias Utilizadas
- **Runtime**: Node.js / TypeScript.
- **Web Framework**: Express.js.
- **Security**: Helmet, CORS.
- **Sandbox**: Módulo nativo `vm` para isolamento de scripts.
- **Monorepo**: npm Workspaces.
