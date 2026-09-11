import nodemailer from 'nodemailer';

// Serviço de e-mail (noreply) via SMTP. Todas as credenciais vêm de variáveis
// de ambiente — NADA hardcoded. Se as variáveis não estiverem setadas, o envio
// simplesmente não acontece (o recebimento continua sendo salvo normalmente).
//
// Variáveis esperadas (setar no Coolify):
//   SMTP_HOST      ex: smtp.gmail.com
//   SMTP_PORT      ex: 587 (STARTTLS) ou 465 (SSL)
//   SMTP_SECURE    'true' para 465; qualquer outra coisa/ausente = false
//   SMTP_USER      a conta noreply (ex: noreply@escolaamericana.com.br)
//   SMTP_PASS      a senha (ou App Password, no caso do Google Workspace)
//   SMTP_FROM      remetente exibido (ex: "EAV TI <noreply@escolaamericana.com.br>")
export function createMailer() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.MAIL_FROM || (user ? `Escola Americana de Vitoria - TI <${user}>` : '');

  const configured = !!(host && user && pass);
  const transporter = configured ? nodemailer.createTransport({ host, port, secure, auth: { user, pass } }) : null;

  const esc = (s) => String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  const fmtDate = (d) => {
    if (!d) return '—';
    try {
      const dt = new Date(String(d).length <= 10 ? d + 'T00:00:00' : d);
      return dt.toLocaleDateString('pt-BR');
    } catch {
      return String(d);
    }
  };

  function buildHtml(rec) {
    const reprovado = /reprovado/i.test(rec.resultado || '');
    const avarias = /avarias/i.test(rec.resultado || '');
    const barColor = reprovado ? '#f43f5e' : avarias ? '#f59e0b' : '#10b981';
    const row = (label, val) =>
      `<tr><td style="padding:14px 18px; border-bottom:1px solid #f1f5f9; font-size:14px;">
        <span style="color:#64748b;">${label}</span>
        <div style="color:#0f172a; font-weight:600; margin-top:2px;">${esc(val || '—')}</div></td></tr>`;
    return `<div style="margin:0; padding:0; background-color:#eef2f6; font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f6; padding: 24px 0;"><tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08);">
      <tr><td style="background: linear-gradient(135deg, #001f3f 0%, #004578 50%, #0a5c96 100%); padding: 28px 32px;">
        <span style="display:inline-block; width:8px; height:32px; background:${barColor}; border-radius:4px; vertical-align:middle; margin-right:14px;"></span>
        <span style="color:#ffffff; font-size:20px; font-weight:700; vertical-align:middle;">Recebimento de Equipamento</span>
        <div style="color:#cbd5e1; font-size:13px; margin-top:6px; margin-left:22px;">Controle de Equipamentos &middot; TI &middot; Escola Americana de Vit&oacute;ria</div>
      </td></tr>
      <tr><td style="padding: 32px;">
        <p style="margin:0 0 4px; font-size:16px; color:#0f172a;">Ol&aacute;, <strong>${esc(rec.user_name)}</strong></p>
        <p style="margin:0 0 24px; font-size:14px; color:#64748b; line-height:1.5;">Confirmamos o recebimento e a an&aacute;lise de estado do equipamento abaixo. Os dados do registro seguem para sua confer&ecirc;ncia.</p>
        <div style="margin:0 0 20px;">
          <span style="display:inline-block; background:${barColor}1a; color:${barColor}; font-weight:800; text-transform:uppercase; font-size:13px; padding:8px 16px; border-radius:8px;">${esc(rec.resultado || '—')}</span>
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0; border-radius:10px; overflow:hidden;">
          <tr><td style="background:#f8fafc; padding:10px 18px; border-bottom:1px solid #e2e8f0; font-size:13px; font-weight:700; color:#004578; text-transform:uppercase; letter-spacing:0.03em;">Informa&ccedil;&otilde;es do Recebimento</td></tr>
          ${row('Aluno', rec.user_name)}
          ${row('S&eacute;rie/Turma', rec.serie_turma)}
          ${row('Equipamento', [rec.marca, rec.modelo].filter(Boolean).join(' '))}
          ${row('N&ordm; de S&eacute;rie', rec.serial_number)}
          ${row('Patrim&ocirc;nio', rec.device_tag)}
          ${row('Data de Recebimento', fmtDate(rec.data_recebimento))}
          ${row('Data de Verifica&ccedil;&atilde;o', fmtDate(rec.data_verificacao))}
          ${rec.observacoes ? row('Observa&ccedil;&otilde;es', rec.observacoes) : ''}
        </table>
        <p style="margin:24px 0 0; font-size:12.5px; color:#94a3b8; line-height:1.5;">Se algum dado acima estiver incorreto, entre em contato com o time de TI.</p>
      </td></tr>
      <tr><td style="background:#f8fafc; padding:18px 32px; border-top:1px solid #e2e8f0;">
        <p style="margin:0; font-size:11.5px; color:#94a3b8; text-align:center;">Escola Americana de Vit&oacute;ria &middot; Controle de Equipamentos de TI &middot; Este &eacute; um e-mail autom&aacute;tico, n&atilde;o responda diretamente.</p>
      </td></tr>
    </table>
  </td></tr></table>
</div>`;
  }

  function isConfigured() {
    return configured;
  }

  // Quais variaveis essenciais estao faltando (nomes, nunca valores).
  function missing() {
    const m = [];
    if (!host) m.push('SMTP_HOST');
    if (!user) m.push('SMTP_USER');
    if (!pass) m.push('SMTP_PASS');
    return m;
  }

  async function sendRecebimentoEmail(rec) {
    if (!configured) return { sent: false, reason: 'SMTP nao configurado' };
    const to = [rec.responsavel_email, rec.user_email].filter((e) => e && String(e).includes('@'));
    if (to.length === 0) return { sent: false, reason: 'Sem e-mail de destino' };
    try {
      await transporter.sendMail({
        from,
        to,
        subject: `Recebimento de Equipamento — ${rec.device_tag || rec.modelo || 'EAV'}`,
        html: buildHtml(rec),
      });
      return { sent: true };
    } catch (e) {
      return { sent: false, reason: e.message };
    }
  }

  return { isConfigured, sendRecebimentoEmail, missing };
}
