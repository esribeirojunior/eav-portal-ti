import express from 'express';

// Rota do EAV Copilot (/api/ai/chat). Monta o contexto do inventario e
// consulta a OpenAI. Recebe authenticateToken, readDBTable e a instancia
// openai via factory. Montada em /api/ai.
export function createAiRouter({ authenticateToken, readDBTable, openai }) {
  const router = express.Router();

  // POST /api/ai/chat
  router.post('/chat', authenticateToken, async (req, res) => {
    const { message, history = [], userRole = 'admin', userEmail = 'Desconhecido' } = req.body;
    if (!message) return res.status(400).json({ error: 'Mensagem obrigatória' });

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'Chave da OpenAI não configurada no servidor.' });
    }

    try {
      let devices = [];
      let assignments = [];
      let audit_logs = [];
      let departments = [];
      try {
        devices = await readDBTable('devices');
        assignments = await readDBTable('assignments');
        audit_logs = await readDBTable('audit_logs');
        departments = await readDBTable('department');
      } catch (e) {
        console.error('Erro lendo banco para IA', e);
      }

      const contextData = `
Contexto do Sistema EAV Equipamentos (Central de Gestão TI):
Temos ${devices.length} equipamentos cadastrados, ${assignments.length} empréstimos registrados e ${audit_logs.length} logs de auditoria.

Lista de Setores/Departamentos:
${JSON.stringify(
  departments.map((d) => ({ ID: d.id, Nome: d.name })),
  null,
  2
)}

Resumo dos Equipamentos (Ativos):
${JSON.stringify(
  devices.map((d) => {
    let hostname = d.hostname || 'Desconhecido';
    let ip = 'N/A';
    let loggedUser = 'N/A';
    if (d.condition && d.condition.includes('Hostname: ')) {
      hostname = d.condition.split('Hostname: ')[1].split(' |')[0];
    }
    if (d.condition && d.condition.includes('IP: ')) {
      ip = d.condition.split('IP: ')[1].split(' |')[0];
    }
    if (d.condition && d.condition.includes('Usuário Logado: ')) {
      loggedUser = d.condition.split('Usuário Logado: ')[1].split(' |')[0];
    }
    const activeAssign = assignments.find(
      (a) => String(a.device_id) === String(d.id) && !a.returned_at
    );
    const deviceCampus = activeAssign ? activeAssign.campus || 'Desconhecido' : 'Desconhecido';
    const deviceDept = activeAssign ? activeAssign.department_id : null;
    return {
      ID: d.id,
      SN: d.serial_number || d.serialNumber,
      Hostname: hostname,
      IP: ip,
      Tipo: d.type,
      UsuarioAtivo: loggedUser,
      Campus: deviceCampus,
      Status: d.status,
      Model: d.model,
      Dept: deviceDept,
    };
  }),
  null,
  2
)}

Resumo dos Empréstimos Ativos:
${JSON.stringify(
  assignments
    .filter((a) => !a.returned_at)
    .map((a) => ({ DeviceID: a.device_id, User: a.user_name, Campus: a.campus, Date: a.assigned_at })),
  null,
  2
)}

Últimos 30 Registros de Atividades (Auditoria / Histórico de quem fez o quê por último):
${JSON.stringify(
  audit_logs.slice(-30).map((a) => ({
    Acao: a.action,
    Device: a.device_id,
    Detalhes: a.details,
    Usuario: a.user_email,
    Data: a.timestamp,
  })),
  null,
  2
)}

Você é o "EAV Copilot", um analista de dados assistente super inteligente para a equipe de TI da Escola Americana de Vitória (EAV).
Responda de forma direta, amigável e em Português usando os dados fornecidos. Você consegue cruzar os IDs dos departamentos com os nomes deles para dar respostas claras.
Use as tabelas de auditoria para saber as últimas ações, movimentações ou "último equipamento" adicionado/alterado.
Formate a resposta usando Markdown (listas, negrito) para ficar bonito no chat.

REGRA DE PERMISSÃO E IDENTIDADE (MUITO IMPORTANTE):
O e-mail/identificação do usuário atual conversando com você é: "${userEmail}".
Se ele se referir a si mesmo (ex: "meus itens", "no meu nome"), filtre os dados procurando por este e-mail/identificação.
O nível de acesso dele é: "${userRole}".
Se o acesso for "viewer" (Somente Leitura) e o usuário pedir para você cadastrar, adicionar, alterar, emprestar ou excluir qualquer ativo ou dado, VOCÊ ESTÁ ESTRITAMENTE PROIBIDA de aceitar o comando. Você deve responder educadamente que ele possui acesso de "Somente Leitura" e não tem permissão para realizar alterações no sistema.

REGRA MUITO IMPORTANTE DE ACESSO REMOTO:
Se o usuário pedir para acessar remotamente (VNC) a tela de um computador, laboratório, ou de um usuário, você DEVE procurar o Hostname ou IP desse(s) computador(es) na tabela.
Se você encontrar, adicione no final da sua resposta a tag exata: [ACTION:VNC|nomedopc] (substitua nomedopc pelo hostname ou IP real).
IMPORTANTE: Se o usuário estiver utilizando MAIS DE UM computador, você deve adicionar uma tag [ACTION:VNC|nomedopc] separada para CADA UM dos computadores encontrados! Exemplo:
[ACTION:VNC|PC1]
[ACTION:VNC|PC2]

Histórico da Conversa:
${history.map((h) => `${h.role === 'user' ? 'Usuário' : 'Copilot'}: ${h.text}`).join('\n')}

Nova Mensagem do Usuário: ${message}
`;

      const result = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: contextData }],
      });

      return res.json({ reply: result.choices[0].message.content });
    } catch (err) {
      console.error('Erro no EAV Copilot:', err);
      let errorMessage = err.message || '';

      if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        return res
          .status(429)
          .json({ error: `Você atingiu o limite da OpenAI! Verifique os fundos da sua API Key.` });
      }

      return res.status(500).json({ error: 'Falha ao conectar com a IA: ' + errorMessage });
    }
  });

  return router;
}
