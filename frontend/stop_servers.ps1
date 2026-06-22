# PowerShell script to stop the Day 6 mock‑interview servers (backend on port 5000, frontend on port 3000)
Write-Host "Stopping backend (port 5000) and frontend (port 3000)..."

function Get-PidByPort([int]$port) {
  try {
    $pid = (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop).
            OwningProcess
    return $pid
  } catch {
    return $null
  }
}

$ports = @(5000, 3000)
foreach ($port in $ports) {
  $pid = Get-PidByPort $port
  if ($pid) {
    Write-Host "Killing process $pid on port $port"
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
  } else {
    Write-Host "No process listening on port $port"
  }
}

Write-Host "All servers stopped."
