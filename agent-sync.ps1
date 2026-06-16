# Script de Protótipo do Agente RMM para o EAVTEST
# Este script coleta informações do computador local e envia para o painel web.

$serverUrl = "http://10.5.0.12:3001/api/agent/sync"
# Opcional: Para testar na rede, comente a linha acima e use o IP:
# $serverUrl = "http://10.5.0.12:3001/api/agent/sync"

# ==========================================
# 0. Habilitar Acesso Remoto (RDP) Automaticamente
# ==========================================
try {
    Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -name "fDenyTSConnections" -value 0 -ErrorAction SilentlyContinue
    Enable-NetFirewallRule -DisplayGroup "Área de Trabalho Remota" -ErrorAction SilentlyContinue
    Enable-NetFirewallRule -DisplayGroup "Remote Desktop" -ErrorAction SilentlyContinue
} catch {}

Write-Host "Iniciando Coleta de Dados do Computador..." -ForegroundColor Cyan

# 1. Hostname e OS
$osInfo = Get-CimInstance Win32_OperatingSystem
$hostname = $osInfo.CSName
$osName = $osInfo.Caption
$username = (Get-WmiObject -Class Win32_ComputerSystem).UserName

# 2. Processador
$cpuInfo = Get-CimInstance Win32_Processor | Select-Object -First 1
$cpuName = $cpuInfo.Name

# 3. Memória RAM
$ramInfo = Get-CimInstance Win32_ComputerSystem
$ramGB = [math]::Round($ramInfo.TotalPhysicalMemory / 1GB, 2)

# 4. Disco Rígido (Pegar o disco C:)
$diskInfo = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
$diskTotalGB = [math]::Round($diskInfo.Size / 1GB, 2)
$diskFreeGB = [math]::Round($diskInfo.FreeSpace / 1GB, 2)

# 5. Placa Mãe e Sistema (Modelo e Fabricante)
$csInfo = Get-CimInstance Win32_ComputerSystem
$biosInfo = Get-CimInstance Win32_BIOS
$serialNumber = $biosInfo.SerialNumber
$model = $csInfo.Model
$manufacturer = $csInfo.Manufacturer

# 6. Endereço MAC (Pegar do primeiro adaptador ativo)
$macInfo = Get-CimInstance Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled -eq $true } | Select-Object -First 1
$macAddress = $macInfo.MACAddress

# 7. Endereço IP (Pega do adaptador que possui um Gateway Padrão IPv4 - Internet)
$ipAddress = (Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null } | Select-Object -First 1).IPv4Address.IPAddress
if (-not $ipAddress) { $ipAddress = "Desconhecido" }

# 8. Tempo Ligado (Uptime)
$osInfo2 = Get-CimInstance Win32_OperatingSystem
$lastBoot = $osInfo2.LastBootUpTime
$uptimeDays = [math]::Round((Get-Date).Subtract($lastBoot).TotalDays, 1)

# 9. Rede Wi-Fi (SSID)
$wifiSSID = "N/A"
$wifiOutput = netsh wlan show interfaces | Select-String "\bSSID\b" | Select-Object -First 1
if ($wifiOutput) {
    $parts = $wifiOutput.ToString() -split ":"
    if ($parts.Count -ge 2) {
        $wifiSSID = $parts[1].Trim()
    }
}

# 10. Bateria (Desgaste e Status)
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
    # Fallback para Win32_Battery caso o driver ACPI não forneça dados WMI
    $win32Bat = Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue
    if ($win32Bat) {
        $statusMap = @{1="Descarregando"; 2="Conectado à Tomada"; 3="Carregado"; 4="Baixa"; 5="Crítica"; 6="Carregando"}
        $batStatus = if ($statusMap.ContainsKey([int]$win32Bat.BatteryStatus)) { $statusMap[[int]$win32Bat.BatteryStatus] } else { "Ativa" }
        $batteryInfoStr = "Saudável: $($win32Bat.EstimatedChargeRemaining)% ($batStatus)"
    }
}

# 11. Monitores Conectados
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

# Preparar o JSON para envio
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
}

$jsonPayload = $payload | ConvertTo-Json

Write-Host "Dados Coletados com Sucesso!" -ForegroundColor Green
Write-Host "Enviando para o Servidor: $serverUrl ..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $serverUrl -Method Post -Body $jsonPayload -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "Sincronização concluída com sucesso!" -ForegroundColor Green
        Write-Host "Ação realizada no servidor: $($response.action)" -ForegroundColor Cyan
        Write-Host "Dispositivo ID: $($response.device.tag)" -ForegroundColor Cyan
    } else {
        Write-Host "Servidor retornou sucesso falso: $($response)" -ForegroundColor Red
    }
} catch {
    Write-Host "Erro ao enviar dados para o servidor. Verifique se o backend está rodando no endereço correto." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`nPressione qualquer tecla para fechar..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
