$ports = 3000, 3001, 3002, 3003
foreach ($p in $ports) {
  $items = Get-NetTCPConnection -State Listen -LocalPort $p -ErrorAction SilentlyContinue
  foreach ($it in $items) {
    Stop-Process -Id $it.OwningProcess -Force -ErrorAction SilentlyContinue
  }
}

Write-Host "Portas 3000-3003 liberadas."
