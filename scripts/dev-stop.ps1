$ports = @(4000, 4001, 4010, 4020, 4030, 5173, 5174, 5175, 5176, 5177, 5178, 5179)
$killed = @{}
$allowedProcessNames = @('node', 'node.exe')

foreach ($port in $ports) {
  $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if (-not $connections) {
    continue
  }

  foreach ($conn in $connections) {
    $owningPid = $conn.OwningProcess
    if ($killed.ContainsKey($owningPid)) {
      continue
    }

    try {
      $process = Get-Process -Id $owningPid -ErrorAction Stop
      if (-not ($allowedProcessNames -contains $process.ProcessName.ToLower())) {
        Write-Output "Skipping PID ${owningPid} ($($process.ProcessName)) on port $port"
        continue
      }
      Stop-Process -Id $owningPid -Force -ErrorAction Stop
      $killed[$owningPid] = $true
      Write-Output "Stopped PID ${owningPid} ($($process.ProcessName)) on port $port"
    }
    catch {
      Write-Output "Failed to stop PID ${owningPid} on port ${port}: $($_.Exception.Message)"
    }
  }
}

if ($killed.Count -eq 0) {
  Write-Output "No dev processes were using target ports."
}
