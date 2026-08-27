# RustDesk Server self-hosted — EAV

Servidor próprio de acesso remoto, pra as máquinas **não** ficarem expostas no
servidor público do RustDesk. Só quem tem a **chave pública** do servidor
(suas máquinas, via GPO) consegue se conectar através dele.

## Componentes

| Serviço | Função | Portas |
|---|---|---|
| `hbbs` | Registro de ID / rendezvous | 21115/tcp, 21116/tcp+udp, 21118/tcp |
| `hbbr` | Relay | 21117/tcp, 21119/tcp |

> **UDP 21116 é obrigatório** — sem ele o hole punching não funciona.

## Deploy no Coolify

1. **DNS**: aponte um subdomínio (ex: `rustdesk.escolaamericana.com.br`) para o
   IP público do servidor do Coolify (registro A).
2. **Firewall / security group**: libere as portas da tabela acima (TCP e o UDP 21116).
3. No Coolify: **New Resource → Docker Compose**, cole o `docker-compose.yml`.
4. **Environment variable**: `RUSTDESK_HOST = rustdesk.escolaamericana.com.br`.
5. Deploy.

> Não precisa de proxy/HTTPS do Coolify aqui — o RustDesk usa TCP/UDP crus,
> não HTTP. Por isso o `network_mode: host` + portas abertas no firewall.

## Pegar a chave pública (depois do 1º deploy)

O `hbbs` gera o par de chaves em `./data` (o volume) no primeiro boot.
No terminal do servidor:

```bash
docker exec eav-rustdesk-hbbs cat /root/id_ed25519.pub
```

Copie o conteúdo (uma linha, termina com `=`). **Essa é a chave pública** que
vai nas máquinas. A privada (`id_ed25519`) fica só no servidor — nunca sai dele.

## Apontar as máquinas pro servidor

Depois de ter o host + a chave pública, o `eav-setup.ps1` configura cada máquina
pra usar o servidor (feito no deploy via GPO). Os valores vão no `eav-config.psd1`:

```
RustDeskHost = 'rustdesk.escolaamericana.com.br'
RustDeskKey  = 'CHAVE_PUBLICA_AQUI='
```

## Validar

Numa máquina configurada, RustDesk → Settings → Network deve mostrar o ID/Relay
server apontando pro seu domínio, e o status "Ready" (verde). Conexão pelo portal
(Suporte Externo) passa a rotear pelo seu servidor.
