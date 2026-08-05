@echo off
:: =========================================================================
:: Script de Instalacao do Protocolo VNC Web (vnc://)
:: =========================================================================

echo.
echo ===========================================
echo   CONFIGURADOR DO VNC WEB PARA A TI EAV
echo ===========================================
echo.

:: Verifica Permissoes de Administrador
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo [ERRO] Por favor, clique com o botao direito no arquivo e escolha "Executar como Administrador".
    pause
    exit /b
)

set "VNC_LAUNCHER_PATH=C:\Program Files\TightVNC\vnc-web-launcher.bat"
set "VNC_VIEWER_PATH=C:\Program Files\TightVNC\tvnviewer.exe"

echo Verificando se o VNC esta instalado em: %VNC_VIEWER_PATH%

if not exist "%VNC_VIEWER_PATH%" (
    echo [ERRO] O aplicativo tvnviewer.exe nao foi encontrado na pasta padrao.
    echo Certifique-se de que voce instalou a versao 64-bits do TightVNC.
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
echo Pode fechar esta janela.
echo.
pause
