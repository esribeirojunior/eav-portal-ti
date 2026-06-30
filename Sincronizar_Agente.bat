@echo off
color 0B

:: Verifica privilegios de administrador
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo Solicitando privilegios de administrador para configurar o agente...
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /b
)

echo ===================================================
echo Iniciando o Agente de Sincronizacao (Modo Administrador)...
echo ===================================================

:: Se um parametro for passado ao bat, use-o como SERVER_IP (ex: rodar via script ou GPO)
set SERVER_IP=%1
if not "%SERVER_IP%"=="" goto :run

:: Se rodar clicando duas vezes, ele pergunta se deseja usar o servidor padrao ou outro (como o Coolify)
echo Servidor Padrao cadastrado: tech.escolaamericana.com.br
set /p INPUT_IP=Digite o IP ou Dominio do Servidor [Enter para usar o padrao]: 

if "%INPUT_IP%"=="" (
    set SERVER_IP=tech.escolaamericana.com.br
) else (
    set SERVER_IP=%INPUT_IP%
)

:run
echo Servidor definido para conexao: %SERVER_IP%
echo.

:: Tenta rodar o script powershell ignorando a politica de bloqueio do Windows
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0agent-sync.ps1" -ServerIP "%SERVER_IP%"

echo.
echo Pressione qualquer tecla para sair...
pause >nul
