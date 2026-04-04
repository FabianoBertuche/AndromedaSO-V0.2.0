# SDD Problem Handling Rule — Pare e Reporte Problemas

## SE ENCONTREI PROBLEMA NÃO COBERTO PELO DESIGN

### Passo 1: PARE
```
[STOP] — Problema encontrado
```

### Passo 2: DESCREVA
```
**Problema:** [descrição clara do problema]

**Onde:** [arquivo, linha, contexto]

**O que o design diz:** [o que deveria acontecer]

**O que aconteceu:** [o que você observou]
```

### Passo 3: AGUARDE
```
Aguardo sua instrução antes de continuar.
```

## TIPOS DE PROBLEMA

| Tipo | Ação |
|------|------|
| Design vago/incompleto | Reporte + aguarde clarificação |
| Dependência faltando | Reporte + aguarde orientação |
| Conflito com outra feature | Reporte + aguarde decisão |
| Erro de compilação não related to task | Corrija + continue |
| Task impossível de executar como escrita | Reporte + aguarde |
| Arquitetura não coberta pelo design | **PARE** + reporte |

## O QUE NÃO FAZER

- ❌ Tentar "adivinhar" a solução
- ❌ Modificar o design para "corrigir"
- ❌ Implementar algo não especificado
- ❌ Pedir desculpas e continuar mesmo assim
- ❌ Ignorar o problema

## DECISÕES ARQUITETURAIS

Se o problema requer decisão arquitetural (o design não cobre):
- **PARE** imediatamente
- Descreva a decisão necessária
- **NÃO** tome a decisão por conta própria

---

**Problema não resolvido = trabalho não concluído.**
