import express from 'express';
import https from 'https';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { exec, execFile, spawn } from 'child_process';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import bcrypt from 'bcryptjs';
import { getFriendlyAppleModelName } from './server/services/apple-models.js';
import { inferLastUserFromDeviceName } from './server/lib/device-names.js';
import { createTutorialsRouter } from './server/routes/tutorials.js';
import { createMiscRouter } from './server/routes/misc.js';
import { createUploadRouter } from './server/routes/upload.js';
import { createAdminRouter } from './server/routes/admin.js';
import { createVaultRouter } from './server/routes/vault.js';
import { createAiRouter } from './server/routes/ai.js';
import { createAgentRouter } from './server/routes/agent.js';
import { createAuthRouter } from './server/routes/auth.js';
import { createDevicesRouter } from './server/routes/devices.js';
import { createDbRouter } from './server/routes/db.js';
import { createMosyleRouter } from './server/routes/mosyle.js';
import { createMosyleSync } from './server/services/mosyle-sync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carrega o .env do mesmo diretório do server.js (dentro do ASAR em produção)
dotenv.config({ path: path.join(__dirname, '.env') });

// Configuração da OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'dummy_key_to_prevent_crash' });
const DEFAULT_DATA_DIR = path.join(__dirname, 'data');
const DATA_DIR = process.env.USER_DATA_PATH 
  ? path.join(process.env.USER_DATA_PATH, 'data') 
  : DEFAULT_DATA_DIR;
const TUTORIALS_FILE = path.join(DATA_DIR, 'tutorials.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

// Inicializa a pasta data e o arquivo json se não existirem
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Se estiver rodando no Electron, copia os arquivos padrão do ASAR para a pasta gravável
if (process.env.USER_DATA_PATH && fs.existsSync(DEFAULT_DATA_DIR)) {
  const filesToCopy = ['tutorials.json'];
  filesToCopy.forEach(file => {
    const src = path.join(DEFAULT_DATA_DIR, file);
    const dest = path.join(DATA_DIR, file);
    if (fs.existsSync(src) && !fs.existsSync(dest)) {
      try {
        fs.copyFileSync(src, dest);
        console.log(`[Electron] Copiado arquivo padrão: ${file}`);
      } catch (err) {
        console.error(`[Electron] Erro ao copiar ${file} para a pasta de dados:`, err);
      }
    }
  });
}

if (!fs.existsSync(TUTORIALS_FILE)) {
  fs.writeFileSync(TUTORIALS_FILE, JSON.stringify([], null, 2), 'utf-8');
}

const readTutorials = () => {
  try {
    const data = fs.readFileSync(TUTORIALS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Erro ao ler tutoriais:', err);
    return [];
  }
};

const writeTutorials = (data) => {
  fs.writeFileSync(TUTORIALS_FILE, JSON.stringify(data, null, 2), 'utf-8');
};
const isDev = fs.existsSync(path.join(__dirname, '.git'));
const PORT = process.env.PORT || (isDev ? 3001 : 3000);
const app = express();
app.set('trust proxy', true); // Segurança: Necessário para VPS/Docker como Coolify para ler IP real do cliente e não dar bypass no login

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir arquivos de upload estaticamente
app.use('/uploads', express.static(UPLOADS_DIR, {
  setHeaders: (res) => {
    // Impede que browsers interpretem o arquivo como HTML/JS mesmo se o
    // atacante conseguir passar um polyglot.
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
}));

// Rota de upload -> server/routes/upload.js (montada mais abaixo, depois
// que authenticateToken esta definido).

// Função utilitária para interceptar e salvar imagens em Base64 localmente
function processBase64Fields(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === 'string' && value.startsWith('data:image/')) {
      try {
        const matches = value.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const extension = mimeType.split('/')[1] || 'jpg';
          const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;
          const filePath = path.join(UPLOADS_DIR, filename);
          
          fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
          console.log(`[Uploads] Imagem Base64 salva localmente: ${filename}`);
          
          obj[key] = `/uploads/${filename}`;
        }
      } catch (err) {
        console.error('[Uploads] Erro ao salvar imagem base64:', err);
      }
    } else if (typeof value === 'object') {
      processBase64Fields(value);
    }
  }
}


