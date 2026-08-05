# EAV Portal TI

Portal interno de TI da Escola Americana de Vitória — gestão de inventário de
equipamentos (MacBooks, notebooks, monitores, periféricos), controle de custódia
por usuário/setor, integração com o MDM **Mosyle**, acesso remoto via **RustDesk**,
cofre de senhas, tarefas de TI e um assistente (Copilot).

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Backend | Node.js + Express (`server.js`) |
| Banco | PostgreSQL (self-hosted no Coolify) |
| Auth | Google Sign-In (GSI) + login local (bcrypt) |
| MDM | Mosyle Manager API (sync automático de Macs/iPads) |
| Acesso remoto | RustDesk (`rustdesk://<id>`) |
| E-mails | Automação via n8n (webhook) |
| Deploy | Docker via Coolify |
| Desktop (opcional) | Electron (`electron-main.js`) |

## Rodando localmente

Requisitos: Node 18+ e uma `DATABASE_URL` de um Postgres acessível.

```bash
npm install
cp .env.example .env   # preencha as variáveis (ver abaixo)
npm run dev            # Vite na porta 3000 (proxy /api -> 3001)
npm start              # sobe só o backend Express (server.js)
```

Para rodar frontend + backend juntos em dev, use dois terminais: `npm run dev`
(Vite) e `npm start` (Express), ou rode o build e sirva pelo próprio Express:

```bash
npm run build          # gera dist/
npm start              # Express serve dist/ + API
```

## Variáveis de ambiente

Configuradas no painel do **Coolify** em produção (não commitar `.env`). Principais:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | connection string do Postgres |
| `VAULT_MASTER_KEY` | chave AES-256 do cofre de senhas (hex 32 bytes) |
| `AGENT_SYNC_TOKEN` | token do agente RMM (`agent-sync.ps1`) |
| `MOSYLE_ACCESS_TOKEN` / `MOSYLE_EMAIL` / `MOSYLE_PASSWORD` | credenciais da API do Mosyle |
| `OPENAI_API_KEY` | Copilot (GPT) |
| `GOOGLE_CLIENT_ID` | Google Sign-In |
| `MONITCALL_USER` / `MONITCALL_PASSWORD` | proxy do PABX Monitcall |
| `DEFAULT_ADMIN_PASSWORD` | senha inicial do admin (só no primeiro boot) |

## Estrutura

```
App.tsx              Componente raiz (SPA, roteamento por estado)
index.tsx / .html    Entrada do React / Vite
types.ts             Tipos e enums (Device, DeviceStatus, etc.)
server.js            Backend Express (API + serve o build)
electron-main.js     Empacotamento desktop (opcional)
components/          Componentes React por módulo
lib/                 Utilitários do frontend (apiClient, deviceStatus, etc.)
data/                Dados em runtime (tutorials.json, vault.key — não versionar)
sql/                 Scripts SQL de referência (legado Supabase)
supabase/            Edge functions legadas (não usadas em runtime)
n8n-email-templates/ Templates dos e-mails disparados pelo n8n
mac/                 Agente de sync para máquinas macOS
scripts/legacy/      Scripts one-shot já aplicados (histórico — ver README lá)
agent-sync.ps1       Agente RMM para máquinas Windows (coleta hardware + RustDesk ID)
```

## Deploy

Push na `main` → webhook do Coolify → build via `Dockerfile` → deploy.

Documentação de arquitetura mais detalhada em [`DOCUMENTATION.md`](DOCUMENTATION.md).
