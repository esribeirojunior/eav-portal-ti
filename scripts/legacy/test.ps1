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
Write-Host "       AGENTE UNIVERSAL VNC - EAV EQUIPAMENTOS   " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Escolha o perfil para configurar esta maquina:" -ForegroundColor Yellow
Write-Host ""
Write-Host " [1] Maquina Mestre (TI / Analista)" -ForegroundColor White
Write-Host "     - Registra o protocolo vnc:// no Windows."
Write-Host "     - Permite abrir o TightVNC Viewer clicando no Painel Web."
Write-Host ""
Write-Host " [2] Maquina de Usuario (Cliente/Destino)" -ForegroundColor White
Write-Host "     - Configura a senha e seguranca do TightVNC Server local."
Write-Host "     - Habilita RDP e Ping no Firewall."
Write-Host "     - Coleta os dados de hardware e sincroniza com o Servidor."
Write-Host "================================================" -ForegroundColor Cyan

$opcao = ""
if ($Automated) {
    $opcao = "2"
} else {
    while ($opcao -ne "1" -and $opcao -ne "2") {
        $opcao = Read-Host "Selecione uma opcao (1 ou 2)"
    }
}

if ($opcao -eq "1") {
    # Perfil 1: Maquina Mestre
    Write-Host "`nConfigurando perfil: Maquina Mestre..." -ForegroundColor Cyan
    
    $vncViewerPath = "C:\Program Files\TightVNC\tvnviewer.exe"
    if (-not (Test-Path $vncViewerPath)) {
        $vncViewerPath = "C:\Program Files (x86)\TightVNC\tvnviewer.exe"
    }
    
    if (-not (Test-Path $vncViewerPath)) {
        Write-Host "[AVISO] tvnviewer.exe nao encontrado nos caminhos padrao." -ForegroundColor Yellow
        Write-Host "Instale a versao do TightVNC Viewer localmente." -ForegroundColor Yellow
        $vncViewerPath = "C:\Program Files\TightVNC\tvnviewer.exe"
    }

    $vncFolder = "C:\Program Files\TightVNC"
    if (-not (Test-Path $vncFolder)) {
        New-Item -ItemType Directory -Force -Path $vncFolder | Out-Null
    }

    # Criando o vnc-web-launcher.bat com remocao de aspas e tratamento correto do IP
    $launcherPath = Join-Path $vncFolder "vnc-web-launcher.bat"
    $launcherContent = @"
@echo off
set IP=%1
set IP=%IP:vnc://=%
set IP=%IP:/=%
set IP=%IP:"=%
echo =======================================
echo Iniciando TightVNC Viewer...
echo Conectando a: %IP%
echo =======================================
start "" "$vncViewerPath" %IP% -password=eav2017
"@
    Set-Content -Path $launcherPath -Value $launcherContent -Force
    Write-Host "Script auxiliar de VNC criado: $launcherPath" -ForegroundColor Green

    # Registrar protocolo vnc:// no registro
    try {
        $regPath = "HKLM:\SOFTWARE\Classes\vnc"
        if (-not (Test-Path $regPath)) { New-Item -Path $regPath -Force | Out-Null }
        Set-Item -Path $regPath -Value "URL:VNC Protocol" -Force
        New-ItemProperty -Path $regPath -Name "URL Protocol" -Value "" -PropertyType String -Force -ErrorAction SilentlyContinue | Out-Null

        $iconPath = Join-Path $regPath "DefaultIcon"
        if (-not (Test-Path $iconPath)) { New-Item -Path $iconPath -Force | Out-Null }
        Set-Item -Path $iconPath -Value "`"$vncViewerPath`",0" -Force

        $shellPath = Join-Path $regPath "shell"
        if (-not (Test-Path $shellPath)) { New-Item -Path $shellPath -Force | Out-Null }
        $openPath = Join-Path $shellPath "open"
        if (-not (Test-Path $openPath)) { New-Item -Path $openPath -Force | Out-Null }
        $cmdPath = Join-Path $openPath "command"
        if (-not (Test-Path $cmdPath)) { New-Item -Path $cmdPath -Force | Out-Null }
        Set-Item -Path $cmdPath -Value "`"$launcherPath`" `"%1`"" -Force

        Write-Host "Protocolo vnc:// registrado com sucesso no Registro do Windows!" -ForegroundColor Green
    } catch {
        Write-Host "[ERRO] Falha ao escrever no registro. Verifique se rodou como Administrador!" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }

    # Registrar protocolo ping:// no registro
    try {
        $pingRegPath = "HKLM:\SOFTWARE\Classes\ping"
        if (-not (Test-Path $pingRegPath)) { New-Item -Path $pingRegPath -Force | Out-Null }
        Set-Item -Path $pingRegPath -Value "URL:Ping Protocol" -Force
        New-ItemProperty -Path $pingRegPath -Name "URL Protocol" -Value "" -PropertyType String -Force -ErrorAction SilentlyContinue | Out-Null

        $pingShellPath = Join-Path $pingRegPath "shell"
        if (-not (Test-Path $pingShellPath)) { New-Item -Path $pingShellPath -Force | Out-Null }
        $pingOpenPath = Join-Path $pingShellPath "open"
        if (-not (Test-Path $pingOpenPath)) { New-Item -Path $pingOpenPath -Force | Out-Null }
        $pingCmdPath = Join-Path $pingOpenPath "command"
        if (-not (Test-Path $pingCmdPath)) { New-Item -Path $pingCmdPath -Force | Out-Null }

        # Cria um bat auxiliar para o ping
        $pingLauncherPath = Join-Path $vncFolder "ping-web-launcher.bat"
        $pingLauncherContent = @"
@echo off
set IP=%1
set IP=%IP:ping://=%
set IP=%IP:/=%
set IP=%IP:"=%
echo =======================================
echo Testando conexao continua com: %IP%
echo =======================================
ping %IP% -t
"@
        Set-Content -Path $pingLauncherPath -Value $pingLauncherContent -Force

        Set-Item -Path $pingCmdPath -Value "`"$pingLauncherPath`" `"%1`"" -Force
        Write-Host "Protocolo ping:// registrado com sucesso no Registro do Windows!" -ForegroundColor Green
    } catch {
        Write-Host "[ERRO] Falha ao registrar ping:// no registro." -ForegroundColor Red
    }
}
else {
    # Perfil 2: Maquina de Usuario
    Write-Host "`nConfigurando perfil: Maquina de Usuario (VNC Server & Sincronizacao)..." -ForegroundColor Cyan

    if (-not $Automated) {
    # Habilitar RDP e Firewall
    try {
        Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -name "fDenyTSConnections" -value 0 -ErrorAction SilentlyContinue
        Enable-NetFirewallRule -DisplayGroup "Área de Trabalho Remota" -ErrorAction SilentlyContinue
        Enable-NetFirewallRule -DisplayGroup "Remote Desktop" -ErrorAction SilentlyContinue
        
        # Permitir Ping (ICMPv4) no Firewall
        New-NetFirewallRule -DisplayName "Permitir Ping EAV (ICMPv4-In)" -Protocol ICMPv4 -IcmpType 8 -Enabled True -Profile Any -Action Allow -ErrorAction SilentlyContinue | Out-Null
        Enable-NetFirewallRule -Name "CoreNet-Diag-ICMP4-EchoRequest-In" -ErrorAction SilentlyContinue | Out-Null
    } catch {}

    # Helper functions to safely write registry values
    function Set-RegValueBinary {
        param ([string]$regPath, [string]$Name, [byte[]]$Value)
        if (-not (Test-Path $regPath)) { New-Item -Path $regPath -Force | Out-Null }
        Remove-ItemProperty -Path $regPath -Name $Name -ErrorAction SilentlyContinue | Out-Null
        New-ItemProperty -Path $regPath -Name $Name -Value $Value -PropertyType Binary -Force -ErrorAction SilentlyContinue | Out-Null
    }
    function Set-RegValueDWord {
        param ([string]$regPath, [string]$Name, [int]$Value)
        if (-not (Test-Path $regPath)) { New-Item -Path $regPath -Force | Out-Null }
        Remove-ItemProperty -Path $regPath -Name $Name -ErrorAction SilentlyContinue | Out-Null
        New-ItemProperty -Path $regPath -Name $Name -Value $Value -PropertyType DWord -Force -ErrorAction SilentlyContinue | Out-Null
    }
    function Set-RegValueString {
        param ([string]$regPath, [string]$Name, [string]$Value)
        if (-not (Test-Path $regPath)) { New-Item -Path $regPath -Force | Out-Null }
        Remove-ItemProperty -Path $regPath -Name $Name -ErrorAction SilentlyContinue | Out-Null
        New-ItemProperty -Path $regPath -Name $Name -Value $Value -PropertyType String -Force -ErrorAction SilentlyContinue | Out-Null
    }

    Write-Host "Aplicando politicas de Seguranca e Permissao do TightVNC Server..." -ForegroundColor Yellow
    $paths = @("HKLM:\SOFTWARE\TightVNC\Server", "HKLM:\SOFTWARE\WOW6432Node\TightVNC\Server")
    
    # Adiciona o HKCU do usuário ativo logado mapeando o SID dele
    try {
        $currentUser = (Get-WmiObject -Class Win32_ComputerSystem).UserName
        if ($currentUser) {
            $userParts = $currentUser -split "\\"
            $justUsername = $userParts[-1]
            $userSid = (New-Object System.Security.Principal.NTAccount($justUsername)).Translate([System.Security.Principal.SecurityIdentifier]).Value
            if ($userSid) {
                $paths += "Registry::HKEY_USERS\$userSid\Software\TightVNC\Server"
            }
        }
    } catch {}
    
    # Adiciona também o HKCU do processo atual (Administrador/Elevado)
    $paths += "HKCU:\Software\TightVNC\Server"
    
    $passwordBytes = [byte[]](24, 46, 45, 156, 85, 106, 201, 7)

    foreach ($path in $paths) {
        Set-RegValueDWord -regPath $path -Name "QuerySetting" -Value 2
        Set-RegValueDWord -regPath $path -Name "QueryAccept" -Value 1
        Set-RegValueDWord -regPath $path -Name "QueryTimeout" -Value 30
        Set-RegValueDWord -regPath $path -Name "QueryAction" -Value 0
        Set-RegValueDWord -regPath $path -Name "QueryAllowNoActiveLogon" -Value 1
        Set-RegValueDWord -regPath $path -Name "UseVncAuthentication" -Value 1
        Set-RegValueDWord -regPath $path -Name "UseControlAuthentication" -Value 1
        Set-RegValueBinary -regPath $path -Name "Password" -Value $passwordBytes
        Set-RegValueBinary -regPath $path -Name "ControlPassword" -Value $passwordBytes
        Set-RegValueString -regPath $path -Name "IpAccessControl" -Value "0.0.0.0-255.255.255.255:2"
    }
    Write-Host "Politicas de seguranca e senha (eav@2017) aplicadas com sucesso no Registro (Todos os perfis)." -ForegroundColor Green

    # Liberar porta do VNC (5900) e Ping no Firewall
    Write-Host "Liberando VNC (Porta 5900) e Ping (ICMPv4) no Firewall..." -ForegroundColor Yellow
    netsh advfirewall firewall add rule name="Allow VNC (Port 5900-In)" protocol=TCP localport=5900 dir=in action=allow | Out-Null
    netsh advfirewall firewall add rule name="Allow Ping (ICMPv4-In)" protocol=icmpv4:8,any dir=in action=allow | Out-Null

    # Reiniciar servico do VNC
    $vncExe64 = "C:\Program Files\TightVNC\tvnserver.exe"
    $vncExe32 = "C:\Program Files (x86)\TightVNC\tvnserver.exe"
    $vncPath = $null
    if (Test-Path $vncExe64) { $vncPath = $vncExe64 }
    elseif (Test-Path $vncExe32) { $vncPath = $vncExe32 }

    if ($vncPath) {
        Write-Host "TightVNC Server encontrado. Parando servico para aplicar configuracoes..." -ForegroundColor Yellow
        
        # Para o serviço de forma limpa se estiver rodando
        Stop-Service -Name "tvnserver" -Force -ErrorAction SilentlyContinue
        
        # Garante o registro do TightVNC como serviço do Windows apenas se não existir
        if (-not (Get-Service -Name "tvnserver" -ErrorAction SilentlyContinue)) {
            & $vncPath -install -silent 2>$null | Out-Null
        }
        
        # Garante a finalização de qualquer processo órfão
        Get-Process -Name "tvnserver" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        
        Write-Host "Iniciando servico do TightVNC Server..." -ForegroundColor Yellow
        # Inicia o serviço
        Start-Service -Name "tvnserver" -ErrorAction SilentlyContinue
        
        # Recarrega as configurações para garantir a leitura do registro recém-modificado
        & $vncPath -controlservice -reload
        Write-Host "Servico do TightVNC Server registrado, reiniciado e atualizado." -ForegroundColor Green
    } else {
        Write-Host "[AVISO] tvnserver.exe nao encontrado. Certifique-se de instalar o TightVNC Server manualmente para aplicar as configuracoes!" -ForegroundColor Yellow
    }
    
    # ============================================
    # INSTALAÇÃO E CONFIGURAÇÃO DO RUSTDESK
    # ============================================
    Write-Host "`nInstalando e Configurando o RustDesk..." -ForegroundColor Yellow
    
    $currentPath = $PSScriptRoot
    if ([string]::IsNullOrEmpty($currentPath)) {
        if (-not [string]::IsNullOrEmpty($MyInvocation.MyCommand.Path)) {
            $currentPath = Split-Path -Parent $MyInvocation.MyCommand.Path
        } else {
            $currentPath = $PWD.Path
        }
    }
    
    $rustdeskInstaller = Get-ChildItem -Path (Join-Path $currentPath "Binarios") -Filter "rustdesk*.exe" -File | Select-Object -First 1
    if ($rustdeskInstaller) {
        $rustdeskInstaller = $rustdeskInstaller.FullName
    }
    
    # Desbloquear os arquivos baixados da internet (Remove o bloqueio do Windows SmartScreen)
    Write-Host "Removendo bloqueios de seguranca do Windows (SmartScreen)..." -ForegroundColor Yellow
    Get-ChildItem -Path $currentPath -Recurse -File | Unblock-File -ErrorAction SilentlyContinue
    
    if ($null -ne $rustdeskInstaller -and (Test-Path $rustdeskInstaller)) {
        
        # NUCLEAR CLEANUP: Destruir todas as instalações antigas e conflitantes do RustDesk
        Write-Host "Realizando Limpeza Nuclear de compilações antigas do RustDesk..." -ForegroundColor Red
        
        # Matar processos
        $killAttempts = 0
        while ((Get-Process -Name "*rustdesk*" -ErrorAction SilentlyContinue) -and $killAttempts -lt 5) {
            Stop-Process -Name "*rustdesk*" -Force -ErrorAction SilentlyContinue
            taskkill /F /IM "rustdesk*.exe" /T 2>$null | Out-Null
            Start-Sleep -Seconds 2
            $killAttempts++
        }
        
        # Deletar serviço
        sc.exe delete RustDesk 2>&1 | Out-Null
        
        # Deletar pastas de instalação conflitantes (NÃO deletar os arquivos de config/id)
        $conflictingPaths = @(
            "C:\Program Files\RustDesk",
            "C:\Program Files\SuporteEAV",
            "$env:LOCALAPPDATA\rustdesk",
            "$env:APPDATA\rustdesk\rustdesk.exe"
        )
        
        # Adicionar pastas do LocalAppData de todos os usuários
        $usersPath = "C:\Users"
        if (Test-Path $usersPath) {
            $userFolders = Get-ChildItem -Path $usersPath -Directory -ErrorAction SilentlyContinue
            foreach ($folder in $userFolders) {
                $conflictingPaths += Join-Path $folder.FullName "AppData\Local\rustdesk"
            }
        }
        
        foreach ($cPath in $conflictingPaths) {
            if (Test-Path $cPath) {
                Remove-Item -Path $cPath -Recurse -Force -ErrorAction SilentlyContinue
            }
        }
        
        Write-Host "Limpeza Nuclear concluída. O terreno está limpo para a instalação." -ForegroundColor Green
        Start-Sleep -Seconds 2

        Write-Host "Instalador do RustDesk encontrado! Instalando..." -ForegroundColor Cyan
        
        # Instalar a versão oficial via instalador NSIS (SEM o -Wait para não travar no serviço de fundo!)
        Write-Host "Instalando o RustDesk Oficial (Modo Silencioso NSIS)..." -ForegroundColor Yellow
        Start-Process -FilePath $rustdeskInstaller -ArgumentList "/S" -NoNewWindow
        
        Write-Host "Aguardando instalador extrair os arquivos originais..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        
        $rdInstallDir = "C:\Program Files\RustDesk"
        $rdExe = Join-Path $rdInstallDir "rustdesk.exe"
        
        # Garante que o serviço antigo ou recém-criado pare para aplicarmos a configuração
        net stop RustDesk 2>&1 | Out-Null
        Start-Sleep -Seconds 2
        
        Write-Host "Aplicando configuracoes e senha do RustDesk (Eav@Admin2026)..." -ForegroundColor Cyan
        $TOML_SVC = "$env:SYSTEMROOT\ServiceProfiles\LocalService\AppData\Roaming\RustDesk\config"
        $TOML_USR = "$env:APPDATA\RustDesk\config"
        
        if (-not (Test-Path $TOML_SVC)) { New-Item -ItemType Directory -Force -Path $TOML_SVC | Out-Null }
        if (-not (Test-Path $TOML_USR)) { New-Item -ItemType Directory -Force -Path $TOML_USR | Out-Null }
        
        $existingIdLine = ""
        if (Test-Path "$TOML_SVC\RustDesk2.toml") {
            $content = Get-Content "$TOML_SVC\RustDesk2.toml" -ErrorAction SilentlyContinue
            $match = $content | Select-String -Pattern "(?im)^id\s*=\s*.*"
            if ($match) { $existingIdLine = $match.Matches[0].Value }
        }
        
        $tomlContent = @"
rendezvous_server = 'tech.escolaamericana.com.br'
key = 'rDbatE1DhL2xDc9VySqRkRmpveTb00wuM2lQv3ScyQ='
nat_type = 1
serial = 0
unlock_pin = 'Eav@Admin2026'
[options]
custom-rendezvous-server = 'tech.escolaamericana.com.br'
key = 'rDbatElDhL2xDc9vySqRkRmRpv0tb0BwuM21Qv3ScyQ='
allow-hide-password = 'Y'
"@
        if ($existingIdLine) {
            $tomlContent = "$existingIdLine`n$tomlContent"
        }
        
        $tomlContent | Out-File -FilePath "$TOML_SVC\RustDesk2.toml" -Encoding utf8 -Force
        $tomlContent | Out-File -FilePath "$TOML_USR\RustDesk2.toml" -Encoding utf8 -Force
        
        # Criar atalho na Área de Trabalho Pública
        try {
            $wshShell = New-Object -ComObject WScript.Shell
            $shortcut = $wshShell.CreateShortcut("$env:PUBLIC\Desktop\Suporte EAV.lnk")
            $shortcut.TargetPath = $rdExe
            $shortcut.IconLocation = "$rdInstallDir\logo.ico"
            $shortcut.Save()
        } catch {}

        Write-Host "Iniciando Servico do RustDesk..." -ForegroundColor Yellow
        net stop RustDesk 2>$null | Out-Null
        net start RustDesk 2>$null | Out-Null
        
        # Iniciar a interface grafica do RustDesk minimizada para FORÇAR a geracao do ID e da conexao
        try {
            Start-Process -FilePath $rdExe -WindowStyle Minimized -ErrorAction SilentlyContinue
        } catch {}

        Write-Host "Aguardando 10 segundos para o RustDesk estabilizar e gerar a Identificacao..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        Write-Host "RustDesk (Suporte EAV) Instalado e Configurado com Sucesso!" -ForegroundColor Green
    } else {
        Write-Host "[AVISO] Instalador do RustDesk nao encontrado na pasta Binarios. A instalacao sera ignorada." -ForegroundColor Yellow
    }

    } # Fim do bloco if (-not $Automated)

    # Iniciar Coleta de Dados
    Write-Host "`nIniciando Coleta de Dados do Computador para Sincronizacao..." -ForegroundColor Cyan

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
    
    # 1. Tentar ler do arquivo salvo previamente pelo Agente
    $savedIdPath = "C:\EAV_Agente\rustdesk_id.txt"
    if (Test-Path $savedIdPath) {
        $rustdeskId = (Get-Content $savedIdPath).Trim()
        Write-Host "RustDesk ID recuperado do cache local: $rustdeskId" -ForegroundColor Green
    }
    
    $maxAttempts = 15
    $attempt = 0
    
    while (-not $rustdeskId -and $attempt -lt $maxAttempts) {
    if ($generatedId) {
        $rustdeskId = $generatedId
        Write-Host "`nRustDesk ID injetado com sucesso: $rustdeskId" -ForegroundColor Green
    } else {
        # 1. Tentar ler do arquivo salvo previamente pelo Agente
        $savedIdPath = "C:\EAV_Agente\rustdesk_id.txt"
        if (Test-Path $savedIdPath) {
            $rustdeskId = (Get-Content $savedIdPath).Trim()
            Write-Host "`nRustDesk ID recuperado do cache local: $rustdeskId" -ForegroundColor Green
        }
    }

    if (-not $rustdeskId) {
        Write-Host "`nO RustDesk 1.4.9 ocultou o ID (Criptografia de Seguranca Ativa)." -ForegroundColor Yellow
        Write-Host "Por favor, olhe na janela do RustDesk que acabou de abrir e digite o ID aqui." -ForegroundColor Cyan
        $rustdeskId = Read-Host "Digite o ID do RustDesk (apenas numeros, ex: 123456789)"
        
        if ($rustdeskId -match "\d+") {
            $rustdeskId = $rustdeskId -replace '\D',''
            Write-Host "ID capturado manualmente: $rustdeskId" -ForegroundColor Green
            
            # Salvar em um arquivo para o agente de background ler no futuro sem perguntar
            $agentDir = "C:\EAV_Agente"
            if (-not (Test-Path $agentDir)) { New-Item -ItemType Directory -Force -Path $agentDir | Out-Null }
            Set-Content -Path (Join-Path $agentDir "rustdesk_id.txt") -Value $rustdeskId -Force
        }
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

    # Enviar payload
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

    try {
        $headers = @{ 
            "Bypass-Tunnel-Reminder" = "true"
            "Authorization" = "Bearer EAV-SECURE-SYNC-2026-X1900"
        }
        $response = Invoke-RestMethod -Uri $serverUrl -Method Post -Body $jsonPayload -ContentType "application/json" -Headers $headers
        if ($response.success) {
            Write-Host "Sincronização concluída com sucesso no perfil Cliente!" -ForegroundColor Green
            Write-Host "Ação no servidor: $($response.action)" -ForegroundColor Cyan
            Write-Host "Dispositivo ID/Tag: $($response.device.tag)" -ForegroundColor Cyan
        } else {
            Write-Host "Servidor retornou sucesso falso: $response" -ForegroundColor Red
        }
    } catch {
        Write-Host "Erro ao enviar dados. Verifique a conexão com o servidor." -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }

    if (-not $Automated) {
        Write-Host "`nConfigurando a execucao em segundo plano (Servico Silencioso)..." -ForegroundColor Yellow
        if ([string]::IsNullOrEmpty($PSCommandPath)) {
            Write-Host "Aviso: O script foi executado colando o codigo no console. Para configurar o servico em segundo plano, voce deve executar o arquivo salvo (.ps1) clicando com o botao direito e indo em 'Executar com o PowerShell' ou rodando pelo caminho do arquivo." -ForegroundColor Red
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
                Write-Host "Aviso: Nao foi possivel usar o PowerShell para agendar. Usando SchTasks como plano B..." -ForegroundColor Yellow
                $cmd = "powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$targetScript`" -ServerIP `"$ServerIP`" -Automated -SavedCampus `"$detectedCampus`""
                schtasks /create /tn "EAV-Sincronizacao" /ru "SYSTEM" /sc HOURLY /mo 4 /tr "$cmd" /f | Out-Null
                Write-Host "Servico em segundo plano criado com sucesso via SchTasks! O sistema sera atualizado automaticamente a cada 4 horas." -ForegroundColor Green
            }
        }
    }
}

if (-not $Automated) {
    Write-Host "`nA janela será fechada em 5 segundos..."
    Start-Sleep -Seconds 5
}
}