// --- VAULT MASTER KEY ---
let VAULT_MASTER_KEY = process.env.VAULT_MASTER_KEY;
const VAULT_KEY_FILE = path.join(DATA_DIR, 'vault.key');

if (!VAULT_MASTER_KEY) {
    if (fs.existsSync(VAULT_KEY_FILE)) {
        VAULT_MASTER_KEY = fs.readFileSync(VAULT_KEY_FILE, 'utf8').trim();
        console.log('[Vault] VAULT_MASTER_KEY carregada do arquivo vault.key.');
    } else {
        console.warn('⚠️ [CRÍTICO] VAULT_MASTER_KEY não encontrada no ENV e nem no vault.key!');
        console.warn('⚠️ Gerando uma nova chave efêmera. Se o container reiniciar, as senhas serão PERDIDAS.');
        console.warn('⚠️ Configure a variável VAULT_MASTER_KEY no seu painel de hospedagem (ex: Coolify) imediatamente!');
        VAULT_MASTER_KEY = crypto.randomBytes(32).toString('hex');
        const envPath = path.join(__dirname, '.env');
        fs.appendFileSync(envPath, '\nVAULT_MASTER_KEY=' + VAULT_MASTER_KEY + '\n');
        try {
            fs.writeFileSync(VAULT_KEY_FILE, VAULT_MASTER_KEY, 'utf8');
        } catch (e) {
            console.error('[Vault] Erro ao salvar vault.key:', e.message);
        }
    }
    process.env.VAULT_MASTER_KEY = VAULT_MASTER_KEY;
}

// Criptografia AES-256-GCM para o Cofre
function encryptSecret(text) {
    const iv = crypto.randomBytes(12); // GCM recomendado 12 bytes
    const key = crypto.createHash('sha256').update(String(VAULT_MASTER_KEY)).digest('base64').substr(0, 32);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return iv.toString('hex') + ':' + authTag + ':' + encrypted;
}

function decryptSecret(encryptedData) {
    try {
        const parts = encryptedData.split(':');
        if (parts.length !== 3) return null;
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        const key = crypto.createHash('sha256').update(String(VAULT_MASTER_KEY)).digest('base64').substr(0, 32);
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        console.error('[Vault] Erro ao descriptografar:', err);
        return null;
    }
}

// --- POSTGRES DATABASE SYSTEM ---
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Limite máximo de conexões simultâneas que o Node pode abrir
  idleTimeoutMillis: 30000, // Fecha conexões ociosas (idle) após 30 segundos
  connectionTimeoutMillis: 2000, // Retorna erro rápido se o banco demorar mais de 2s para responder
});

