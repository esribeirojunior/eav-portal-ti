# Roda UMA vez no servidor de arquivos (como Admin do dominio).
# Cria o share EAV$ restrito a Domain Computers (pra a senha do RustDesk e o
# token nao ficarem legiveis por usuarios comuns). Depois voce copia os
# arquivos (agent-sync.ps1, eav-setup.ps1, rustdesk.exe, eav-config.psd1).

param(
    [string]$Path = 'C:\Shares\EAV',
    [string]$ShareName = 'EAV$'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $Path)) { New-Item -ItemType Directory -Force -Path $Path | Out-Null }
Write-Host "Pasta: $Path" -ForegroundColor Green

# Share de rede (leitura pra Domain Computers e Domain Admins).
if (Get-SmbShare -Name $ShareName -ErrorAction SilentlyContinue) {
    Write-Host "Share $ShareName ja existe." -ForegroundColor Yellow
} else {
    New-SmbShare -Name $ShareName -Path $Path -ReadAccess 'Domain Computers' -FullAccess 'Domain Admins' | Out-Null
    Write-Host "Share \\$env:COMPUTERNAME\$ShareName criado." -ForegroundColor Green
}

# NTFS: remove heranca e restringe. SYSTEM e Domain Admins full; Domain Computers leitura.
icacls $Path /inheritance:r | Out-Null
icacls $Path /grant:r "SYSTEM:(OI)(CI)F" | Out-Null
icacls $Path /grant:r "$env:USERDOMAIN\Domain Admins:(OI)(CI)F" | Out-Null
icacls $Path /grant:r "$env:USERDOMAIN\Domain Computers:(OI)(CI)RX" | Out-Null
Write-Host "Permissoes NTFS aplicadas (Domain Computers = leitura)." -ForegroundColor Green

Write-Host "`nAgora copie para $Path :" -ForegroundColor Cyan
Write-Host "  - agent-sync.ps1"
Write-Host "  - eav-setup.ps1"
Write-Host "  - rustdesk.exe (baixe o estavel de https://rustdesk.com/)"
Write-Host "  - eav-config.psd1 (com Token, ServerIP e RustDeskPassword)"
