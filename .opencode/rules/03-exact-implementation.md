# SDD Implementation Rule — Implemente EXATAMENTE o Design

## REGRA DE OURO

Se o `design.md` mostra o conteúdo exato de um arquivo, **use esse conteúdo exato**.

## PROIBIDO

- ❌ "Melhorar" o código do design
- ❌ "Simplificar" o código do design
- ❌ "Refatorar" além do que o design especifica
- ❌ Adicionar dependências não listadas no design
- ❌ Criar arquivos não listados no design
- ❌ Remover arquivos ou funcionalidades existentes
- ❌ Mudar contratos de API (endpoints, tipos, interfaces)
- ❌ Usar bibliotecas diferentes das especificadas

## O Design É a Verdade Absoluta

O design.md existe para que você não precise tomar decisões arquiteturais. Todas as decisões já foram tomadas. Sua job é implementar **exatamente** o que está lá.

## Se o Design Parecer Errado

1. **PARE** a implementação
2. **NÃO corrija o design por conta própria**
3. Reporte ao usuário: "O design especifica X, mas eu encontrei um problema: [descreva]"
4. Aguarde instrução

## Como Implementar

1. Leia o design.md linha por linha
2. Para cada arquivo mencionado, copie o conteúdo exato
3. Para cada função/interface, use os tipos especificados
4. Não acrescente funcionalidades não listadas

## Separação de Responsabilidades

- **Design** = o que e como (decidido pelo Kiro/arquiteto)
- **Você** = implementação fiel (decidido pelo OpenCode/coder)

---

**Design é lei. Você segue, não interpreta.**
