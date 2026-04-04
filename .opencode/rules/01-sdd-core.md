# SDD Core Rule — Nunca Implemente Sem Spec

## REGRA ABSOLUTA

**PROIBIDO** escrever código para uma feature sem que exista um spec aprovado em `.kiro/specs/{feature-name}/`.

## Spec Válido

Um spec válido contém TODOS os três arquivos:
- `requirements.md` — o que fazer e por quê
- `design.md` — como fazer (arquitetura, interfaces, código)
- `tasks.md` — lista ordenada de tasks

Se qualquer um desses arquivos estiver ausente, **PARE** e informe o usuário.

## Onde Encontrar Specs

Todos os specs do projeto estão em: `.kiro/specs/{feature-name}/`

## Checklist Antes de Implementar

- [ ] Spec existe em `.kiro/specs/{feature-name}/`
- [ ] `requirements.md` presente
- [ ] `design.md` presente
- [ ] `tasks.md` presente
- [ ] Todas as tasks marcadas `- [ ]` ou `- [-]` são compreendidas

## Se Spec Não Existe

Se o usuário pedir para implementar algo que não tem spec:
1. **PARE**
2. Diga: "Preciso de um spec aprovado antes de implementar. Quer que eu crie um usando o workflow OpenSpec?"
3. Use a skill `sdd-propose.md` para criar a spec

---

**Violação desta regra = implementação não autorizada = PARA.**
