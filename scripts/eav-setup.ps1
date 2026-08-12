param(
    # Caminho do share da TI com os arquivos (eav-config.psd1, agent-sync.ps1,
    # rustdesk.exe). Ex: \\SEU-SERVIDOR\EAV$
    [Parameter(Mandatory = $true)][string]$SharePath
)

# ============================================================
# EAV — Setup all-in-one da maquina (roda como SYSTEM via GPO startup).
# Faz TUDO de uma vez, idempotente (seguro a cada boot):
#   1. Le segredos do eav-config.psd1 (no share restrito a Domain Computers)
#   2. Define EAV_AGENT_TOKEN (env var de maquina)
#   3. Copia agent-sync.ps1 pra C:\EAV_Agente e agenda a tarefa (4h)
#   4. Habilita RDP + Ping no firewall
#   5. Instala e configura o RustDesk (acesso nao-supervisionado)
# Log unico em C:\EAV_Agente\setup.log
# ============================================================

$ErrorActionPreference = 'Continue'
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

$InstallDir = 'C:\EAV_Agente'
$LogFile = Join-Path $InstallDir 'setup.log'
function Log($m) {
    try {
        if (-not (Test-Path $InstallDir)) { New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null }
        Add-Content -Path $LogFile -Value ("[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m)
    } catch {}
    Write-Host $m
}

Log "===== EAV setup iniciado (share=$SharePath) ====="

# --- 1. Ler config (segredos) do share ---
$configPath = Join-Path $SharePath 'eav-config.psd1'
if (-not (Test-Path $configPath)) { Log "ERRO: eav-config.psd1 nao encontrado em $configPath. Abortando."; exit 1 }
try {
    $cfg = Import-PowerShellDataFile -Path $configPath
} catch {
    Log "ERRO ao ler eav-config.psd1: $($_.Exception.Message)"; exit 1
}
$token    = $cfg.Token
$serverIp = $cfg.ServerIP
$rdPass   = $cfg.RustDeskPassword
if (-not $token -or -not $serverIp) { Log 'ERRO: config sem Token ou ServerIP.'; exit 1 }

# --- 2. Env var de maquina ---
try {
    [Environment]::SetEnvironmentVariable('EAV_AGENT_TOKEN', $token, 'Machine')
    $env:EAV_AGENT_TOKEN = $token
    Log 'EAV_AGENT_TOKEN definida (Machine).'
} catch { Log "ERRO ao definir env var: $($_.Exception.Message)" }

# --- 3. Copiar agente + agendar tarefa ---
try {
    if (-not (Test-Path $InstallDir)) { New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null }
    $srcAgent = Join-Path $SharePath 'agent-sync.ps1'
    $dstAgent = Join-Path $InstallDir 'agent-sync.ps1'
    if (Test-Path $srcAgent) {
        Copy-Item -Path $srcAgent -Destination $dstAgent -Force
        Log 'agent-sync.ps1 copiado.'
    } elseif (-not (Test-Path $dstAgent)) {
        Log "AVISO: agent-sync.ps1 nao esta no share nem local."
    }

    $args = "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$dstAgent`" -ServerIP `"$serverIp`" -Automated"
    $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $args
    $tLogon = New-ScheduledTaskTrigger -AtStartup
    $tRepeat = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) -RepetitionInterval (New-TimeSpan -Hours 4)
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable
    Register-ScheduledTask -TaskName 'EAV-Sincronizacao' -Action $action -Trigger @($tLogon, $tRepeat) -Settings $settings -User 'SYSTEM' -RunLevel Highest -Force -ErrorAction Stop | Out-Null
    Log 'Tarefa EAV-Sincronizacao registrada (SYSTEM, a cada 4h).'
} catch { Log "ERRO ao agendar tarefa: $($_.Exception.Message)" }

# --- 4. RDP + Ping no firewall ---
try {
    Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -Name 'fDenyTSConnections' -Value 0 -ErrorAction SilentlyContinue
    Enable-NetFirewallRule -DisplayGroup 'Área de Trabalho Remota' -ErrorAction SilentlyContinue
    Enable-NetFirewallRule -DisplayGroup 'Remote Desktop' -ErrorAction SilentlyContinue
    netsh advfirewall firewall add rule name="Allow Ping (ICMPv4-In)" protocol=icmpv4:8,any dir=in action=allow | Out-Null
    Log 'RDP e Ping liberados no firewall.'
} catch { Log "ERRO ao configurar RDP/firewall: $($_.Exception.Message)" }

# --- 5. RustDesk (instala + senha nao-supervisionada) ---
if ($rdPass) {
    try {
        function Get-RD { foreach ($p in @('C:\Program Files\RustDesk\rustdesk.exe','C:\Program Files (x86)\RustDesk\rustdesk.exe')) { if (Test-Path $p) { return $p } } return $null }
        $rd = Get-RD
        if (-not $rd) {
            $installer = Join-Path $SharePath 'rustdesk.exe'
            if (Test-Path $installer) {
                Log 'Instalando RustDesk...'
                Start-Process -FilePath $installer -ArgumentList '--silent-install' -Wait
                Start-Sleep -Seconds 15
                $rd = Get-RD
            } else { Log "AVISO: rustdesk.exe nao esta no share; pulando instalacao." }
        }
        if ($rd) {
            $svc = Get-Service -Name 'RustDesk' -ErrorAction SilentlyContinue
            if ($svc -and $svc.Status -ne 'Running') { Start-Service 'RustDesk' -ErrorAction SilentlyContinue; Start-Sleep -Seconds 8 }
            & $rd --password $rdPass
            Start-Sleep -Seconds 2
            try { $rid = (& $rd --get-id 2>&1 | Out-String).Trim(); Log "RustDesk OK. ID=$rid" } catch { Log 'RustDesk configurado (ID nao lido agora).' }
        }
    } catch { Log "ERRO no RustDesk: $($_.Exception.Message)" }
} else {
    Log 'RustDeskPassword nao definida na config; pulando RustDesk.'
}

Log '===== EAV setup concluido ====='
exit 0
