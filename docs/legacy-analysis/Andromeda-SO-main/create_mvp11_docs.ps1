
with open('/root/MVP11-PRD.md', 'r') as f:
    prd = f.read()
with open('/root/Implementation-Plan-MVP11.md', 'r') as f:
    impl = f.read()
with open('/root/EDD-MVP11-Planner.md', 'r') as f:
    edd = f.read()
with open('/root/mvp11-execution-plan.feature', 'r') as f:
    feat1 = f.read()
with open('/root/mvp11-agent-handoff.feature', 'r') as f:
    feat2 = f.read()

def to_ps_heredoc(varname, content):
    # Escapar apenas o que PowerShell here-string @'...'@ não suporta
    # @'...'@ (single-quote) não expande nada — mais seguro
    # Único problema: sequência '@ no meio do conteúdo
    safe = content.replace("'@", "' @")  # quebra qualquer '@ acidental
    return f"${varname} = @'\n{safe}\n'@\n"

lines = ["# MVP11 Docs Generator — PowerShell puro"]
lines += ["# Execute em C:\\FB\\Andromeda-SO:  .\\create_mvp11_docs.ps1", ""]
lines += ["$ErrorActionPreference = 'Stop'", ""]
lines += ["# Criar pastas"]
lines += ["New-Item -ItemType Directory -Force -Path 'doc\\active\\evals' | Out-Null", ""]

lines += [to_ps_heredoc("prd", prd)]
lines += [to_ps_heredoc("impl", impl)]
lines += [to_ps_heredoc("edd", edd)]
lines += [to_ps_heredoc("feat1", feat1)]
lines += [to_ps_heredoc("feat2", feat2)]

lines += [
    "# Escrever arquivos",
    "$prd  | Out-File -FilePath 'doc\\active\\MVP11-PRD.md'                          -Encoding utf8",
    "$impl | Out-File -FilePath 'doc\\active\\Implementation-Plan-MVP11.md'          -Encoding utf8",
    "$edd  | Out-File -FilePath 'doc\\active\\EDD-MVP11-Planner.md'                  -Encoding utf8",
    "$feat1| Out-File -FilePath 'doc\\active\\evals\\mvp11-execution-plan.feature'   -Encoding utf8",
    "$feat2| Out-File -FilePath 'doc\\active\\evals\\mvp11-agent-handoff.feature'    -Encoding utf8",
    "",
    "Write-Host '✓ MVP11 docs criados com sucesso!' -ForegroundColor Green",
    "Write-Host ''",
    "Write-Host '  doc\\active\\MVP11-PRD.md'",
    "Write-Host '  doc\\active\\Implementation-Plan-MVP11.md'",
    "Write-Host '  doc\\active\\EDD-MVP11-Planner.md'",
    "Write-Host '  doc\\active\\evals\\mvp11-execution-plan.feature'",
    "Write-Host '  doc\\active\\evals\\mvp11-agent-handoff.feature'",
]

ps1 = "\n".join(lines)

with open('/root/output/create_mvp11_docs.ps1', 'w', encoding='utf-8') as f:
    f.write(ps1)

import os
print(f"PS1 gerado: {os.path.getsize('/root/output/create_mvp11_docs.ps1'):,} bytes")
print(f"Linhas: {ps1.count(chr(10))}")