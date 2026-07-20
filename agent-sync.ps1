param (
    [string]$ServerIP = "tech.escolaamericana.com.br",
    [switch]$Automated,
    [string]$SavedCampus = ""
)

# Base URL calculation to support both local IP:3000 and Coolify/sslip.io domains
$baseUrl = $ServerIP
if ($baseUrl -notlike "http://*" -and $baseUrl -notlike "https://*") {
    if ($baseUrl -match "^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$") {
        $baseUrl = "http://${baseUrl}:3000"
    } else {
        $baseUrl = "https://${baseUrl}"
    }
}

Clear-Host
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "       AGENTE EAV EQUIPAMENTOS                   " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Objetivo: sincronizar hardware/IP/RustDesk com o portal." -ForegroundColor Yellow
Write-Host "Acesso remoto e feito pelo painel via RustDesk (Suporte Externo)." -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

# ============================================================
# CONFIGURACAO ONE-TIME (so no modo interativo)
#   - Habilita RDP e Ping no Firewall
#   - Sem configuracao de TightVNC (migrado para RustDesk)
# ============================================================
if (-not $Automated) {
    Write-Host "`nHabilitando RDP e Ping no Firewall..." -ForegroundColor Yellow
    try {
        Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -name "fDenyTSConnections" -value 0 -ErrorAction SilentlyContinue
        Enable-NetFirewallRule -DisplayGroup "Área de Trabalho Remota" -ErrorAction SilentlyContinue
        Enable-NetFirewallRule -DisplayGroup "Remote Desktop" -ErrorAction SilentlyContinue

        New-NetFirewallRule -DisplayName "Permitir Ping EAV (ICMPv4-In)" -Protocol ICMPv4 -IcmpType 8 -Enabled True -Profile Any -Action Allow -ErrorAction SilentlyContinue | Out-Null
        Enable-NetFirewallRule -Name "CoreNet-Diag-ICMP4-EchoRequest-In" -ErrorAction SilentlyContinue | Out-Null

        netsh advfirewall firewall add rule name="Allow Ping (ICMPv4-In)" protocol=icmpv4:8,any dir=in action=allow | Out-Null
        Write-Host "RDP e Ping liberados no Firewall." -ForegroundColor Green
    } catch {
        Write-Host "[AVISO] Falha ao configurar Firewall/RDP: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# ============================================================
# COLETA DE DADOS DO COMPUTADOR
# ============================================================
Write-Host "`nColetando dados do computador para sincronizacao..." -ForegroundColor Cyan

$osInfo = Get-CimInstance Win32_OperatingSystem
$hostname = $osInfo.CSName
$osName = $osInfo.Caption
$username = (Get-WmiObject -Class Win32_ComputerSystem).UserName

$cpuInfo = Get-CimInstance Win32_Processor | Select-Object -First 1
$cpuName = $cpuInfo.Name

$ramInfo = Get-CimInstance Win32_ComputerSystem
$ramGB = [math]::Round($ramInfo.TotalPhysicalMemory / 1GB, 2)

$diskInfo = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
$diskTotalGB = [math]::Round($diskInfo.Size / 1GB, 2)
$diskFreeGB = [math]::Round($diskInfo.FreeSpace / 1GB, 2)

$csInfo = Get-CimInstance Win32_ComputerSystem
$biosInfo = Get-CimInstance Win32_BIOS
$serialNumber = $biosInfo.SerialNumber
$model = $csInfo.Model
$manufacturer = $csInfo.Manufacturer

$macInfo = Get-CimInstance Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled -eq $true } | Select-Object -First 1
$macAddress = $macInfo.MACAddress

$ipAddress = (Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null } | Select-Object -First 1).IPv4Address.IPAddress
if (-not $ipAddress) { $ipAddress = "Desconhecido" }

$lastBoot = $osInfo.LastBootUpTime
$uptimeDays = [math]::Round((Get-Date).Subtract($lastBoot).TotalDays, 1)

