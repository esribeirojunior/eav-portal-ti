@echo off
:: =========================================================================
:: Script de Instalacao do Protocolo VNC Web (vnc://)
:: Escola Americana de Vitoria
:: =========================================================================
:: Este script registra o protocolo customizado no Windows do seu PC local
:: para que ao clicar no site da EAV, o TightVNC Viewer se abra sozinho.
:: =========================================================================

echo.
echo ===========================================
echo   CONFIGURADOR DO VNC WEB PARA A TI EAV
echo ===========================================
echo.

:: Verifica Permissoes de Administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Privilegios de Administrador detectados.
) else (
    echo [ERRO] Por favor, rode este script como Administrador!
    echo Clique com o botao direito e selecione "Executar como Administrador".
    pause
    exit /b
)

:: Definir caminhos
set VNC_LAUNCHER_PATH=C:\Program Files\TightVNC\vnc-web-launcher.bat
set VNC_VIEWER_PATH=C:\Program Files\TightVNC\tvnviewer.exe

if not exist "%VNC_VIEWER_PATH%" (
    echo.
    echo [ERRO] TightVNC Viewer nao encontrado no caminho padrao!
    echo (%VNC_VIEWER_PATH%)
    echo Por favor, instale o TightVNC Viewer no seu computador primeiro.
    pause
    exit /b
)

echo.
echo [1/2] Criando o script auxiliar do VNC...
echo @echo off > "%VNC_LAUNCHER_PATH%"
echo set IP=%%1 >> "%VNC_LAUNCHER_PATH%"
echo set IP=%%IP:vnc://=%% >> "%VNC_LAUNCHER_PATH%"
echo set IP=%%IP:/=%% >> "%VNC_LAUNCHER_PATH%"
echo start "" "%VNC_VIEWER_PATH%" %%IP%% -password=eav@2017 >> "%VNC_LAUNCHER_PATH%"

echo.
echo [2/2] Registrando protocolo no Windows Registry...
reg add "HKCR\vnc" /ve /t REG_SZ /d "URL:VNC Protocol" /f >nul
reg add "HKCR\vnc" /v "URL Protocol" /t REG_SZ /d "" /f >nul
reg add "HKCR\vnc\DefaultIcon" /ve /t REG_SZ /d "\"%VNC_VIEWER_PATH%\",0" /f >nul
reg add "HKCR\vnc\shell" /f >nul
reg add "HKCR\vnc\shell\open" /f >nul
reg add "HKCR\vnc\shell\open\command" /ve /t REG_SZ /d "\"%VNC_LAUNCHER_PATH%\" \"%%1\"" /f >nul

echo.
echo ===========================================
echo SUCESSO! O VNC WEB FOI CONFIGURADO!
echo ===========================================
echo A partir de agora, qualquer botao "Acesso Remoto" no painel da
echo EAV abrira diretamente a tela do usuario conectada via VNC.
echo.
pause
