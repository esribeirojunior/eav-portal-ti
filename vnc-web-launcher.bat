@echo off
set IP=%1
echo =======================================
echo DEBUG DO VNC LAUNCHER
echo IP Recebido do Navegador: %IP%
echo =======================================
set IP=%IP:vnc://=%
set IP=%IP:/=%
set IP=%IP:"=%
echo IP Limpo para conexao: %IP%
echo.
echo Iniciando TightVNC Viewer...
start "" "C:\Program Files\TightVNC\tvnviewer.exe" %IP% -password=eav2017
echo.
echo Se o VNC nao abriu, veja se ha algum erro acima.
pause
