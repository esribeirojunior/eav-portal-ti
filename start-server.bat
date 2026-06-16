@echo off
echo Iniciando servidor de Gestao de Ativos...
cd /d "%~dp0"
npm run pm2:start
echo Servidor iniciado! Acesse: http://localhost:3000
pause
