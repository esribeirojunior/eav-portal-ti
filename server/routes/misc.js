import express from 'express';
import https from 'https';

// Rotas utilitarias avulsas: health check e o proxy do PABX Monitcall.
// Montado na raiz (app.use(router)) porque os paths sao absolutos
// (/health e /api/monitcall vivem em prefixos diferentes).
export function createMiscRouter({ authenticateToken }) {
  const router = express.Router();

  // GET /health -- usado pelo health check do Coolify/Docker.
  router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // GET /api/monitcall -- proxy autenticado para o PABX Monitcall.
  // Credenciais via env (MONITCALL_USER / MONITCALL_PASSWORD).
  router.get('/api/monitcall', authenticateToken, (req, res) => {
    const target = req.query.target || 'ramais';
    const fila = req.query.fila || '1021';

    const username = process.env.MONITCALL_USER;
    const password = process.env.MONITCALL_PASSWORD;
    if (!username || !password) {
      return res.status(503).json({ error: 'Monitcall credentials not configured' });
    }
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');

    const monitcallPath =
      target === 'agentes'
        ? `/monitcall/api/v1/buscarEstadoDosAgentes.php?fila=${fila}`
        : '/monitcall/api/v1/buscarEstadoDosRamais.php';

    console.log(`[Proxy] GET https://escolaamericana.monitcall.com${monitcallPath}`);

    const options = {
      hostname: 'escolaamericana.monitcall.com',
      path: monitcallPath,
      method: 'GET',
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json',
      },
      rejectUnauthorized: false, // Aceita o certificado auto-assinado da Monitcall
    };

    const proxyReq = https.request(options, (proxyRes) => {
      let body = '';
      proxyRes.on('data', (chunk) => (body += chunk));
      proxyRes.on('end', () => {
        try {
          const data = JSON.parse(body);
          console.log(`[Proxy] Monitcall respondeu: ${proxyRes.statusCode}`);
          res.setHeader('Content-Type', 'application/json');
          res.status(200).json(data);
        } catch (e) {
          console.error('[Proxy] Erro ao parsear resposta:', e.message);
          res.status(500).json({ error: 'Resposta inválida da Monitcall' });
        }
      });
    });

    proxyReq.on('error', (e) => {
      console.error('[Proxy] Erro de conexão:', e.message);
      res.status(502).json({ error: `Falha ao conectar à Monitcall: ${e.message}` });
    });

    proxyReq.setTimeout(15000, () => {
      proxyReq.destroy();
      res.status(504).json({ error: 'Timeout ao conectar à Monitcall' });
    });

    proxyReq.end();
  });

  return router;
}
