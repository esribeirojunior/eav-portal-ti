@echo off
color 0B
echo ===================================================
echo Iniciando o Agente de Sincronizacao...
echo ===================================================

:: Tenta rodar o script powershell ignorando a politica de bloqueio do Windows
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0agent-sync.ps1"

echo.
echo Pressione qualquer tecla para sair do instalador...
pause >nul
