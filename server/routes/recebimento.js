import express from 'express';

// Rotas de e-mail do Recebimento. IMPORTANTE: o e-mail NUNCA sai sozinho.
// O registro do recebimento e salvo pela rota generica /api/db (insert). O
// envio de e-mail so acontece quando alguem chama explicitamente POST /send
// com o id de UM recebimento -> manda so pro responsavel/aluno daquele
// registro. Nada de disparo automatico ou em massa.
export function createRecebimentoRouter({ pool, authenticateToken, mailer }) {
  const router = express.Router();

  // Frontend usa pra saber se deve mostrar/habilitar o botao de enviar.
  router.get('/status', authenticateToken, (req, res) => {
    res.json({ configured: mailer.isConfigured(), missing: mailer.missing() });
  });

  // Envio manual e pontual da confirmacao de UM recebimento especifico.
  router.post('/send', authenticateToken, async (req, res) => {
    try {
      const id = req.body && req.body.id;
      if (!id) return res.status(400).json({ error: 'id do recebimento obrigatorio.' });
      if (!mailer.isConfigured()) {
        return res.status(400).json({
          error: 'SMTP nao configurado no servidor. Faltam (nao lidas em runtime): ' + mailer.missing().join(', '),
        });
      }

      const result = await pool.query('SELECT * FROM recebimentos WHERE id = $1', [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Recebimento nao encontrado.' });

      const rec = result.rows[0];
      const outcome = await mailer.sendRecebimentoEmail(rec);
      if (!outcome.sent) return res.status(400).json({ error: outcome.reason || 'Falha no envio.' });

      const to = [rec.responsavel_email, rec.user_email].filter((e) => e && String(e).includes('@'));
      return res.json({ success: true, to });
    } catch (err) {
      console.error('[Recebimento/send] erro:', err);
      return res.status(500).json({ error: 'Erro ao enviar e-mail: ' + err.message });
    }
  });

  return router;
}
