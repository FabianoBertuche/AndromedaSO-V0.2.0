$ErrorActionPreference = 'Stop'

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error '[start] Node.js nao encontrado no PATH.'
    exit 1
}

& node "$PSScriptRoot\start-project.mjs" @args