// Função utilitária para converter placeholders '?' (SQLite) para '$1, $2' (PostgreSQL)
function convertPlaceholders(sql) {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

async function initPostgresDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS devices (id TEXT PRIMARY KEY, tag TEXT, serial_number TEXT, model TEXT, type TEXT, status TEXT, condition TEXT, last_seen TEXT, created_at TEXT, hostname TEXT, ip_address TEXT, mac_address TEXT, ram_gb INTEGER, cpu_model TEXT, os_version TEXT, is_accessory BOOLEAN DEFAULT false, invoice_number TEXT, supplier TEXT, purchase_date TEXT, warranty_expiry TEXT);
      CREATE TABLE IF NOT EXISTS mosyle_devices (id TEXT PRIMARY KEY, deviceudid TEXT, serial_number TEXT, device_name TEXT, os TEXT, model TEXT, total_disk TEXT, battery_level TEXT, raw_data TEXT, created_at TEXT);
      CREATE TABLE IF NOT EXISTS maintenance_logs (id TEXT PRIMARY KEY, device_id TEXT, user_email TEXT, issue_description TEXT, resolution TEXT, cost DECIMAL, start_date TEXT, end_date TEXT, created_at TEXT);
      CREATE TABLE IF NOT EXISTS assignments (id TEXT PRIMARY KEY, device_id TEXT, user_name TEXT, user_email TEXT, department_id TEXT, assigned_at TEXT, returned_at TEXT, return_photo_url TEXT, user_role TEXT, grade TEXT, campus TEXT, created_at TEXT);
      CREATE TABLE IF NOT EXISTS department (id TEXT PRIMARY KEY, name TEXT);
      CREATE TABLE IF NOT EXISTS shortcuts (id TEXT PRIMARY KEY, title TEXT, description TEXT, url TEXT, icon_name TEXT, color TEXT, campus TEXT);
      CREATE TABLE IF NOT EXISTS vault_projects (id TEXT PRIMARY KEY, name TEXT, created_at TEXT);
      CREATE TABLE IF NOT EXISTS vault_secrets (id TEXT PRIMARY KEY, key_name TEXT, encrypted_value TEXT, note TEXT, project_id TEXT, created_at TEXT);
      CREATE TABLE IF NOT EXISTS authorized_users (id TEXT PRIMARY KEY, email TEXT, password TEXT, created_at TEXT);
      CREATE TABLE IF NOT EXISTS it_tasks (id TEXT PRIMARY KEY, title TEXT, description TEXT, status TEXT, priority TEXT, due_date TEXT, created_by TEXT, created_at TEXT);
      CREATE TABLE IF NOT EXISTS it_task_comments (id TEXT PRIMARY KEY, task_id TEXT, user_email TEXT, content TEXT, created_at TEXT);
    `);
    
    // Assegura que colunas novas existam caso as tabelas tenham sido criadas numa versão anterior
      await pool.query(`
        ALTER TABLE assignments ADD COLUMN IF NOT EXISTS user_email TEXT;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS custom_department TEXT;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS custom_user TEXT;
      `);
      
      // Normaliza case do type de MacBook (sync antigo criava 'Macbook' lowercase c).
      // Migration one-shot idempotente.
      try { await pool.query("UPDATE devices SET type = 'MacBook' WHERE type = 'Macbook'"); } catch (e) { console.warn('[migration] normalize MacBook case:', e.message); }

      // Add role column if it doesn't exist (ignore error if it does)
      try { await pool.query("ALTER TABLE authorized_users ADD COLUMN role TEXT DEFAULT 'admin'"); } catch (e) {}
      try { 
        const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@escolaamericana.com.br';
        await pool.query("UPDATE authorized_users SET role = 'superadmin' WHERE email ILIKE $1", [adminEmail]); 
      } catch (e) {}
      
      // Add modules column if it doesn't exist
      try { await pool.query(`ALTER TABLE authorized_users ADD COLUMN modules TEXT DEFAULT '["assets","links","audit","tasks","vault","tutorials","lab","signage"]'`); } catch (e) {}
      
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, user_email TEXT, action TEXT, details TEXT, resource_type TEXT, resource_id TEXT, created_at TEXT);
    `);

    // Sessoes de login persistidas -- sobrevivem a restart do container.
    // created_at / last_used sao epoch millis (BIGINT).
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        token TEXT PRIMARY KEY,
        email TEXT,
        role TEXT,
        created_at BIGINT,
        last_used BIGINT
      );
    `);

    console.log('[PostgreSQL] Banco de dados inicializado com sucesso.');
    
    // Auto-popula departamentos padrão se o banco de dados estiver vazio
    const checkRes = await pool.query("SELECT COUNT(*) FROM department");
    if (parseInt(checkRes.rows[0].count) === 0) {
      console.log('[PostgreSQL] Banco vazio detectado. Criando departamentos padrão...');
      const defaultDepts = ['TI', 'Diretoria', 'Secretaria', 'Coordenação', 'Docentes', 'Discentes', 'Manutenção'];
      for (const dept of defaultDepts) {
        const id = Math.random().toString(36).substring(2, 9);
        await pool.query("INSERT INTO department (id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING", [id, dept]);
      }
    }

    // Auto-popula usuários autorizados padrão se estiver vazio
    const checkUsers = await pool.query("SELECT COUNT(*) FROM authorized_users");
    if (parseInt(checkUsers.rows[0].count) === 0) {
      console.log('[PostgreSQL] Criando usuário superadmin padrão...');
      const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@escolaamericana.com.br';
      const adminPass = process.env.DEFAULT_ADMIN_PASSWORD || 'admin@123';
      const adminPassHash = await hashPassword(adminPass);

      const id = Math.random().toString(36).substring(2, 9);
      await pool.query(
        "INSERT INTO authorized_users (id, email, password, role, created_at) VALUES ($1, $2, $3, 'superadmin', $4) ON CONFLICT DO NOTHING",
        [id, adminEmail, adminPassHash, new Date().toISOString()]
      );
    }

    // Auto-popula atalhos padrão se estiver vazio
    const checkShortcuts = await pool.query("SELECT COUNT(*) FROM shortcuts");
    if (parseInt(checkShortcuts.rows[0].count) === 0) {
      console.log('[PostgreSQL] Criando atalhos padrão...');
      const defaultShortcuts = [
        { title: 'BenQ DMS', description: 'Gestão de Telas Interativas e Projetores', url: 'https://dms.benq.com/', icon: 'Monitor', color: 'bg-orange-500' },
        { title: 'Google Admin', description: 'Gestão de Contas, Chromebooks e Políticas', url: 'https://admin.google.com/', icon: 'Globe', color: 'bg-blue-600' },
        { title: 'Meraki Dashboard', description: 'Infraestrutura de Rede e Wi-Fi', url: 'https://dashboard.meraki.com/', icon: 'Globe', color: 'bg-emerald-600' },
        { title: 'Suporte Microsoft', description: 'Portal de Administração Microsoft 365', url: 'https://admin.microsoft.com/', icon: 'Cloud', color: 'bg-indigo-600' }
      ];
      for (const sc of defaultShortcuts) {
        const id = Math.random().toString(36).substring(2, 9);
        await pool.query(
          "INSERT INTO shortcuts (id, title, description, url, icon_name, color) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING",
          [id, sc.title, sc.description, sc.url, sc.icon, sc.color]
        );
      }
    }
  } catch (err) {
    console.error('[PostgreSQL] Erro ao inicializar banco de dados:', err);
  }
}

// Inicializa o banco e, so depois, recarrega as sessoes persistidas pro Map.
initPostgresDB().then(() => loadSessionsFromDB());

async function readDBTable(sheetName) {
  try {
    const res = await pool.query(`SELECT * FROM ${sheetName}`);
    return res.rows;
  } catch(e) {
    console.error(`Erro lendo ${sheetName}:`, e);
    return [];
  }
}

// --- SENHAS ---
// Formato bcrypt inicia com "$2a$", "$2b$" ou "$2y$". Migracao lazy:
// verifyPassword aceita legado em plaintext e retorna needsRehash=true
// pra chamador atualizar o banco no proximo login bem-sucedido.
const BCRYPT_COST = 12;
const BCRYPT_PREFIX = /^\$2[aby]\$/;

async function hashPassword(plain) {
  return bcrypt.hash(String(plain), BCRYPT_COST);
}

async function verifyPassword(plain, stored) {
  const s = String(stored || '');
  const p = String(plain || '');
  if (BCRYPT_PREFIX.test(s)) {
    const ok = await bcrypt.compare(p, s);
    return { ok, needsRehash: false };
  }
  // Legado: senha em texto no banco. Compara direto e sinaliza para rehash.
  const ok = p.trim() === s.trim();
  return { ok, needsRehash: ok };
}

// --- CONTROLE DE SESSÕES & AUTENTICAÇÃO ---
// Sessoes ficam num Map em memoria (caminho rapido, sem hit no banco por
// requisicao) MAS sao persistidas na tabela user_sessions do Postgres para
// sobreviver a restart do container. No boot, carregamos as sessoes validas
// do banco de volta pro Map -- assim um redeploy NAO desloga todo mundo.
//
// Cada sessao no Map: { email, role, createdAt, lastUsed } (epoch millis).
// TTL_MS  -- expira absoluta (contada a partir do createdAt).
// IDLE_MS -- expira ociosa (contada a partir do lastUsed).
const ACTIVE_SESSIONS = new Map();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;   // 8 horas
const SESSION_IDLE_MS = 2 * 60 * 60 * 1000;  // 2 horas ocioso

// Recarrega sessoes validas do banco pro Map no boot. Chamado apos initPostgresDB.
async function loadSessionsFromDB() {
  try {
    const now = Date.now();
    const { rows } = await pool.query('SELECT token, email, role, created_at, last_used FROM user_sessions');
    let loaded = 0;
    for (const r of rows) {
      const createdAt = Number(r.created_at);
      const lastUsed = Number(r.last_used);
      if (now - createdAt > SESSION_TTL_MS || now - lastUsed > SESSION_IDLE_MS) {
        // Expirada -- apaga do banco.
        pool.query('DELETE FROM user_sessions WHERE token = $1', [r.token]).catch(() => {});
        continue;
      }
      ACTIVE_SESSIONS.set(r.token, { email: r.email, role: r.role, createdAt, lastUsed });
      loaded++;
    }
    console.log(`[Sessions] ${loaded} sessao(oes) recarregada(s) do banco apos boot.`);
  } catch (e) {
    console.error('[Sessions] Falha ao carregar sessoes do banco:', e.message);
  }
}

function createSession(user) {
  const token = crypto.randomUUID();
  const now = Date.now();
  ACTIVE_SESSIONS.set(token, {
    email: user.email,
    role: user.role,
    createdAt: now,
    lastUsed: now,
  });
  // Persiste no banco (fire-and-forget -- nao bloqueia o login).
  pool.query(
    `INSERT INTO user_sessions (token, email, role, created_at, last_used)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (token) DO UPDATE SET last_used = EXCLUDED.last_used`,
    [token, user.email, user.role, now, now]
  ).catch(e => console.error('[Sessions] Falha ao persistir sessao:', e.message));
  return token;
}

function destroySession(token) {
  ACTIVE_SESSIONS.delete(token);
  pool.query('DELETE FROM user_sessions WHERE token = $1', [token]).catch(() => {});
}

// Purga sessoes expiradas periodicamente (Map + banco) e faz flush do
// last_used das sessoes vivas pro banco (para o idle timeout sobreviver
// a restart com precisao de ~15min, sem escrita por requisicao).
setInterval(() => {
  const now = Date.now();
  for (const [token, s] of ACTIVE_SESSIONS) {
    if (now - s.createdAt > SESSION_TTL_MS || now - s.lastUsed > SESSION_IDLE_MS) {
      destroySession(token);
    } else {
      pool.query('UPDATE user_sessions SET last_used = $1 WHERE token = $2', [s.lastUsed, token]).catch(() => {});
    }
  }
  // Limpeza de linhas orfas expiradas que porventura nao estejam no Map.
  pool.query('DELETE FROM user_sessions WHERE created_at < $1 OR last_used < $2',
    [now - SESSION_TTL_MS, now - SESSION_IDLE_MS]).catch(() => {});
}, 15 * 60 * 1000).unref();

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Acesso não autorizado. Por favor, faça login no sistema.' });
  }

  const session = ACTIVE_SESSIONS.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Sessão inválida. Faça login novamente.' });
  }

  const now = Date.now();
  if (now - session.createdAt > SESSION_TTL_MS || now - session.lastUsed > SESSION_IDLE_MS) {
    destroySession(token);
    return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
  }

  session.lastUsed = now;
  req.user = session;
  req.sessionToken = token;
  return next();
}

// Guard para rotas administrativas: exige token E role superadmin.
function requireSuperadmin(req, res, next) {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Acesso restrito a superadmin.' });
  }
  return next();
}

// Rotas admin (fix-roles, force-role, users CRUD) -> server/routes/admin.js
app.use('/api/admin', createAdminRouter({ pool, authenticateToken, requireSuperadmin, hashPassword }));

// Proxy generico de banco (/api/db) -> server/routes/db.js (com blindagem SQLi)
app.use('/api/db', createDbRouter({ pool, authenticateToken, processBase64Fields, convertPlaceholders, sendRealtimeUpdate }));

// Rotas do agente RMM (/api/agent/sync, /api/agent/ping) -> server/routes/agent.js
app.use('/api/agent', createAgentRouter({ pool, readDBTable, convertPlaceholders, sendRealtimeUpdate, authenticateToken }));

// Endpoint /api/remote-control (TightVNC) removido — acesso remoto migrado para RustDesk,
// disparado pelo próprio navegador via `rustdesk://<id>` (ver RmmStatusModal.tsx).