$wifiSSID = "N/A"
$wifiOutput = netsh wlan show interfaces | Select-String "\bSSID\b" | Select-Object -First 1
if ($wifiOutput) {
    $parts = $wifiOutput.ToString() -split ":"
    if ($parts.Count -ge 2) {
        $wifiSSID = $parts[1].Trim()
    }
}

$batteryInfoStr = "Não Possui/Desktop"
$batteryStatic = Get-CimInstance -Namespace "root\wmi" -ClassName "BatteryStaticData" -ErrorAction SilentlyContinue
$batteryFull = Get-CimInstance -Namespace "root\wmi" -ClassName "BatteryFullChargedCapacity" -ErrorAction SilentlyContinue
if ($batteryStatic -and $batteryFull) {
    $designCap = $batteryStatic.DesignedCapacity
    $fullCap = $batteryFull.FullChargedCapacity
    $wearPercent = 0
    if ($designCap -gt 0) {
        $wearPercent = [math]::Round((($designCap - $fullCap) / $designCap) * 100, 1)
        if ($wearPercent -lt 0) { $wearPercent = 0 }
    }
    $batteryInfoStr = "Desgaste: $wearPercent% "
    if ($wearPercent -gt 40) { $batteryInfoStr += "(Recomendada Troca)" } else { $batteryInfoStr += "(Saudável)" }
} else {
    $win32Bat = Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue
    if ($win32Bat) {
        $statusMap = @{1="Descarregando"; 2="Conectado à Tomada"; 3="Carregado"; 4="Baixa"; 5="Crítica"; 6="Carregando"}
        $batStatus = if ($statusMap.ContainsKey([int]$win32Bat.BatteryStatus)) { $statusMap[[int]$win32Bat.BatteryStatus] } else { "Ativa" }
        $batteryInfoStr = "Saudável: $($win32Bat.EstimatedChargeRemaining)% ($batStatus)"
    }
}

$monitorsStr = "Nenhum/Apenas Integrada"
$monitorsWmi = Get-CimInstance WmiMonitorID -Namespace root\wmi -ErrorAction SilentlyContinue
$monitorCount = 0
$monitorDetails = @()
if ($monitorsWmi) {
    $monitorsWmiArray = @($monitorsWmi)
    $monitorCount = $monitorsWmiArray.Count
    foreach ($m in $monitorsWmiArray) {
        $serialBytes = $m.SerialNumberID | Where-Object { $_ -ne 0 }
        $serial = if ($serialBytes) { [System.Text.Encoding]::ASCII.GetString($serialBytes).Trim() } else { "Desconhecido" }
        $modelBytes = $m.UserFriendlyName | Where-Object { $_ -ne 0 }
        $modelName = if ($modelBytes) { [System.Text.Encoding]::ASCII.GetString($modelBytes).Trim() } else { "Monitor" }
        if ($serial -eq "0" -or $serial -eq "") {
            $monitorDetails += "Tela Integrada (Notebook)"
        } else {
            $monitorDetails += "$modelName [SN:$serial]"
        }
    }
}
if ($monitorCount -gt 0) {
    $monitorsStr = "$monitorCount tela(s): " + ($monitorDetails -join ", ")
}

# ============================================
# IDENTIFICAÇÃO DE RUSTDESK (SUPORTE EXTERNO)
# ============================================
$rustdeskId = ""
$rdDirs = @(
    "C:\Windows\System32\config\systemprofile\AppData\Roaming\RustDesk\config",
    "C:\Windows\ServiceProfiles\LocalService\AppData\Roaming\RustDesk\config",
    "C:\ProgramData\RustDesk\config"
)

$usersPath = "C:\Users"
if (Test-Path $usersPath) {
    $userFolders = Get-ChildItem -Path $usersPath -Directory -ErrorAction SilentlyContinue
    foreach ($folder in $userFolders) {
        $rdDirs += Join-Path $folder.FullName "AppData\Roaming\RustDesk\config"
    }
}

