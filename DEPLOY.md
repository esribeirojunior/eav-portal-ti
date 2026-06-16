# 🚀 Guia de Deploy no Render

Agora que a aplicação utiliza o **Render** para hospedagem, siga as instruções abaixo para garantir um deploy correto.

## Opção Recomendada: Deploy via Git

### 1. Preparar o Repositório
Certifique-se de que todas as alterações foram enviadas para o seu repositório Git (GitHub/GitLab):
```bash
git add .
git commit -m "feat: melhorias no inventário e limpeza do projeto"
git push origin main
```

### 2. Configurar no Render
1. Acesse o [Dashboard do Render](https://dashboard.render.com).
2. Clique em **New +** e selecione **Static Site**.
3. Conecte sua conta do GitHub/GitLab e selecione o repositório do projeto.

### 3. Configurações de Build
O Render deve detectar automaticamente as configurações, mas confirme se estão assim:
- **Runtime:** `Node`
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`

### 4. Variáveis de Ambiente (CRÍTICO)
No painel do Render, vá na aba **Environment** e adicione as seguintes variáveis:

| Key | Value |
| :--- | :--- |
| `VITE_SUPABASE_URL` | *(Sua URL do Supabase)* |
| `VITE_SUPABASE_ANON_KEY` | *(Sua Anon Key do Supabase)* |
| `VITE_ADMIN_USER` | `Ti-Admin` |
| `VITE_ADMIN_PASS` | *(Sua Senha)* |

> [!IMPORTANT]
> Nunca deixe chaves reais em arquivos de documentação se o repositório for público. Utilize sempre o painel do provedor de hospedagem para gerenciar segredos.

### 5. Configurar Redirects (Single Page Application)
Como utilizamos React Router, você precisa configurar os redirects no Render para que o Refresh da página funcione:
1. Vá em **Redirects/Rewrites**.
2. Adicione uma regra:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** `Rewrite`

---

## 🔧 Manutenção Local
Caso precise rodar o servidor localmente com PM2 (se estiver usando um Windows Server/VPS):
```bash
npm run pm2:start
```

Para ver os logs:
```bash
npm run pm2:logs
```