// Serve os arquivos estáticos do build do React com suporte explícito a UTF-8 nos cabeçalhos HTTP
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.css') || filePath.endsWith('.html') || filePath.endsWith('.json')) {
      const contentType = res.getHeader('Content-Type');
      if (contentType && !contentType.includes('charset')) {
        res.setHeader('Content-Type', contentType + '; charset=utf-8');
      }
    }
  }
}));
// Serve o mesmo diretorio /uploads mais tarde no fluxo com nosniff (ja
// registrado em cima); mantido aqui para evitar 404 em caminhos duplicados.
app.use('/uploads', express.static(path.join(DATA_DIR, 'uploads'), {
  setHeaders: (res) => { res.setHeader('X-Content-Type-Options', 'nosniff'); },
}));

// Rotas utilitarias (/health, /api/monitcall) -> server/routes/misc.js
app.use(createMiscRouter({ authenticateToken }));

// Upload de imagens -> server/routes/upload.js
app.use('/api/upload', createUploadRouter({ authenticateToken, uploadsDir: UPLOADS_DIR }));

// --- INFRAESTRUTURA DE ATUALIZAÇÃO EM TEMPO REAL (SSE) ---
let clients = [];

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  clients.push(res);
  console.log(`[SSE] Novo cliente conectado. Total: ${clients.length}`);

  // Envia evento inicial para confirmar conexão ativa
  res.write(`data: ${JSON.stringify({ event: 'connected' })}\n\n`);

  req.on('close', () => {
    clients = clients.filter(client => client !== res);
    console.log(`[SSE] Cliente desconectado. Total: ${clients.length}`);
  });
});

