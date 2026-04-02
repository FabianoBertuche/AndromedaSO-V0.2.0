# Criar Repositório no GitHub

## Opção 1: Manualmente via GitHub Web (Recomendado)

1. Acesse https://github.com/new
2. Digite o nome do repositório: `andromeda-so`
3. Descrição: `Andromeda SO V0.2.0 - Core Kernel Integration`
4. Escolha:
   - ☐ **Public** (se quiser compartilhar)
   - ☑ **Private** (se for privado)
5. ✅ **Não** selecione "Initialize this repository with:"
6. Clique em "Create repository"
7. Copie a URL HTTPS ou SSH que aparecerá

## Opção 2: Instalar GitHub CLI e Criar via Terminal

### Instalar GitHub CLI

```powershell
# Usando Chocolatey
choco install gh

# Ou usando scoop
scoop install gh

# Ou baixe direto de https://github.com/cli/cli/releases
```

### Autenticar

```powershell
gh auth login
# Escolha: GitHub.com
# Escolha: HTTPS
# Selecione: Leave blank (para usar token via browser)
```

### Criar repositório

```powershell
cd "c:\FB\Andromeda SO V0.2.0"
gh repo create andromeda-so --private --source=. --remote=origin --push
```

## Opção 3: Após Criar o Repositório, Configure e Faça Push

```powershell
cd "c:\FB\Andromeda SO V0.2.0"

# Configure o remote (substitua URL_DO_REPO pela URL do repositório que criou)
git remote add origin URL_DO_REPO

# Exemplo com HTTPS:
# git remote add origin https://github.com/seu-usuario/andromeda-so.git

# Ou com SSH:
# git remote add origin git@github.com:seu-usuario/andromeda-so.git

# Faça o push
git push -u origin 001-core-kernel-integration
```

## Exemplo Prático

```powershell
# Após criar o repo em https://github.com/seu-usuario/andromeda-so
cd "c:\FB\Andromeda SO V0.2.0"
git remote add origin https://github.com/seu-usuario/andromeda-so.git
git push -u origin 001-core-kernel-integration
```

## Status Atual

- **Repositório Local**: ✅ Pronto
- **Branch**: `001-core-kernel-integration` 
- **Commits**: 2 (Phase 5 completo)
- **Tests**: 28/28 passing
- **Remote GitHub**: ⏳ Aguardando criação

---

**Próximo passo**: Crie o repositório e me envie a URL para eu fazer o push!