foreach ($dir in $rdDirs) {
    $files = @("RustDesk.toml", "RustDesk2.toml")
    foreach ($file in $files) {
        $rdFile = Join-Path $dir $file
        if (Test-Path $rdFile) {
            $rdContent = Get-Content $rdFile -ErrorAction SilentlyContinue
            $idMatch = $rdContent | Select-String -Pattern "(?im)^id\s*=\s*['""]?([^'""\s]+)['""]?"
            if ($idMatch) {
                $rustdeskId = $idMatch.Matches[0].Groups[1].Value
                Write-Host "RustDesk ID detectado: $rustdeskId" -ForegroundColor Green
                break
            }
        }
    }
    if ($rustdeskId) { break }
}

# Fallback: tentar rodar o rustdesk.exe diretamente para pegar o ID
if (-not $rustdeskId) {
    $rdInstallDirs = @(
        "C:\Program Files\RustDesk",
        "C:\Program Files (x86)\RustDesk"
    )
    foreach ($dir in $rdInstallDirs) {
        if (Test-Path $dir) {
            $exes = Get-ChildItem -Path $dir -Filter "rustdesk*.exe" -File -ErrorAction SilentlyContinue
            foreach ($exe in $exes) {
                try {
                    $outputId = & $exe.FullName --get-id 2>&1
                    if ($outputId -match "^[0-9]+$") {
                        $rustdeskId = $outputId.Trim()
                        Write-Host "RustDesk ID detectado via executável ($($exe.Name)): $rustdeskId" -ForegroundColor Green
                        break
                    }
                } catch {}
            }
            if ($rustdeskId) { break }
        }
    }
}

if (-not $rustdeskId) {
    Write-Host "Nenhum RustDesk ID foi detectado localmente." -ForegroundColor Yellow
}

# ============================================
# IDENTIFICAÇÃO DE CAMPUS BASEADA NA REDE (IP/SSID)
# ============================================
$detectedCampus = "Álvares"
if ($ipAddress -like "10.10.156.*") {
    $detectedCampus = "Álvares"
    Write-Host "Rede detectada automaticamente como Campus Álvares (IP: $ipAddress)" -ForegroundColor Green
} elseif ($ipAddress -like "10.5.*" -or $ipAddress -like "10.10.157.*") {
    $detectedCampus = "Aeroporto"
    Write-Host "Rede detectada automaticamente como Campus Aeroporto (IP: $ipAddress)" -ForegroundColor Green
} else {
    if ($Automated -and $SavedCampus) {
        $detectedCampus = $SavedCampus
    } else {
        Write-Host "Rede atual nao mapeada automaticamente para nenhum Campus (IP: $ipAddress)." -ForegroundColor Yellow
        Write-Host "Selecione o Campus correspondente:" -ForegroundColor Yellow
        Write-Host "[1] Álvares"
        Write-Host "[2] Aeroporto"
        $campOp = ""
        while ($campOp -ne "1" -and $campOp -ne "2") {
            $campOp = Read-Host "Selecione a opcao (1 ou 2)"
        }
        if ($campOp -eq "2") {
            $detectedCampus = "Aeroporto"
        } else {
            $detectedCampus = "Álvares"
        }
    }
}

# ============================================
# ENVIO DO PAYLOAD PARA O SERVIDOR
# ============================================
$payload = @{
    hostname = $hostname
    username = $username
    os = $osName
    cpu = $cpuName
    ram_gb = $ramGB
    disk_total_gb = $diskTotalGB
    disk_free_gb = $diskFreeGB
    serial_number = $serialNumber
    model = $model
    manufacturer = $manufacturer
    mac_address = $macAddress
    ip_address = $ipAddress
    uptime_days = $uptimeDays
    wifi_ssid = $wifiSSID
    battery_health = $batteryInfoStr
    monitors = $monitorsStr
    campus = $detectedCampus
    rustdesk_id = $rustdeskId
}