function sendRealtimeUpdate(table) {
  const payload = JSON.stringify({ event: 'db-changed', table });
  console.log(`[SSE] Disparando atualização para ${clients.length} clientes. Tabela: ${table}`);
  clients.forEach(client => {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch (err) {
      console.error('[SSE] Erro de escrita em cliente desconectado:', err.message);
    }
  });
}

// Gestao de inventario + fluxo de vinculacao Mosyle -> server/routes/devices.js
// (bulk-stock, /api/mosyle/unlinked-macs, link-mosyle, bulk-delete, history, prepare)
app.use(createDevicesRouter({ pool, authenticateToken, requireSuperadmin, sendRealtimeUpdate }));

// API Local de Tutoriais (Sem Supabase) -> server/routes/tutorials.js
app.use('/api/tutorials', createTutorialsRouter({ authenticateToken, readTutorials, writeTutorials }));

// --- SETTINGS ENDPOINTS ---
// (rotas /api/admin/users movidas para server/routes/admin.js)

// Rotas de autenticacao (/api/auth/*) -> server/routes/auth.js
app.use('/api/auth', createAuthRouter({ pool, readDBTable, verifyPassword, hashPassword, createSession, destroySession, authenticateToken }));

// --- AI COPILOT ROUTE --- -> server/routes/ai.js
app.use('/api/ai', createAiRouter({ authenticateToken, readDBTable, openai }));



