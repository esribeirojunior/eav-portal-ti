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
$rdHost   = $cfg.RustDeskHost
$rdKey    = $cfg.RustDeskKey
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
                # NAO usar -Wait: o --silent-install bifurca o processo e o -Wait trava pra sempre.
                # Em vez disso, dispara e espera o servico/exe aparecer (ate ~90s).
                Start-Process -FilePath $installer -ArgumentList '--silent-install' -WindowStyle Hidden
                for ($i = 0; $i -lt 45; $i++) {
                    Start-Sleep -Seconds 2
                    if (Get-Service -Name 'RustDesk' -ErrorAction SilentlyContinue) { break }
                    if (Get-RD) { break }
                }
                Start-Sleep -Seconds 3
                $rd = Get-RD
                if ($rd) { Log 'RustDesk instalado.' } else { Log 'AVISO: RustDesk nao confirmado apos instalacao.' }
            } else { Log "AVISO: rustdesk.exe nao esta no share; pulando instalacao." }
        }
        if ($rd) {
            $svc = Get-Service -Name 'RustDesk' -ErrorAction SilentlyContinue
            if ($svc -and $svc.Status -ne 'Running') { Start-Service 'RustDesk' -ErrorAction SilentlyContinue; Start-Sleep -Seconds 8 }

            # Senha nao-supervisionada (grava a senha no config do servico)
            & $rd --password $rdPass
            Start-Sleep -Seconds 2

            # Apontar pro servidor RustDesk self-hosted (fecha o acesso; nao usa o servidor publico).
            # Grava no config do SERVICO (LocalService/systemprofile), que e o que vale pro nao-supervisionado.
            if ($rdHost -and $rdKey) {
                try {
                    if ($svc) { Stop-Service 'RustDesk' -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 3 }
                    $cfgDirs = @(
                        'C:\Windows\ServiceProfiles\LocalService\AppData\Roaming\RustDesk\config',
                        'C:\Windows\System32\config\systemprofile\AppData\Roaming\RustDesk\config'
                    )
                    foreach ($cd in $cfgDirs) {
                        if (-not (Test-Path $cd)) { New-Item -ItemType Directory -Force -Path $cd | Out-Null }
                        $toml = Join-Path $cd 'RustDesk2.toml'
                        $existing = @()
                        if (Test-Path $toml) { $existing = Get-Content $toml }
                        # Remove as chaves que vamos redefinir (preserva o resto, inclusive a senha)
                        $filtered = $existing | Where-Object {
                            $_ -notmatch '^\s*rendezvous_server\s*=' -and
                            $_ -notmatch '^\s*custom-rendezvous-server\s*=' -and
                            $_ -notmatch '^\s*relay-server\s*=' -and
                            $_ -notmatch '^\s*key\s*='
                        }
                        # Separa o topo da secao [options]
                        $top = New-Object System.Collections.ArrayList
                        $opt = New-Object System.Collections.ArrayList
                        $inOpt = $false
                        foreach ($l in $filtered) {
                            if ($l -match '^\[options\]') { $inOpt = $true; continue }
                            elseif ($l -match '^\[') { $inOpt = $false; [void]$top.Add($l); continue }
                            if ($inOpt) { [void]$opt.Add($l) } else { [void]$top.Add($l) }
                        }
                        $new = New-Object System.Collections.ArrayList
                        [void]$new.Add("rendezvous_server = '$rdHost`:21116'")
                        foreach ($l in $top) { if ($l.Trim() -ne '') { [void]$new.Add($l) } }
                        [void]$new.Add('')
                        [void]$new.Add('[options]')
                        [void]$new.Add("custom-rendezvous-server = '$rdHost'")
                        [void]$new.Add("relay-server = '$rdHost'")
                        [void]$new.Add("key = '$rdKey'")
                        foreach ($l in $opt) { if ($l.Trim() -ne '') { [void]$new.Add($l) } }
                        Set-Content -Path $toml -Value $new -Encoding UTF8
                    }
                    Start-Service 'RustDesk' -ErrorAction SilentlyContinue
                    Start-Sleep -Seconds 5
                    Log "RustDesk apontado pro servidor self-hosted ($rdHost)."
                } catch { Log "ERRO ao apontar RustDesk pro servidor: $($_.Exception.Message)" }
            } else {
                Log 'AVISO: RustDeskHost/RustDeskKey nao definidos; cliente ficaria no servidor PUBLICO.'
            }

            # Pega o ID (app grafico: precisa redirecionar a saida pra arquivo)
            try {
                $tmpOut = Join-Path $env:TEMP 'rdid_setup.txt'
                Start-Process -FilePath $rd -ArgumentList '--get-id' -RedirectStandardOutput $tmpOut -NoNewWindow -Wait
                Start-Sleep -Milliseconds 500
                $rid = ''
                if (Test-Path $tmpOut) { $rid = ((Get-Content $tmpOut -Raw) -replace '\D', '').Trim(); Remove-Item $tmpOut -Force -ErrorAction SilentlyContinue }
                Log "RustDesk OK. ID=$rid"
            } catch { Log 'RustDesk configurado (ID nao lido agora).' }
        }
    } catch { Log "ERRO no RustDesk: $($_.Exception.Message)" }
} else {
    Log 'RustDeskPassword nao definida na config; pulando RustDesk.'
}

Log '===== EAV setup concluido ====='
exit 0
