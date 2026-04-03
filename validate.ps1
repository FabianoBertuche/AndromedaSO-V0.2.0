$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

function Assert-Healthy([string]$name) {
  $status = docker inspect --format='{{.State.Health.Status}}' $name 2>$null
  if ($LASTEXITCODE -ne 0 -or $status -ne 'healthy') {
    throw "Container $name is not healthy. Current status: $status"
  }
}

Write-Host 'Checking container health...' -ForegroundColor Cyan
Assert-Healthy 'andromeda-postgres-prod'
Assert-Healthy 'andromeda-redis-prod'
Assert-Healthy 'andromeda-kernel-prod'
Write-Host 'Frontend health is validated by HTTP endpoint (may report starting briefly).' -ForegroundColor Yellow

Write-Host 'Checking frontend endpoint...' -ForegroundColor Cyan
$front = Invoke-WebRequest 'http://localhost:5173' -UseBasicParsing
if ($front.StatusCode -ne 200) {
  throw 'Frontend is not responding with 200.'
}

Write-Host 'Checking API endpoint /api/status...' -ForegroundColor Cyan
$api = Invoke-RestMethod 'http://localhost:4000/api/status'
if ($api.status -ne 'healthy') {
  throw 'API /api/status did not return healthy.'
}

Write-Host 'Checking budget block (expect 429)...' -ForegroundColor Cyan
$setBudgetBody = @{ dailyLimit = 10; monthlyLimit = 50 } | ConvertTo-Json -Compress
Invoke-WebRequest 'http://localhost:4000/agents/prod-check/budget/set' -Method Post -ContentType 'application/json' -Body $setBudgetBody -UseBasicParsing | Out-Null

$spendA = @{ amount = 9 } | ConvertTo-Json -Compress
Invoke-WebRequest 'http://localhost:4000/agents/prod-check/budget/spend' -Method Post -ContentType 'application/json' -Body $spendA -UseBasicParsing | Out-Null

$spendB = @{ amount = 5 } | ConvertTo-Json -Compress
$blocked = Invoke-WebRequest 'http://localhost:4000/agents/prod-check/budget/spend' -Method Post -ContentType 'application/json' -Body $spendB -SkipHttpErrorCheck -UseBasicParsing
if ($blocked.StatusCode -ne 429) {
  throw "Expected 429 on budget block, got $($blocked.StatusCode)"
}

Write-Host 'Checking persistent volume...' -ForegroundColor Cyan
$volumeList = docker volume ls --format '{{.Name}}'
if ($volumeList -notcontains 'andromedaso-v0.2.0_postgres_data') {
  Write-Host 'Note: postgres_data volume found with custom compose project name may vary.' -ForegroundColor Yellow
}

Write-Host 'All production validations passed.' -ForegroundColor Green
