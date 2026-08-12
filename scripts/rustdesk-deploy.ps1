param(
    # Caminho do instalador do RustDesk (ex: no share \\dominio\EAV$\rustdesk.exe
    # ou copiado localmente). Baixe o .exe estavel do rustdesk.com e coloque no share.
    [Parameter(Mandatory = $true)][string]$InstallerPath,
    # Senha de acesso nao-supervisionado (permanente). NAO deixar hardcoded aqui:
    # passar via parametro no GPO/startup, e restringir o share a "Domain Computers".
    [Parameter(Mandatory = $true)][string]$Password
)

# ============================================================
# Deploy idempotente do RustDesk com acesso nao-supervisionado.
# Pensado pra rodar como SYSTEM via GPO (Computer Startup Script).
# Seguro rodar a cada boot: so instala se faltar, so seta a senha se preciso.
# Log em C:\EAV_Agente\rustdesk-deploy.log
# ============================================================

$ErrorActionPreference = 'Stop'
$LogFile = 'C:\EAV_Agente\rustdesk-deploy.log'
function Log($m) {
    try {
        $d = Split-Path $LogFile
        if (-not (Test-Path $d)) { New-Item -ItemType Directory -Force -Path $d | Out-Null }
        Add-Content -Path $LogFile -Value ("[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m)
    } catch {}
}

Log 'Inicio do deploy do RustDesk.'

# Localiza o rustdesk.exe instalado (64 ou 32 bits).
function Get-RustDeskExe {
    foreach ($p in @('C:\Program Files\RustDesk\rustdesk.exe', 'C:\Program Files (x86)\RustDesk\rustdesk.exe')) {
        if (Test-Path $p) { return $p }
    }
    return $null
}

try {
    $exe = Get-RustDeskExe

    # 1. Instala silenciosamente se ainda nao existe.
    if (-not $exe) {
        if (-not (Test-Path $InstallerPath)) {
            Log "ERRO: instalador nao encontrado em $InstallerPath. Abortando."
            exit 1
        }
        Log "RustDesk nao instalado. Instalando de $InstallerPath ..."
        # --silent-install instala como servico (acesso nao-supervisionado).
        Start-Process -FilePath $InstallerPath -ArgumentList '--silent-install' -Wait
        Start-Sleep -Seconds 15
        $exe = Get-RustDeskExe
        if (-not $exe) {
            Log 'ERRO: instalacao concluiu mas rustdesk.exe nao foi encontrado.'
            exit 1
        }
        Log "Instalado em $exe"
    } else {
        Log "RustDesk ja instalado em $exe"
    }

    # 2. Garante o servico rodando (necessario pra ter ID e aceitar conexao).
    $svc = Get-Service -Name 'RustDesk' -ErrorAction SilentlyContinue
    if ($svc -and $svc.Status -ne 'Running') {
        Log 'Servico RustDesk parado. Iniciando...'
        Start-Service -Name 'RustDesk' -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 8
    }

    # 3. Define a senha permanente (acesso nao-supervisionado).
    #    Idempotente: setar de novo com a mesma senha nao causa problema.
    Log 'Definindo senha de acesso nao-supervisionado...'
    & $exe --password $Password
    Start-Sleep -Seconds 3

    # 4. Loga o ID pra conferencia (o agent-sync.ps1 tambem coleta e manda pro portal).
    try {
        $id = (& $exe --get-id 2>&1 | Out-String).Trim()
        Log "RustDesk ID desta maquina: $id"
    } catch {
        Log "Nao foi possivel obter o ID agora: $($_.Exception.Message)"
    }

    Log 'Deploy do RustDesk concluido com sucesso.'
    exit 0
} catch {
    Log "ERRO no deploy: $($_.Exception.Message)"
    exit 1
}