$serverUrl = "${baseUrl}/api/agent/sync"
$jsonPayload = $payload | ConvertTo-Json
Write-Host "Enviando dados para o servidor: $serverUrl ..." -ForegroundColor Yellow

# Token do agente lido da variavel de ambiente da maquina (EAV_AGENT_TOKEN).
# Definir uma vez, como Admin: [Environment]::SetEnvironmentVariable('EAV_AGENT_TOKEN','<token>','Machine')
$agentToken = $env:EAV_AGENT_TOKEN
if (-not $agentToken) {
    Write-Host "[ERRO] Variavel de ambiente EAV_AGENT_TOKEN nao definida. Solicite ao administrador." -ForegroundColor Red
    if (-not $Automated) {
        Start-Sleep -Seconds 10
    }
    exit 1
}

try {
    $headers = @{
        "Bypass-Tunnel-Reminder" = "true"
        "Authorization" = "Bearer $agentToken"
    }
    $response = Invoke-RestMethod -Uri $serverUrl -Method Post -Body $jsonPayload -ContentType "application/json" -Headers $headers
    if ($response.success) {
        Write-Host "Sincronizacao concluida com sucesso!" -ForegroundColor Green
        Write-Host "Acao no servidor: $($response.action)" -ForegroundColor Cyan
        Write-Host "Dispositivo ID/Tag: $($response.device.tag)" -ForegroundColor Cyan
    } else {
        Write-Host "Servidor retornou sucesso falso: $response" -ForegroundColor Red
    }
} catch {
    Write-Host "Erro ao enviar dados. Verifique a conexao com o servidor." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# ============================================
# REGISTRO DO SCHEDULED TASK (so no modo interativo)
# ============================================
if (-not $Automated) {
    Write-Host "`nConfigurando execucao em segundo plano (Scheduled Task)..." -ForegroundColor Yellow
    if ([string]::IsNullOrEmpty($PSCommandPath)) {
        Write-Host "Aviso: script executado colando o codigo no console. Salve o .ps1 em disco e rode novamente para agendar o servico em segundo plano." -ForegroundColor Red
    } else {
        $installDir = "C:\EAV_Agente"
        if (-not (Test-Path $installDir)) {
            New-Item -ItemType Directory -Force -Path $installDir | Out-Null
        }
        $targetScript = Join-Path $installDir "agent-sync.ps1"
        Copy-Item -Path $PSCommandPath -Destination $targetScript -Force

        $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$targetScript`" -ServerIP `"$ServerIP`" -Automated -SavedCampus `"$detectedCampus`""

        $triggerLogon = New-ScheduledTaskTrigger -AtLogOn
        $triggerInterval = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Hours 4)

        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

        try {
            Register-ScheduledTask -TaskName "EAV-Sincronizacao" -Action $action -Trigger @($triggerLogon, $triggerInterval) -Settings $settings -User "SYSTEM" -RunLevel Highest -Force -ErrorAction Stop | Out-Null
            Write-Host "Servico em segundo plano criado com sucesso via PowerShell!" -ForegroundColor Green
        } catch {
            Write-Host "Aviso: nao foi possivel usar o PowerShell para agendar. Usando SchTasks como plano B..." -ForegroundColor Yellow
            $cmd = "powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$targetScript`" -ServerIP `"$ServerIP`" -Automated -SavedCampus `"$detectedCampus`""
            schtasks /create /tn "EAV-Sincronizacao" /ru "SYSTEM" /sc HOURLY /mo 4 /tr "$cmd" /f | Out-Null
            Write-Host "Servico em segundo plano criado com sucesso via SchTasks! Atualizacao automatica a cada 4 horas." -ForegroundColor Green
        }
    }
}

if (-not $Automated) {
    Write-Host "`nA janela sera fechada em 5 segundos..."
    Start-Sleep -Seconds 5
}