// Rota temporária de debug — restrita a superadmin autenticado. Considerar remover em breve.
app.get('/api/debug-emails', authenticateToken, requireSuperadmin, async (req, res) => {
    try {
        const result = await pool.query("SELECT id, user_name, user_email FROM assignments WHERE user_name ILIKE '%falk%'");
        res.json(result.rows);
    } catch (e) {
        res.json({ error: e.message });
    }
});

// --- VAULT API ROUTES ---
// --- Rota de Auditoria do Cofre ---
// Rotas do cofre (/api/vault/*) -> server/routes/vault.js
app.use('/api/vault', createVaultRouter({ pool, authenticateToken, encryptSecret, decryptSecret }));

// --- MOSYLE API INTEGRATION -> server/routes/mosyle.js + server/services/mosyle-sync.js ---
// runMosyleSync (service) e compartilhado entre a rota /api/mosyle/sync e o
// auto-sync horario (mais abaixo). Uma unica instancia.
const runMosyleSync = createMosyleSync({ pool, decryptSecret, sendRealtimeUpdate });
app.use('/api/mosyle', createMosyleRouter({ pool, authenticateToken, encryptSecret, decryptSecret, runMosyleSync }));

// Rota catch-all para o React SPA (todas as rotas vão para o index.html)
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
});

