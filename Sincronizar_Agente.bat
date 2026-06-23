@echo off
color 0B

:: Verifica privilegios de administrador
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo Solicitando privilegios de administrador para instalar o VNC...
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /b
)

echo ===================================================
echo Iniciando o Agente de Sincronizacao (Modo Administrador)...
echo Servidor Central EAV: 10.158.0.4
echo ===================================================

set SERVER_IP=10.158.0.4

:: Tenta rodar o script powershell ignorando a politica de bloqueio do Windows
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0agent-sync.ps1" -ServerIP "%SERVER_IP%"

echo.
echo Pressione qualquer tecla para sair do instalador...
pause >nul
