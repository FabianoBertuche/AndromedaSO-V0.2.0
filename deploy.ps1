$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Test-Path '.env.prod')) {
  if (Test-Path '.env.prod.example') {
    Copy-Item '.env.prod.example' '.env.prod'
    Write-Host 'Created .env.prod from .env.prod.example' -ForegroundColor Yellow
  } else {
    throw '.env.prod not found and .env.prod.example is missing.'
  }
}

docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

docker compose -f docker-compose.prod.yml ps

docker compose -f docker-compose.prod.yml logs -f kernel
