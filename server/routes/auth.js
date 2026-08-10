import express from 'express';
import { OAuth2Client } from 'google-auth-library';

// Rotas de autenticacao (/api/auth/*): login local (bcrypt + migracao lazy),
// logout (invalida sessao) e Google Sign-In. Recebe os helpers de sessao e
// senha via factory. Montado em /api/auth.
export function createAuthRouter({
  pool,
  readDBTable,
  verifyPassword,
  hashPassword,
  createSession,
  destroySession,
  authenticateToken,
}) {
  const router = express.Router();

  const googleClient = new OAuth2Client();
  const GOOGLE_CLIENT_ID =
    process.env.GOOGLE_CLIENT_ID ||
    '219719535721-26k832m63t27fpik9cionsnje45mp0du.apps.googleusercontent.com';

  // POST /api/auth/login -- login local contra authorized_users.
  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    try {
      const users = await readDBTable('authorized_users');
      const user = users.find(
        (u) => String(u.email || '').toLowerCase().trim() === String(email).toLowerCase().trim()
      );

      // Mensagem unificada para nao vazar quais emails existem no sistema.
      const INVALID = { status: 401, body: { error: 'Credenciais inválidas.' } };
      if (!user) {
        return res.status(INVALID.status).json(INVALID.body);
      }

      const { ok, needsRehash } = await verifyPassword(password, user.password);
      if (!ok) {
        return res.status(INVALID.status).json(INVALID.body);
      }

      // Migracao lazy: se a senha estava em plaintext no banco, agora que
      // sabemos que confere, gravamos hash bcrypt no lugar.
      if (needsRehash) {
        try {
          const newHash = await hashPassword(password);
          await pool.query('UPDATE authorized_users SET password = $1 WHERE id = $2', [
            newHash,
            user.id,
          ]);
          console.log(`[Auth] Senha migrada para bcrypt: ${email}`);
        } catch (e) {
          console.error(`[Auth] Falha ao migrar senha para bcrypt (${email}):`, e.message);
        }
      }

      console.log(`[Auth] Login bem-sucedido para: ${email}`);
      const token = createSession(user);
      return res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          modules: user.modules,
          name: user.email.split('@')[0],
        },
        token: token,
      });
    } catch (err) {
      console.error('Erro no login local:', err);
      return res.status(500).json({ error: 'Erro interno no servidor ao autenticar.' });
    }
  });

  // POST /api/auth/logout -- remove a sessao do lado do servidor.
  router.post('/logout', authenticateToken, (req, res) => {
    destroySession(req.sessionToken);
    return res.json({ success: true });
  });

  // POST /api/auth/google -- valida o ID Token do Google Sign-In.
  router.post('/google', async (req, res) => {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Token de credencial do Google é obrigatório.' });
    }

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const email = payload['email'];

      if (!email) {
        return res.status(401).json({ error: 'Não foi possível ler o e-mail da conta Google.' });
      }

      const users = await readDBTable('authorized_users');
      const user = users.find(
        (u) => String(u.email || '').toLowerCase().trim() === String(email).toLowerCase().trim()
      );

      if (!user) {
        return res
          .status(401)
          .json({ error: `O e-mail ${email} não está autorizado a acessar a Central de TI.` });
      }

      console.log(`[Auth Google] Login bem-sucedido para: ${email}`);
      const token = createSession(user);

      return res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          modules: user.modules,
          name: payload['name'] || user.email.split('@')[0],
        },
        token: token,
      });
    } catch (err) {
      console.error('Erro na autenticação do Google:', err);
      return res.status(401).json({ error: 'Autenticação do Google falhou.' });
    }
  });

  return router;
}
