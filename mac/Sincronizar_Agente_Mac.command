#!/bin/bash

# Direciona o diretório de execução para a pasta do script
cd "$(dirname "$0")"

clear
echo "================================================"
echo "       AGENTE UNIVERSAL VNC - macOS (MacBook)   "
echo "================================================"
echo "Este script irá configurar o acesso remoto nativo"
echo "e sincronizar os dados do Mac com o painel."
echo "================================================"
echo ""

# Pergunta pelo servidor
DEFAULT_SERVER="10.158.0.4"
read -p "Digite o IP ou Domínio do Servidor [Enter para usar $DEFAULT_SERVER]: " INPUT_SERVER

if [ -z "$INPUT_SERVER" ]; then
    SERVER_IP="$DEFAULT_SERVER"
else
    SERVER_IP="$INPUT_SERVER"
fi

# Ajusta a URL base do servidor
BASE_URL="$SERVER_IP"
if [[ "$BASE_URL" != http://* && "$BASE_URL" != https://* ]]; then
    if [[ "$BASE_URL" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        BASE_URL="http://${BASE_URL}:3000"
    else
        BASE_URL="http://${BASE_URL}"
    fi
fi

# --- 1. Ativação do VNC Nativo (Screen Sharing) ---
echo ""
echo ">> Configurando e ativando o Compartilhamento de Tela (VNC) nativo..."
echo "Para isso, pode ser necessária a sua senha de Administrador do Mac (sudo):"

# Tenta ativar o serviço de Screen Sharing no macOS
if sudo defaults write /var/db/launchd.db/com.apple.launchd/overrides.plist com.apple.screensharing -dict Disabled -bool false 2>/dev/null && \
   sudo launchctl load -w /System/Library/LaunchDaemons/com.apple.screensharing.plist 2>/dev/null; then
    echo "[SUCESSO] Compartilhamento de tela nativo ativado via linha de comando."
else
    echo "[AVISO] Não foi possível ativar via terminal. Garanta a ativação manual em:"
    echo "        Ajustes do Sistema -> Geral -> Compartilhamento -> Compartilhamento de Tela -> Ativado."
fi

echo "Lembre-se de configurar a senha 'eav2017' no menu Ajustes do Computador do Compartilhamento de Tela."

# --- 2. Coleta de Dados do Hardware ---
echo ""
echo ">> Iniciando Coleta de Dados do MacBook..."

HOSTNAME=$(scutil --get LocalHostName 2>/dev/null || hostname)
USERNAME=$(stat -f%Su /dev/console 2>/dev/null || id -un)
OS_NAME="macOS $(sw_vers -productVersion) ($(sw_vers -buildVersion))"

# Detecção de CPU (Intel ou Apple Silicon)
CPU_NAME=$(sysctl -n machdep.cpu.brand_string 2>/dev/null)
if [ -z "$CPU_NAME" ]; then
    CPU_NAME=$(system_profiler SPHardwareDataType | awk -F': ' '/Chip/ {print $2}' | xargs)
fi
if [ -z "$CPU_NAME" ]; then
    CPU_NAME="Apple Silicon"
fi

# RAM em GB
RAM_BYTES=$(sysctl -n hw.memsize)
RAM_GB=$(echo "scale=2; $RAM_BYTES / 1024 / 1024 / 1024" | bc 2>/dev/null)
if [ -z "$RAM_GB" ]; then
    RAM_GB=$(($RAM_BYTES / 1024 / 1024 / 1024))
fi

# Disco Total e Livre em GB
DISK_TOTAL=$(df -g / | awk 'NR==2 {print $2}')
DISK_FREE=$(df -g / | awk 'NR==2 {print $4}')

SERIAL_NUMBER=$(system_profiler SPHardwareDataType | awk '/Serial Number/ {print $4}')
MODEL=$(sysctl -n hw.model)
MANUFACTURER="Apple Inc."

# Identificação da Interface de Rede Principal e IP
ROUTE_IF=$(route get default 2>/dev/null | awk '/interface:/ {print $2}')
if [ -z "$ROUTE_IF" ]; then
    ROUTE_IF="en0"
fi
IP_ADDRESS=$(ipconfig getifaddr $ROUTE_IF 2>/dev/null)
if [ -z "$IP_ADDRESS" ]; then
    IP_ADDRESS="Desconhecido"
fi

MAC_ADDRESS=$(ifconfig $ROUTE_IF 2>/dev/null | awk '/ether/ {print $2}')
if [ -z "$MAC_ADDRESS" ]; then
    MAC_ADDRESS=$(networksetup -getmacaddress Wi-Fi 2>/dev/null | awk '{print $3}')
fi

# Cálculo de Uptime em Dias
BOOT_TIME=$(sysctl -n kern.boottime | awk -F'sec = ' '{print $2}' | awk -F',' '{print $1}')
CURRENT_TIME=$(date +%s)
UPTIME_SECONDS=$(($CURRENT_TIME - $BOOT_TIME))
UPTIME_DAYS=$(echo "scale=1; $UPTIME_SECONDS / 86400" | bc 2>/dev/null)
if [ -z "$UPTIME_DAYS" ]; then
    UPTIME_DAYS=$(($UPTIME_SECONDS / 86400))
fi

# Coleta de SSID de Rede sem Fio
WIFI_SSID=$(/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I 2>/dev/null | awk -F': ' '/ SSID/ {print $2}')
if [ -z "$WIFI_SSID" ]; then
    WIFI_SSID=$(ipconfig getsummary $ROUTE_IF 2>/dev/null | awk -F': ' '/SSID/ {print $2}')
fi
if [ -z "$WIFI_SSID" ]; then
    WIFI_SSID="N/A"
fi

# Saúde da Bateria
BATTERY_PERCENT=$(pmset -g batt 2>/dev/null | grep -o '[0-9]\+%' | head -n 1 | tr -d '%')
if [ -n "$BATTERY_PERCENT" ]; then
    BATTERY_HEALTH="Saudável: ${BATTERY_PERCENT}%"
else
    BATTERY_HEALTH="Não Possui/Desktop"
fi

# Monitores
MONITOR_COUNT=$(system_profiler SPDisplaysDataType 2>/dev/null | grep -c "Resolution:")
if [ "$MONITOR_COUNT" -eq 0 ]; then
    MONITOR_COUNT=1
fi
MONITORS="${MONITOR_COUNT} tela(s)"

# --- 3. Identificação do Campus Baseada na Rede ---
echo ""
DETECTED_CAMPUS="Álvares"
if [[ "$IP_ADDRESS" == 10.10.156.* ]]; then
    DETECTED_CAMPUS="Álvares"
    echo "Rede detectada automaticamente como Campus Álvares (IP: $IP_ADDRESS)"
elif [[ "$IP_ADDRESS" == 10.5.* ]] || [[ "$IP_ADDRESS" == 10.10.157.* ]]; then
    DETECTED_CAMPUS="Aeroporto"
    echo "Rede detectada automaticamente como Campus Aeroporto (IP: $IP_ADDRESS)"
else
    echo "Rede atual nao mapeada automaticamente para nenhum Campus (IP: $IP_ADDRESS)."
    echo "Selecione o Campus correspondente:"
    echo "[1] Álvares"
    echo "[2] Aeroporto"
    read -p "Selecione a opcao (1 ou 2): " campOp
    if [ "$campOp" = "2" ]; then
        DETECTED_CAMPUS="Aeroporto"
    else
        DETECTED_CAMPUS="Álvares"
    fi
fi

# --- 4. Envio do Payload ---
# Função para escapar caracteres especiais para o JSON
escape_json() {
  local str="$1"
  str="${str//\\/\\\\}"
  str="${str//\"/\\\"}"
  echo "$str"
}

JSON_PAYLOAD="{\"hostname\":\"$(escape_json "$HOSTNAME")\",\"username\":\"$(escape_json "$USERNAME")\",\"os\":\"$(escape_json "$OS_NAME")\",\"cpu\":\"$(escape_json "$CPU_NAME")\",\"ram_gb\":$RAM_GB,\"disk_total_gb\":$DISK_TOTAL,\"disk_free_gb\":$DISK_FREE,\"serial_number\":\"$(escape_json "$SERIAL_NUMBER")\",\"model\":\"$(escape_json "$MODEL")\",\"manufacturer\":\"$(escape_json "$MANUFACTURER")\",\"mac_address\":\"$(escape_json "$MAC_ADDRESS")\",\"ip_address\":\"$(escape_json "$IP_ADDRESS")\",\"uptime_days\":$UPTIME_DAYS,\"wifi_ssid\":\"$(escape_json "$WIFI_SSID")\",\"battery_health\":\"$(escape_json "$BATTERY_HEALTH")\",\"monitors\":\"$(escape_json "$MONITORS")\",\"campus\":\"$(escape_json "$DETECTED_CAMPUS")\"}"

SERVER_URL="${BASE_URL}/api/agent/sync"
echo ""
echo "Enviando dados para o servidor: $SERVER_URL ..."

# Efetua a requisição via curl
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -H "Bypass-Tunnel-Reminder: true" \
  -d "$JSON_PAYLOAD" \
  "$SERVER_URL")

HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo ""
    echo "Sincronização concluída com sucesso no perfil Mac!"
    echo "Resposta do servidor: $BODY"
else
    echo ""
    echo "Erro ao enviar dados. Status HTTP: $HTTP_STATUS"
    echo "Mensagem: $BODY"
fi

echo ""
read -n 1 -s -p "Pressione qualquer tecla para sair..."
echo ""
