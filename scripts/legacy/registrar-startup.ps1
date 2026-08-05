@"
Registrando tarefa de inicializacao automatica do servidor EAV...
"@ | Write-Host -ForegroundColor Cyan

$projectPath = "C:\Users\erisson.junior\Downloads\EAVTEST-main (4)\EAVTEST-main"
$nodePath = (Get-Command node).Source

$action = New-ScheduledTaskAction `
    -Execute $nodePath `
    -Argument "server.js" `
    -WorkingDirectory $projectPath

$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
    -TaskName "EAV - Servidor de Gestao TI" `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description "Inicia automaticamente o servidor backend do sistema EAV na porta 3001" `
    -RunLevel Highest `
    -Force

Write-Host ""
Write-Host "SUCESSO! O servidor vai iniciar automaticamente no proximo login." -ForegroundColor Green
Write-Host "Para acessar o sistema: https://localhost:3001" -ForegroundColor Yellow
Write-Host ""
Pause
