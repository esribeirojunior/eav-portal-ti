# 📚 Documentação Oficial: EAV-Portal TI

Este documento serve como o mapa completo do seu sistema (Central de Gestão de TI da Escola Americana de Vitória) e descreve o estado atual da arquitetura, das tecnologias usadas e das recentes mudanças implementadas na área de trabalho.

---

## 🎯 1. Visão Geral do Sistema
O **EAV-Portal** é um Dashboard Administrativo completo desenvolvido para a equipe de Tecnologia da EAV. Seu propósito é centralizar a gestão do parque tecnológico, controle de senhas, manutenções, tarefas da equipe e atribuição de equipamentos aos colaboradores.

### 🏗️ Arquitetura e Tecnologias
- **Frontend (Interface):** React.js com TypeScript, empacotado usando Vite.
- **Estilização:** TailwindCSS (com suporte avançado a Dark Mode e animações).
- **Ícones e Gráficos:** Lucide-React e Recharts.
- **Backend (Servidor):** Node.js com Express (`server.js`), responsável por prover a API e servir a aplicação.
- **Banco de Dados:** PostgreSQL (nativo). O acesso ao banco é abstraído pelo proxy `/api/db` dentro do `server.js`, que intercepta requisições estilo Supabase do Frontend e as traduz para queries SQL seguras.
- **Inteligência Artificial:** Integração direta com a API da OpenAI (GPT-4o-mini) para o recurso "EAV Copilot".
- **Hospedagem / Deploy:** Coolify (Plataforma de CI/CD e orquestração de containers Docker).

---

## 🧩 2. Módulos Principais

### 💻 1. Inventário de Dispositivos (Devices)
- **O que faz:** Controle de todo o hardware da escola (Notebooks, Monitores, MacBooks, etc).
- **Recursos:** Filtros avançados, busca difusa (Fuzzy Search), status em tempo real (Disponível, Em Uso, Manutenção).
- **Importação/Exportação:** Motor robusto de importação via `.xlsx` com mapeamento automático de colunas e regras de UPSERT (Atualiza caso o Patrimônio/Tag já exista). Exportação cirúrgica para CSV mapeando exatamente o formato visual.

### 👥 2. Base de Colaboradores (Employees & Assignments)
- **O que faz:** Monitora com quem está cada dispositivo.
- **Mecanismo:** A tabela `assignments` vincula um colaborador (`user_name`, `user_email`, `department_id`) a um equipamento.
- **Histórico:** Mantém rastreabilidade de datas de empréstimo e devolução.

### 🛠️ 3. Manutenções (Maintenance Logs)
- **O que faz:** Histórico de consertos, chamados, defeitos relatados e custos atrelados aos dispositivos.

### 🔐 4. Cofre de Senhas (Vault)
- **O que faz:** Armazena senhas, chaves de API e acessos de forma criptografada (`crypto` interno do Node).
- **Segurança:** As senhas nunca trafegam em texto puro, e o acesso é estritamente logado no sistema de Auditoria.

### 📋 5. Tarefas de TI (IT Tasks)
- **O que faz:** Um painel Kanban/Lista para a equipe de TI organizar os afazeres internos, manutenções pendentes e rotinas.

### 🤖 6. EAV Copilot (Assistente IA)
- **O que faz:** Lê um resumo em tempo real do banco de dados (quantas máquinas estão ativas, inventário, etc.) e responde dúvidas do time de TI usando linguagem natural.
- **Superpoderes:** Capaz de gerar links rápidos para acessos remotos (VNC) quando identifica o IP/Hostname de um equipamento.

---

## 🔄 3. O Fluxo de Dados (Como o código se comunica)
Originalmente, o sistema parecia usar a API na nuvem do Supabase, mas para garantir **privacidade total e performance local**, toda a arquitetura foi internalizada:
1. O Frontend (React) faz chamadas de banco usando a sintaxe do Supabase (`supabase.from('devices').select(...)`).
2. O arquivo `lib/supabase.ts` **intercepta** essas chamadas antes delas saírem da rede.
3. O interceptador empacota a chamada e envia para a sua API interna: `POST /api/db`.
4. O `server.js` recebe o JSON, entende a sintaxe (ex: filtros, insert, upsert), monta uma query SQL bruta de PostgreSQL segura (usando *placeholders* `$1, $2` para evitar SQL Injection) e executa na sua base do Coolify.

---

## 🚀 4. Mudanças e Melhorias Recentes Implementadas
Aqui está o histórico das últimas refatorações que fizemos na sua área de trabalho para deixar o sistema à prova de balas:

1. **Migração Total para o PostgreSQL:**
   - O arquivo `server.js` foi reescrito para utilizar a biblioteca `pg`, abandonando o SQLite local. 
   - Foi implementado um motor de tradução de SQL dinâmico que compreende perfeitamente o operador `ON CONFLICT (id) DO UPDATE` para garantir que atualizações não quebrem o banco.

2. **Criação Segura de Tabelas (Migrations Nativas):**
   - A função `initPostgresDB` foi aprimorada para garantir a integridade estrutural.
   - Foram adicionadas verificações dinâmicas como `ALTER TABLE assignments ADD COLUMN IF NOT EXISTS user_email TEXT;` para consertar esquemas defasados sem perder dados.

3. **Módulo de Tarefas Restaurado:**
   - As tabelas `it_tasks` e `it_task_comments` foram injetadas no construtor de inicialização do banco, resolvendo a falha fatal (`relation does not exist`) que impedia a gravação de tarefas no Kanban.

4. **Motor de Importação Inteligente (Upsert Verdadeiro):**
   - **Antes:** Importar uma planilha pela segunda vez bloqueava as máquinas antigas jogando um "Erro 400 - Já existe um dispositivo".
   - **Agora:** O `server.js` reconhece o modo `isUpsert=true`. Se o Patrimônio (Tag) já existe na base, o sistema localiza o ID daquele equipamento silenciosamente e o atualiza com os dados novos da planilha.

5. **Tratamento de E-mails e Smart Chips:**
   - O motor de leitura `XLSX` no `ImportModal.tsx` foi validado para puxar as colunas corretas, contanto que o e-mail venha em formato texto.
   - Adicionada uma inteligência no momento da atribuição (`assignments`): Se a planilha possui o e-mail de um usuário, mas no banco ele estava vazio, o sistema faz um `UPDATE` silencioso vinculando o e-mail àquele colaborador sem criar registros duplicados.

6. **Exportação de CSV Impecável:**
   - O layout do botão "Exportar CSV" foi alterado para respeitar uma ordem lógica perfeita, exigida pela EAV: `Campus`, `Departamento`, `Usuário`, `Status`, `Dispositivo`, `Modelo`, `Service Tag`, `Email` e `Status Envio` (Coluna vazia de marcação).

---

## 🔒 5. Observações Finais de Infraestrutura
Sempre que alguma alteração for comitada e enviada (`git push origin main`), o **Coolify** detectará a mudança através do Webhook do GitHub. Ele orquestrará a parada dos containers antigos (`eav-portal-ti` e `postgresql-database`), instalará as novas dependências, executará o *build* do Vite e subirá os containers novamente. 

Esse processo garante *Zero Downtime* manual, mas requer os ~40 segundos naturais de compilação da plataforma.

*(Documento gerado automaticamente e atualizado conforme nossas últimas sessões de Pair Programming)*