// ============================================================
// SYNC AUTOMATICO DO MOSYLE
// Roda a cada 1h em background. Se MOSYLE_ACCESS_TOKEN nao estiver
// configurado, runMosyleSync ja faz o warning e retorna sem erro,
// entao o interval fica sendo chamado inocuamente.
// ============================================================
const MOSYLE_AUTO_SYNC_MS = 60 * 60 * 1000; // 1 hora
const MOSYLE_FIRST_RUN_MS = 60 * 1000;      // primeira execucao 1 min apos boot

setTimeout(async () => {
  console.log('[Auto-Sync] Primeira execucao automatica do sync do Mosyle...');
  try { await runMosyleSync(); } catch (e) { console.error('[Auto-Sync] Falha na primeira execucao:', e.message); }
  setInterval(async () => {
    console.log('[Auto-Sync] Executando sync do Mosyle (intervalo horario)...');
    try { await runMosyleSync(); } catch (e) { console.error('[Auto-Sync] Falha:', e.message); }
  }, MOSYLE_AUTO_SYNC_MS).unref();
}, MOSYLE_FIRST_RUN_MS).unref?.();

export const serverReady = new Promise((resolve, reject) => {
  // Alterado para 0.0.0.0 para permitir acesso na rede local (LAN)
  const server = app.listen(PORT, '0.0.0.0');

  server.on('listening', () => {
    const actualPort = server.address().port;
    console.log(`[Server] Rodando na porta ${actualPort}`);
    global.expressServerPort = actualPort;
    resolve(actualPort);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Server] Porta ${PORT} já está ocupada.`);
      if (PORT !== 0 && PORT !== '0') {
        console.log(`[Server] Tentando alocar qualquer outra porta livre...`);
        server.listen(0, '0.0.0.0');
      } else {
        reject(err);
      }
    } else {
      console.error('[Server] Erro no servidor:', err);
      reject(err);
    }
  });
});
