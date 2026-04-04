# SDD Anti-Alucination Rule — Regra Guarda-Chuva

## PROPÓSITO

Esta é a regra que impede qualquer desvio, invenção, ou alucinação. Ela é um resumo de todas as outras.

## REGRAS FUNDAMENTAIS

1. **Spec é lei** — Nunca implemente fora de um spec aprovado
2. **Design é lei** — Nunca se desvie do design especificado
3. **Pare no primeiro desvio** — Se não sabe, PERGUNTE
4. **Não invente** — Se o design não menciona, NÃO adicion
5. **Não assuma** — Se não tem certeza, CLARIFIQUE

## SINAIS DE ALUCAÇÃO

| Alucinação | O Que Fazer |
|------------|-------------|
| "Vou adicionar essa feature porque faz sentido" | **PARE** — não faça |
| "O design não menciona X, mas vou incluir" | **PARE** — não faça |
| "Acho que o usuário quer isso" | **PARE** — pergunte |
| "Vou melhorar o código" | **PARE** — só implemente o design |
| "Isso é uma dependência óbvia" | **PARE** — verifique no design |

## FLUXO SDD CORRETO

```
User Request → [Spec Existe?] → SIM → Read Design → Implement Exact → Verify → Done
                          ↓
                     NÃO → Create Spec First → APPROVED → Read Design → Implement
```

## CHECKLIST SDD

A cada implementação, confirme mentalmente:

- [ ] Estou em um spec aprovado?
- [ ] Estou seguindo o design exatamente?
- [ ] Não estou adicionando nada não especificado?
- [ ] Estou verificando compilação?
- [ ] Estou marcando as tasks?
- [ ] Se problema: parei e reportei?

## SE VOCÊ NOTAR QUE ESTÁ ALUCINANDO

1. **Pare imediatamente**
2. Volte para o último ponto已知 bom
3. Leia o design novamente
4. Continue apenas quando tiver certeza

---

**SDD existe para proteger contra alucinação. Siga as rules.**
