# ============================================================
# EAV - Teste local (roda numa maquina de teste do dominio).
# Faz o mesmo que o GPO faria no boot, mas na mao:
#   1. Auto-eleva pra Administrador
#   2. Roda o eav-setup.ps1 do share (setup completo)
#   3. Roda o agent-sync.ps1 uma vez (envia dados pro portal)
#   4. Mostra os dois logs no final
#
# USO: clique-direito > "Executar com o PowerShell", ou:
#   powershell -ExecutionPolicy Bypass -File .\eav-test-local.ps1
#
# Requisitos: estar logado como Domain Admin (pra ler o share EAV$).
# ============================================================

param(
    [string]$SharePath = '\\SRV-DC-01\EAV$',
    [string]$ServerIP  = 'tech.escolaamericana.com.br'
)

# --- 1. Auto-elevar pra Administrador ---
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host 'Elevando para Administrador...' -ForegroundColor Yellow
    $argList = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -SharePath `"$SharePath`" -ServerIP `"$ServerIP`""
    Start-Process powershell.exe -Verb RunAs -ArgumentList $argList
    exit
}

$ErrorActionPreference = 'Continue'
Write-Host "===== EAV teste local =====" -ForegroundColor Cyan
Write-Host "Share:  $SharePath"
Write-Host "Portal: $ServerIP`n"

# --- 2. Checar acesso ao share ---
$setup = Join-Path $SharePath 'eav-setup.ps1'
if (-not (Test-Path $setup)) {
    Write-Host "ERRO: nao consegui ler $setup" -ForegroundColor Red
    Write-Host "Confirme que voce esta logado como Domain Admin e que a maquina esta no dominio." -ForegroundColor Red
    Read-Host "`nEnter para sair"
    exit 1
}

# --- 3. Rodar o setup completo (token, tarefa, RDP, RustDesk) ---
Write-Host "`n--- Rodando eav-setup.ps1 ---`n" -ForegroundColor Cyan
& $setup -SharePath $SharePath

# --- 4. Rodar o agente uma vez (envia dados pro portal) ---
$agent = 'C:\EAV_Agente\agent-sync.ps1'
if (Test-Path $agent) {
    Write-Host "`n--- Rodando agent-sync.ps1 (envio pro portal) ---`n" -ForegroundColor Cyan
    & $agent -ServerIP $ServerIP -Automated
} else {
    Write-Host "`nAVISO: $agent nao encontrado (o setup deveria ter copiado)." -ForegroundColor Yellow
}

# --- 5. Mostrar os logs ---
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host " LOG DO SETUP (C:\EAV_Agente\setup.log)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
if (Test-Path 'C:\EAV_Agente\setup.log') { Get-Content 'C:\EAV_Agente\setup.log' -Tail 30 } else { Write-Host '(sem setup.log)' -ForegroundColor Yellow }

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host " LOG DO AGENTE (C:\EAV_Agente\agent.log)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
if (Test-Path 'C:\EAV_Agente\agent.log') { Get-Content 'C:\EAV_Agente\agent.log' -Tail 20 } else { Write-Host '(sem agent.log)' -ForegroundColor Yellow }

Write-Host "`nPronto. Confira no portal se o device apareceu (RAM, IP, RustDesk ID)." -ForegroundColor Green
Read-Host "`nEnter para fechar"
