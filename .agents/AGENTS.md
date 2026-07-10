# EAV Portal TI - Contexto e Resumo do Projeto

Bem-vindo(a) ao projeto EAV Portal TI! Ao iniciar um novo chat, leia este documento para se contextualizar rapidamente sobre o estado atual do sistema, arquitetura e refatorações recentes.

## 🏗️ Arquitetura do Sistema
- **Frontend:** React (Vite) com TailwindCSS. Padrão arquitetural em transição para o *Feature-Sliced Design* (FSD).
- **Gerenciamento de Estado:** Utiliza SWR (`useSWR`) para cache automático e requisições ao banco, especialmente nos módulos refatorados.
- **Backend/Banco de Dados:** Node.js (Express) com banco de dados PostgreSQL. Hospedado via Coolify.

## 🔒 Regras de Negócio e Segurança (MUITO IMPORTANTE)
- **Autenticação/Autorização:** **NUNCA** utilize verificações *hardcoded* de e-mail (ex: `email === 'erisson.junior@...'`) para conceder permissões no frontend ou backend.
- O controle de acesso **deve sempre** ser feito verificando o cargo vindo do banco de dados: `userRole === 'admin' || userRole === 'superadmin'`.
- As senhas e contas administrativas padrão na inicialização do banco (`server.js`) utilizam variáveis de ambiente (`process.env.DEFAULT_ADMIN_EMAIL`, `process.env.DEFAULT_ADMIN_PASSWORD`). **Não versionar dados sensíveis.**

## 🛠️ Refatorações Recentes e Concluídas
1. **Módulo de Chamados (TasksModule):**
   - O antigo `TasksModule.tsx` monolítico (800+ linhas) foi componentizado seguindo o Modern Web Guidance.
   - Foram criados componentes menores na pasta `components/tasks/`: `useTasks.ts` (Hooks do SWR), `TasksList.tsx`, `TaskDetailPanel.tsx` e `NewTaskModal.tsx`.
   - O fluxo de tela agora tem performance otimizada graças ao Cache Automático do SWR.
2. **Correção do Bug do VNC:**
   - Corrigido o erro no `server.js` (linha 753) onde o password buscava `process.env.process.env.VNC_PASSWORD`, o que gerava `undefined`.
3. **Limpeza de Hardcodes:**
   - Removida concessão arbitrária de acesso de SuperAdmin baseada em strings de e-mail nos arquivos: `App.tsx`, `VaultModule.tsx`, `TutorialsModule.tsx`, e `LinksModule.tsx`. Todos passaram a receber e validar via `userRole`.

## 📌 Guia para Novas Implementações
- Sempre prefira componentizar módulos muito extensos da mesma forma que foi feito na pasta `components/tasks/`.
- Ao criar interações com o banco de dados via frontend, dê preferência ao `useSWR` para manter a interface rápida e reativa sem onerar o banco no Coolify.
- Ao atualizar dependências ou rodar comandos locais, sinta-se à vontade para realizar testes rápidos com `npm run build` para checar a tipagem Typescript.
