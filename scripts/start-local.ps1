$ports = 3000
foreach ($p in $ports) {
  $items = Get-NetTCPConnection -State Listen -LocalPort $p -ErrorAction SilentlyContinue
  foreach ($it in $items) {
    Stop-Process -Id $it.OwningProcess -Force -ErrorAction SilentlyContinue
  }
}

Set-Location "$PSScriptRoot\.."
npm run dev:local
