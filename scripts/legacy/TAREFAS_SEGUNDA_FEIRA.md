# 🚀 Roteiro de Tarefas para Segunda-Feira

Este é o nosso plano de voo para continuarmos os trabalhos na próxima segunda-feira!

## 1. Validação Final do Ping (Firewall)
Como conversamos, o botão de Ping falhou porque o Firewall do Windows nas máquinas de teste bloqueia os pacotes `ICMPv4` (Ping) por padrão.
- **O que fazer:** Pegue o arquivo **`Agente_TI_EAV.zip`** que foi recriado na sua Área de Trabalho (Desktop).
- Extraia em uma máquina cliente e execute o `Sincronizar_Agente.bat` novamente.
- **Motivo:** O novo script agora possui uma instrução que adiciona a regra de permissão do Ping no Firewall do Windows automaticamente (`Allow Ping ICMPv4-In`).
- Teste o botão de Ping no Painel Web. Se ficar verde, essa etapa estará 100% concluída.

---

## 2. Implementação do Login via Google (OAuth)
Para substituirmos o login manual por um botão elegante de **"Entrar com Google Workspace"**, precisaremos seguir estes 3 passos fundamentais em conjunto.

### Passo A: Configuração no Google Cloud (Sua parte)
1. Você precisará acessar o **Google Cloud Console** (`console.cloud.google.com`) logado com a sua conta de Administrador da Escola Americana de Vitória.
2. Criar um "Novo Projeto" (ex: `Painel EAV`).
3. Ir em **APIs e Serviços > Tela de Consentimento OAuth** e configurar o acesso como "Interno" (apenas e-mails `@escolaamericana.com.br` terão acesso).
4. Ir em **Credenciais > Criar Credenciais > ID do Cliente OAuth**.
5. No campo de Origens JavaScript e URIs de Redirecionamento, precisaremos cadastrar o IP do seu servidor (ex: `http://10.158.0.4:3000`).
6. Você irá gerar duas chaves: um **Client ID** e um **Client Secret**.

### Passo B: Conexão do Painel ao Google (Minha parte)
Com as chaves em mãos, eu entrarei em ação para codificar a integração:
1. Vou adicionar as duas chaves fornecidas por você no arquivo de ambiente `.env` do servidor.
2. Criarei um novo caminho no backend (`/api/auth/google`) para se comunicar com o Google e checar se o usuário realmente pertence à escola.
3. Atualizarei o `server.js` para gerar nosso Token JWT validado com base na resposta do Google.

### Passo C: Ajuste na Interface Visual (Minha parte)
1. Editaremos o arquivo `App.tsx` (a tela de Login azul maravilhosa que criamos).
2. Ocultaremos ou substituiremos os campos de "E-mail e Senha" por um botão grandioso e bonito com a logo do Google dizendo: **"Acessar com Google Workspace"**.

---

Tenha um excelente final de semana! Segunda-feira a gente detona essa integração! 👊
