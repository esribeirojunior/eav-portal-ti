import express from 'express';
import https from 'https';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { exec, execFile, spawn } from 'child_process';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { OAuth2Client } from 'google-auth-library';
import multer from 'multer';
import bcrypt from 'bcryptjs';

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

// Configuração do Multer para upload de imagens.
// Restricoes: apenas MIME de imagem, tamanho maximo 5MB, extensao gerada
// pelo servidor (nao usa a original), so autenticados podem chamar.
const ALLOWED_UPLOAD_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);
const MIME_TO_EXT = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const ext = MIME_TO_EXT[file.mimetype] || '.bin';
    cb(null, 'anexo-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_UPLOAD_MIMES.has(file.mimetype)) {
      return cb(new Error('Tipo de arquivo nao permitido'));
    }
    cb(null, true);
  }
});

app.post('/api/upload', authenticateToken, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const msg = err.message === 'Tipo de arquivo nao permitido'
        ? 'Apenas imagens PNG, JPG, WebP ou GIF sao permitidas.'
        : err.code === 'LIMIT_FILE_SIZE'
          ? 'Arquivo excede 5MB.'
          : 'Falha no upload.';
      return res.status(400).json({ error: msg });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });
});

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

initPostgresDB();

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
// Sessoes vivem em memoria. Reiniciar o container invalida todas.
// Cada sessao: { email, role, createdAt, lastUsed }.
// TTL_MS -- expira absoluta (contada a partir do createdAt).
// IDLE_MS -- expira ociosa (contada a partir do lastUsed).
const ACTIVE_SESSIONS = new Map();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;   // 8 horas
const SESSION_IDLE_MS = 2 * 60 * 60 * 1000;  // 2 horas ocioso

function createSession(user) {
  const token = crypto.randomUUID();
  const now = Date.now();
  ACTIVE_SESSIONS.set(token, {
    email: user.email,
    role: user.role,
    createdAt: now,
    lastUsed: now,
  });
  return token;
}

// Purga sessoes expiradas periodicamente para nao vazar memoria.
setInterval(() => {
  const now = Date.now();
  for (const [token, s] of ACTIVE_SESSIONS) {
    if (now - s.createdAt > SESSION_TTL_MS || now - s.lastUsed > SESSION_IDLE_MS) {
      ACTIVE_SESSIONS.delete(token);
    }
  }
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
    ACTIVE_SESSIONS.delete(token);
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

// Endpoint de Debug/Fix — restrito a superadmin autenticado.
app.get('/api/admin/fix-roles', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, role FROM authorized_users');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint Forçar Recriação da Coluna — restrito a superadmin autenticado.
app.get('/api/admin/force-role', authenticateToken, requireSuperadmin, async (req, res) => {
  try {
    await pool.query("ALTER TABLE authorized_users ADD COLUMN role TEXT DEFAULT 'admin'");
    res.json({ success: true, message: "Coluna criada com sucesso!" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Endpoint de Banco de Dados simulado
app.post('/api/db', authenticateToken, async (req, res) => {
  processBase64Fields(req.body);
  const { table, filters = {}, ilikeCol, ilikeVal, insertData, updateData, isDelete, isUpsert, orderCol, orderAsc, isSingle } = req.body;

  try {
    const isMutation = isDelete || updateData || insertData || isUpsert;
    if (isMutation) {
        const role = req.user ? req.user.role : 'viewer';
        
        // Privilege Escalation Prevention
        if (table === 'authorized_users' && role !== 'superadmin') {
            return res.status(403).json({ error: 'Acesso negado: Apenas Super Admins podem modificar contas de usuários.' });
        }
        
        // Protect Vault and Audit logs from generic modifications
        const readOnlyTables = ['audit_logs', 'vault_secrets', 'vault_projects'];
        if (readOnlyTables.includes(table)) {
            return res.status(403).json({ error: 'Operação não permitida via API genérica.' });
        }
        
        // Mass Delete Prevention
        if (isDelete && Object.keys(filters).length === 0) {
            return res.status(400).json({ error: 'Exclusão em massa bloqueada. Forneça um filtro.' });
        }
    }
    let whereClause = '';
    const params = [];
    const filterKeys = Object.keys(filters);
    
    if (filterKeys.length > 0) {
      const clauses = [];
      for (const k of filterKeys) {
        if (filters[k] === null) {
          clauses.push(`${k} IS NULL`);
        } else {
          clauses.push(`${k} = ?`);
          params.push(filters[k]);
        }
      }
      whereClause = 'WHERE ' + clauses.join(' AND ');
    }
    
    if (ilikeCol && ilikeVal) {
      whereClause += (whereClause ? ' AND ' : 'WHERE ') + `${ilikeCol} LIKE ?`;
      params.push(`%${ilikeVal.replace(/%/g, '')}%`);
    }

    if (isDelete) {
      const sql = convertPlaceholders(`DELETE FROM ${table} ${whereClause}`);
      await pool.query(sql, params);
      sendRealtimeUpdate(table);
      return res.json({ data: null, error: null });
    }

    if (updateData) {
      if (table === 'devices') {
        const tag = updateData.tag;
        const serial = updateData.serial_number;
        
        if (tag || serial) {
          // Descobre o ID do dispositivo sendo atualizado para não se validar contra si mesmo
          const selectSql = convertPlaceholders(`SELECT id FROM devices ${whereClause}`);
          const selectRes = await pool.query(selectSql, params);
          const currentId = selectRes.rows[0]?.id;

          const checks = [];
          const queryParams = [];
          let idx = 1;
          
          if (tag) {
            checks.push(`LOWER(tag) = LOWER($${idx++})`);
            queryParams.push(tag.trim());
          }
          if (serial) {
            checks.push(`(serial_number IS NOT NULL AND serial_number <> '' AND LOWER(serial_number) = LOWER($${idx++}))`);
            queryParams.push(serial.trim());
          }
          
          let checkSql = `SELECT id, tag, serial_number FROM devices WHERE (${checks.join(' OR ')})`;
          if (currentId) {
            checkSql += ` AND id <> $${idx++}`;
            queryParams.push(currentId);
          }
          
          const dupRes = await pool.query(checkSql, queryParams);
          if (dupRes.rows.length > 0) {
            const dup = dupRes.rows[0];
            const isTagDup = tag && dup.tag && dup.tag.toLowerCase() === tag.trim().toLowerCase();
            const field = isTagDup ? 'Nº de Patrimônio (Tag)' : 'Nº de Série (Service Tag)';
            const value = isTagDup ? dup.tag : dup.serial_number;
            return res.status(400).json({ 
              error: { 
                message: `Não é possível salvar. Já existe um dispositivo cadastrado com este ${field}: "${value}".` 
              } 
            });
          }
        }
      }

      const updateKeys = Object.keys(updateData);
      const setClause = updateKeys.map(k => `${k} = ?`).join(', ');
      const updateParams = updateKeys.map(k => updateData[k]);
      const sql = convertPlaceholders(`UPDATE ${table} SET ${setClause} ${whereClause}`);
      const updateRes = await pool.query(sql, [...updateParams, ...params]);
      
      // Se nenhuma linha for alterada, retornar erro para não falhar silenciosamente
      if (updateRes.rowCount === 0) {
        return res.status(404).json({ error: { message: `Nenhum registro encontrado para atualizar. Filtros: ${JSON.stringify(filters)}` } });
      }
      
      sendRealtimeUpdate(table);
      
      const selectSql = convertPlaceholders(`SELECT * FROM ${table} ${whereClause}`);
      const updatedData = await pool.query(selectSql, params);
      return res.json({ data: isSingle ? updatedData.rows[0] : updatedData.rows, error: null });
    }

    if (insertData) {
      const newItems = Array.isArray(insertData) ? insertData : [insertData];
      const results = [];
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const item of newItems) {
          const finalItem = { ...item };
          
          if (table === 'devices') {
            const itemTag = finalItem.tag ? finalItem.tag.trim() : null;
            const itemSerial = finalItem.serial_number ? finalItem.serial_number.trim() : null;
            
            let existingDevice = null;
            if (itemTag || itemSerial) {
              const checks = [];
              const checkParams = [];
              let idx = 1;
              const isPlaceholderTag = (t) => !t || t.toLowerCase() === 'n/a' || t.toLowerCase() === 'na' || t === '-' || t === '--';
              if (itemTag && !isPlaceholderTag(itemTag)) {
                checks.push(`LOWER(tag) = LOWER($${idx++})`);
                checkParams.push(itemTag);
              }
              if (itemSerial && !isPlaceholderTag(itemSerial)) {
                checks.push(`(serial_number IS NOT NULL AND serial_number <> '' AND LOWER(serial_number) = LOWER($${idx++}))`);
                checkParams.push(itemSerial);
              }
              
              if (checks.length > 0) {
                const checkSql = `SELECT * FROM devices WHERE ${checks.join(' OR ')}`;
                const dupRes = await client.query(checkSql, checkParams);
                if (dupRes.rows.length > 0) {
                  existingDevice = dupRes.rows[0];
                }
              }
            }
            
            if (existingDevice && !isUpsert) {
              // Bloqueia e retorna erro informando que o item já existe (somente para INSERTS normais)
              await client.query('ROLLBACK');
              client.release();
              
              const isTagDup = itemTag && existingDevice.tag && existingDevice.tag.toLowerCase() === itemTag.toLowerCase();
              const field = isTagDup ? 'Nº de Patrimônio (Tag)' : 'Nº de Série (Service Tag)';
              const value = isTagDup ? existingDevice.tag : existingDevice.serial_number;
              
              return res.status(400).json({
                error: {
                  message: `Já existe um dispositivo com este ${field}: "${value}".`
                }
              });
            }
            
            // Se for isUpsert e existir, garantimos que usamos o mesmo ID para atualizar
            if (existingDevice && isUpsert) {
                finalItem.id = existingDevice.id;
            }
          }
          
          if (!finalItem.id) finalItem.id = Math.random().toString(36).substring(2, 9);
          const tablesWithoutCreatedAt = ['department', 'shortcuts', 'audit_logs'];
          if (!finalItem.created_at && !isUpsert && !tablesWithoutCreatedAt.includes(table)) {
              finalItem.created_at = new Date().toISOString();
          }
          
          let conflictClause = '';
          if (isUpsert) {
             const updateCols = Object.keys(finalItem).filter(k => k !== 'id').map(k => `${k}=excluded.${k}`).join(', ');
             conflictClause = `ON CONFLICT(id) DO UPDATE SET ${updateCols}`;
          }
          
          const keys = Object.keys(finalItem);
          const placeholders = keys.map(() => '?').join(', ');
          const values = keys.map(k => finalItem[k]);
          
          const sql = convertPlaceholders(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) ${conflictClause}`);
          await client.query(sql, values);
          results.push(finalItem);
        }
        await client.query('COMMIT');
        client.release();
      } catch (err) {
        await client.query('ROLLBACK');
        client.release();
        console.error("Erro na query SQL:", err);
        return res.status(500).json({ error: { message: err.message } });
      }
      sendRealtimeUpdate(table);
      return res.json({ data: isSingle ? results[0] : results, error: null });
    }

    let orderClause = '';
    if (orderCol) {
       orderClause = `ORDER BY ${orderCol} ${orderAsc ? 'ASC' : 'DESC'}`;
    }
    
    const selectSql = convertPlaceholders(`SELECT * FROM ${table} ${whereClause} ${orderClause}`);
    const selectRes = await pool.query(selectSql, params);
    let result = selectRes.rows;

    if (table === 'devices') {
      const allAssignmentsRes = await pool.query('SELECT * FROM assignments');
      const allDepartmentsRes = await pool.query('SELECT * FROM department');
      const allMaintenanceRes = await pool.query('SELECT * FROM maintenance_logs');
      
      const allAssignments = allAssignmentsRes.rows;
      const allDepartments = allDepartmentsRes.rows;
      const allMaintenance = allMaintenanceRes.rows;
      
      result = result.map(dev => {
        const devAssigns = allAssignments
          .filter(a => String(a.device_id) === String(dev.id))
          .map(a => {
            const dept = allDepartments.find(d => String(d.id) === String(a.department_id));
            return { ...a, department: dept ? { name: dept.name } : null };
          });
          
        const devMaintenance = allMaintenance.filter(m => String(m.device_id) === String(dev.id));
        
        return { ...dev, assignments: devAssigns, maintenance_logs: devMaintenance };
      });
    }

    if (table === 'authorized_users') {
      // Retorna as informações seguras do usuário, incluindo o cargo (role) e excluindo a senha (password)
      result = result.map(u => ({ id: u.id, email: u.email, role: u.role, modules: u.modules, created_at: u.created_at }));
    }

    return res.json({ data: isSingle ? (result[0] || null) : result, error: null });
  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
});


// Endpoint para sincronização do Agente RMM (Monitoramento Local)
app.post('/api/agent/sync', async (req, res) => {
  // Token do agente lido do env var AGENT_SYNC_TOKEN (configurar no Coolify).
  // Fail-closed: se a env nao estiver definida, todo sync e rejeitado.
  const expectedToken = process.env.AGENT_SYNC_TOKEN;
  if (!expectedToken) {
    console.error('[SECURITY] AGENT_SYNC_TOKEN nao configurado no servidor.');
    return res.status(503).json({ error: 'Agent authentication not configured on server' });
  }
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${expectedToken}`) {
    console.warn('[SECURITY] Tentativa de sync bloqueada por token inválido:', req.ip);
    return res.status(401).json({ error: 'Unauthorized: Invalid Agent Token' });
  }

  const {
    hostname,
    username,
    os,
    cpu,
    ram_gb,
    disk_total_gb,
    disk_free_gb,
    serial_number,
    model,
    manufacturer,
    mac_address,
    ip_address,
    uptime_days,
    wifi_ssid,
    battery_health,
    monitors,
    campus,
    rustdesk_id
  } = req.body;

  if (!serial_number && !hostname) {
    return res.status(400).json({ error: 'Serial Number ou Hostname é obrigatório.' });
  }

  try {
    const devices = await readDBTable('devices');
    const existingIndex = devices.findIndex(d => 
      (d.serial_number && d.serial_number.toLowerCase() === (serial_number || '').toLowerCase()) ||
      (d.tag && d.tag.toLowerCase() === `EAV-${(serial_number || '').toUpperCase()}`)
    );

    let technicalInfo = `Hostname: ${hostname} | Sistema: ${os} | Processador: ${cpu} | RAM: ${ram_gb}GB | HD: ${disk_total_gb}GB (${disk_free_gb}GB Livre) | Usuário Logado: ${username} | MAC: ${mac_address} | IP: ${ip_address || 'N/A'}`;
    
    if (uptime_days !== undefined) technicalInfo += ` | Uptime: ${uptime_days} dias`;
    if (wifi_ssid !== undefined) technicalInfo += ` | Wi-Fi: ${wifi_ssid}`;
    if (battery_health !== undefined) technicalInfo += ` | Bateria: ${battery_health}`;
    if (monitors !== undefined) technicalInfo += ` | Monitores: ${monitors}`;
    if (rustdesk_id) technicalInfo += ` | RustDesk ID: ${rustdesk_id}`;

    let targetDevice;
    let actionStr;

    if (existingIndex >= 0) {
      // Atualiza o dispositivo existente
      const sql = convertPlaceholders('UPDATE devices SET status=?, model=?, condition=?, last_seen=?, hostname=?, ip_address=?, mac_address=?, ram_gb=?, cpu_model=?, os_version=? WHERE id=?');
      await pool.query(sql, [
        'Em Uso', 
        model || devices[existingIndex].model, 
        technicalInfo, 
        new Date().toISOString(), 
        hostname || '',
        ip_address || '',
        mac_address || '',
        Math.round(ram_gb || 0),
        cpu || '',
        os || '',
        devices[existingIndex].id
      ]);
      targetDevice = { 
        ...devices[existingIndex], 
        status: 'Em Uso', 
        model: model || devices[existingIndex].model, 
        condition: technicalInfo, 
        last_seen: new Date().toISOString(),
        hostname: hostname || '',
        ip_address: ip_address || '',
        mac_address: mac_address || '',
        ram_gb: Math.round(ram_gb || 0),
        cpu_model: cpu || '',
        os_version: os || ''
      };
      actionStr = 'updated';
    } else {
      // Cadastra um novo dispositivo
      const newDevice = {
        id: Math.random().toString(36).substring(2, 9),
        tag: `EAV-${(serial_number || hostname).toUpperCase()}`,
        serial_number: serial_number || 'DESCONHECIDO',
        model: `${manufacturer || ''} ${model || 'Desktop'}`.trim(),
        type: 'Computador',
        status: 'Em Uso',
        condition: technicalInfo,
        last_seen: new Date().toISOString(),
        created_at: new Date().toISOString(),
        hostname: hostname || '',
        ip_address: ip_address || '',
        mac_address: mac_address || '',
        ram_gb: Math.round(ram_gb || 0),
        cpu_model: cpu || '',
        os_version: os || '',
        is_accessory: false
      };
      
      const keys = Object.keys(newDevice);
      const placeholders = keys.map(() => '?').join(', ');
      const sql = convertPlaceholders(`INSERT INTO devices (${keys.join(', ')}) VALUES (${placeholders})`);
      await pool.query(sql, keys.map(k => newDevice[k]));
      targetDevice = newDevice;
      actionStr = 'created';
    }
    
    sendRealtimeUpdate('devices');

    return res.json({ success: true, action: actionStr, device: targetDevice });
  } catch (err) {
    console.error('[Agent Sync] Erro:', err);
    return res.status(500).json({ error: 'Erro no servidor: ' + err.message });
  }
});

// Endpoint de Ping do RMM
// Aceita apenas hostname/IP com caracteres seguros; usa execFile (nao passa por shell)
// para eliminar command injection (payloads tipo "127.0.0.1 & calc.exe").
const HOST_REGEX = /^[a-zA-Z0-9.\-:]+$/;
app.post('/api/agent/ping', authenticateToken, (req, res) => {
  const { hostname, ip } = req.body;
  if (!hostname && !ip) return res.status(400).json({ error: 'Hostname ou IP necessário para o Ping.' });

  // Dá prioridade para o IP se disponível (evita falha de resolução DNS)
  const targetHost = ip || hostname;

  if (typeof targetHost !== 'string' || targetHost.length > 253 || !HOST_REGEX.test(targetHost)) {
    return res.status(400).json({ error: 'Hostname/IP inválido.' });
  }

  console.log(`[Ping] Disparando ping na rede para: ${targetHost}...`);

  // Suporte multiplataforma: Windows usa -n e -w(ms), Linux usa -c e -W(s)
  const isWin = process.platform === 'win32';
  const pingArgs = isWin ? ['-n', '1', '-w', '2000', targetHost] : ['-c', '1', '-W', '2', targetHost];

  execFile('ping', pingArgs, { timeout: 5000, windowsHide: true }, (error, stdout, stderr) => {
    if (error) {
      console.log(`[Ping] Falha: Host ${targetHost} não alcançável.`);
      return res.json({ online: false, error: 'Host inalcançável', output: stdout || stderr });
    }

    // Tentar extrair o tempo do ping "tempo=XXms", "time=XXms" ou "time=XX ms"
    let timeMatch = stdout.match(/tempo[=<](\d+)\s*ms/i) || stdout.match(/time[=<](\d+)\s*ms/i);
    let ms = timeMatch ? timeMatch[1] : '?';

    console.log(`[Ping] Sucesso: Host ${targetHost} online (${ms}ms)`);
    return res.json({ online: true, time: ms, output: stdout });
  });
});

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

// Endpoint proxy para a Monitcall — autenticado; credenciais via env.
app.get('/api/monitcall', authenticateToken, (req, res) => {
  const target = req.query.target || 'ramais';
  const fila = req.query.fila || '1021';

  const username = process.env.MONITCALL_USER;
  const password = process.env.MONITCALL_PASSWORD;
  if (!username || !password) {
    return res.status(503).json({ error: 'Monitcall credentials not configured' });
  }
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');

  const monitcallPath = target === 'agentes'
    ? `/monitcall/api/v1/buscarEstadoDosAgentes.php?fila=${fila}`
    : '/monitcall/api/v1/buscarEstadoDosRamais.php';

  console.log(`[Proxy] GET https://escolaamericana.monitcall.com${monitcallPath}`);

  const options = {
    hostname: 'escolaamericana.monitcall.com',
    path: monitcallPath,
    method: 'GET',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Accept': 'application/json'
    },
    rejectUnauthorized: false // Aceita o certificado auto-assinado da Monitcall
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let body = '';
    proxyRes.on('data', (chunk) => body += chunk);
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

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

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

// ============================================================
// GESTAO DE ESTOQUE DE DISPOSITIVOS
// Fluxo:
//   1. POST /api/devices/bulk-stock  -> cadastra N unidades em "Estoque - Lacrado"
//                                        gera tags sequenciais EAV-0001, EAV-0002...
//                                        serial_number vazio (preenchido ao abrir a caixa)
//   2. PATCH /api/devices/:id/prepare -> muda status para "Disponível" + preenche
//                                        serial, modelo, etc. (caixa foi aberta e preparada)
// ============================================================

// Retorna o proximo numero sequencial para tags EAV-NNNN. Faz SELECT MAX
// filtrando somente tags no formato EAV- seguido de digitos, extrai o
// numero e incrementa. Comeca em 1 se nao existir nenhuma.
async function getNextTagNumber() {
  const { rows } = await pool.query(`
    SELECT MAX(CAST(SUBSTRING(tag FROM 5) AS INTEGER)) AS max_num
    FROM devices
    WHERE tag ~ '^EAV-[0-9]+$'
  `);
  const current = rows[0].max_num || 0;
  return current + 1;
}

function formatTag(n) {
  return 'EAV-' + String(n).padStart(4, '0');
}

// Cadastra N unidades novas em estoque lacrado. Payload:
//   { quantity: 5, type: 'MacBook', supplier: 'Apple Reseller', invoice_number: 'NF-1234',
//     purchase_date: '2026-07-20', warranty_expiry: '2027-07-20', unit_cost: 8500, notes: '...' }
app.post('/api/devices/bulk-stock', authenticateToken, async (req, res) => {
  const {
    quantity,
    type,
    supplier,
    invoice_number,
    purchase_date,
    warranty_expiry,
    unit_cost,
    is_accessory,
    notes,
  } = req.body;

  const qty = parseInt(quantity, 10);
  if (!qty || qty < 1 || qty > 500) {
    return res.status(400).json({ error: 'Quantidade deve ser entre 1 e 500.' });
  }
  if (!type || typeof type !== 'string' || type.length > 60) {
    return res.status(400).json({ error: 'Tipo obrigatório.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock advisory pra evitar race entre dois bulk-stocks concorrentes gerando tags iguais.
    await client.query('SELECT pg_advisory_xact_lock(4711)');

    const { rows: mrows } = await client.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(tag FROM 5) AS INTEGER)), 0) AS max_num
      FROM devices
      WHERE tag ~ '^EAV-[0-9]+$'
    `);
    let nextNum = (mrows[0].max_num || 0) + 1;

    const now = new Date().toISOString();
    const created = [];

    for (let i = 0; i < qty; i++) {
      const tag = formatTag(nextNum + i);
      const id = crypto.randomBytes(4).toString('hex');
      // condition guarda notas do lote (nota fiscal, fornecedor) pra referencia rapida.
      const conditionNote = [
        notes ? `Notas: ${notes}` : null,
        supplier ? `Fornecedor: ${supplier}` : null,
        invoice_number ? `NF: ${invoice_number}` : null,
        unit_cost ? `Custo unit: R$ ${unit_cost}` : null,
      ].filter(Boolean).join(' | ') || 'Cadastrado como estoque novo.';

      await client.query(
        `INSERT INTO devices (
          id, tag, serial_number, model, type, status, condition, created_at,
          is_accessory, invoice_number, supplier, purchase_date, warranty_expiry
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          id, tag, null, null, type, 'Estoque - Lacrado', conditionNote, now,
          !!is_accessory, invoice_number || null, supplier || null,
          purchase_date || null, warranty_expiry || null,
        ]
      );
      created.push({ id, tag });
    }

    await client.query(
      `INSERT INTO audit_logs (id, user_email, action, details, resource_type, resource_id, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        crypto.randomBytes(4).toString('hex'),
        req.user.email,
        'STOCK_BULK_CREATE',
        `Cadastro em lote: ${qty}x ${type}. Tags ${created[0].tag} a ${created[created.length - 1].tag}.`,
        'DEVICE',
        created.map(c => c.id).join(','),
        now,
      ]
    );

    await client.query('COMMIT');
    sendRealtimeUpdate('devices');
    res.json({ success: true, count: created.length, devices: created });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[bulk-stock] Erro:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Lista macs do Mosyle que ainda estao vinculados a devices SEM tag EAV-XXXX.
// Sao candidatos para "vincular" a um EAV-XXXX lacrado. Cada item traz o
// serial, nome amigavel do mac no Mosyle, usuario atual (se houver) e o
// id do device antigo no banco (para consolidar depois).
app.get('/api/mosyle/unlinked-macs', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        md.id            AS mosyle_id,
        md.serial_number AS serial_number,
        md.device_name   AS device_name,
        md.model         AS model,
        md.os            AS os,
        md.raw_data      AS raw_data,
        d.id             AS existing_device_id,
        d.tag            AS existing_tag,
        d.status         AS existing_status
      FROM mosyle_devices md
      LEFT JOIN devices d
        ON LOWER(d.serial_number) = LOWER(md.serial_number)
      WHERE md.serial_number IS NOT NULL
        AND md.serial_number <> ''
        AND (d.tag IS NULL OR d.tag NOT LIKE 'EAV-%')
      ORDER BY md.device_name ASC
    `);

    const items = rows.map(r => {
      let userInfo = null;
      try {
        const raw = r.raw_data ? JSON.parse(r.raw_data) : null;
        if (raw) {
          const name = raw.username || null;
          const email = raw.useremail || null;
          if (name || email) userInfo = { name, email };
        }
      } catch {}
      return {
        mosyle_id: r.mosyle_id,
        serial_number: r.serial_number,
        device_name: r.device_name,
        model: r.model,
        os: r.os,
        existing_device_id: r.existing_device_id,
        existing_tag: r.existing_tag,
        existing_status: r.existing_status,
        user: userInfo,
      };
    });
    res.json({ items });
  } catch (err) {
    console.error('[unlinked-macs] Erro:', err);
    res.status(500).json({ error: err.message });
  }
});

// Vincula um dispositivo EAV-XXXX (em Estoque - Lacrado) a um mac do Mosyle.
// Body: { mosyle_id, notes? }
//
// O que faz em uma transacao:
//   1. Confirma que o EAV esta em Estoque - Lacrado.
//   2. Busca o mac no mosyle_devices; extrai serial + usuario atual do Mosyle.
//   3. Se existir um device antigo com o mesmo serial e tag != EAV-, move
//      assignments daquele device pro EAV e apaga o duplicado.
//   4. UPDATE devices SET serial, model, type, supplier='Mosyle',
//      status = 'Em Uso' se ha usuario, senao 'Disponivel'.
//   5. Se ha usuario do Mosyle, cria/renova assignment.
//   6. Grava audit_log LINK_MOSYLE.
//
// TODO (fase B): chamar API do Mosyle (Update Device Attributes) para gravar
// asset_tag = EAV-XXXX no device do Mosyle, deixando o vinculo visivel nos
// dois lados. Endpoint exato precisa ser confirmado com a documentacao.
app.post('/api/devices/:id/link-mosyle', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { mosyle_id, notes } = req.body || {};
  if (!mosyle_id) return res.status(400).json({ error: 'mosyle_id é obrigatório.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const eavRes = await client.query('SELECT * FROM devices WHERE id = $1', [id]);
    if (eavRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Dispositivo EAV não encontrado.' });
    }
    const eavDevice = eavRes.rows[0];
    if (eavDevice.status !== 'Estoque - Lacrado') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: `Só é possível vincular dispositivos em Estoque - Lacrado. Estado atual: ${eavDevice.status}.` });
    }

    const mosyleRes = await client.query('SELECT * FROM mosyle_devices WHERE id = $1', [mosyle_id]);
    if (mosyleRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Mac do Mosyle não encontrado.' });
    }
    const mosyleDev = mosyleRes.rows[0];
    if (!mosyleDev.serial_number) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Mac do Mosyle sem serial number; não é possível vincular.' });
    }

    // Extrai user do raw_data
    let username = null, useremail = null, usertype = null;
    try {
      const raw = mosyleDev.raw_data ? JSON.parse(mosyleDev.raw_data) : null;
      if (raw) {
        username = raw.username || null;
        useremail = raw.useremail || null;
        usertype = raw.usertype || null;
      }
    } catch {}

    // Consolida device antigo (criado automaticamente pelo sync anterior) se
    // ele existir com o mesmo serial e tag != EAV-.
    const oldDupRes = await client.query(
      `SELECT id, tag FROM devices
       WHERE LOWER(serial_number) = LOWER($1)
         AND id <> $2
         AND (tag IS NULL OR tag NOT LIKE 'EAV-%')`,
      [mosyleDev.serial_number, id]
    );
    let mergedFrom = null;
    if (oldDupRes.rows.length > 0) {
      const oldDevice = oldDupRes.rows[0];
      mergedFrom = { id: oldDevice.id, tag: oldDevice.tag };
      // Move assignments do antigo para o EAV
      await client.query('UPDATE assignments SET device_id = $1 WHERE device_id = $2', [id, oldDevice.id]);
      // Move maintenance_logs
      await client.query('UPDATE maintenance_logs SET device_id = $1 WHERE device_id = $2', [id, oldDevice.id]);
      // Apaga o antigo
      await client.query('DELETE FROM devices WHERE id = $1', [oldDevice.id]);
    }

    // Determina novo status
    const mUser = username || useremail;
    const newStatus = mUser ? 'Em Uso' : 'Disponível';
    const now = new Date().toISOString();
    const modelToUse = mosyleDev.model || eavDevice.model;
    const typeToUse = mosyleDev.os === 'mac' ? 'MacBook' : (mosyleDev.os === 'ios' ? 'iPad' : (eavDevice.type || 'MacBook'));

    // Atualiza o EAV com dados do Mosyle
    await client.query(
      `UPDATE devices SET
         serial_number = $1,
         model = $2,
         type = $3,
         status = $4,
         supplier = $5,
         last_seen = $6,
         condition = COALESCE($7, condition)
       WHERE id = $8`,
      [mosyleDev.serial_number, modelToUse, typeToUse, newStatus, 'Mosyle', now,
       notes ? (eavDevice.condition ? eavDevice.condition + ' | ' + notes : notes) : null,
       id]
    );

    // Cria assignment se ha usuario do Mosyle
    if (mUser) {
      let mRole = usertype || 'Colaborador';
      if (mRole === 'Student') mRole = 'Aluno';
      else if (mRole === 'Teacher') mRole = 'Professor';
      else if (mRole === 'Staff' || mRole === 'Administrator') mRole = 'Colaborador';

      // Verifica se ja tem um assignment ativo (herdado do merge acima)
      const activeRes = await client.query('SELECT id FROM assignments WHERE device_id = $1 AND returned_at IS NULL', [id]);
      if (activeRes.rows.length === 0) {
        await client.query(
          'INSERT INTO assignments (id, device_id, user_name, user_email, user_role, assigned_at, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [crypto.randomBytes(4).toString('hex'), id, username || useremail || 'Desconhecido', useremail || '', mRole, now, now]
        );
      }
    }

    // Audit
    await client.query(
      `INSERT INTO audit_logs (id, user_email, action, details, resource_type, resource_id, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        crypto.randomBytes(4).toString('hex'),
        req.user.email,
        'LINK_MOSYLE',
        `${eavDevice.tag} vinculado ao Mosyle serial=${mosyleDev.serial_number} usuario=${username || useremail || '(nenhum)'}${mergedFrom ? ` (consolidado com device antigo tag=${mergedFrom.tag})` : ''}`,
        'DEVICE',
        id,
        now,
      ]
    );

    await client.query('COMMIT');
    sendRealtimeUpdate('devices');
    res.json({
      success: true,
      tag: eavDevice.tag,
      serial_number: mosyleDev.serial_number,
      new_status: newStatus,
      merged_from: mergedFrom,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[link-mosyle] Erro:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Transita um dispositivo lacrado para preparado (Disponível). Aceita
// preencher serial, modelo detalhado, cor, etc. Body opcional -- se vier
// vazio, apenas muda o status.
app.patch('/api/devices/:id/prepare', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    serial_number,
    model,
    condition,
    ram_gb,
    cpu_model,
    os_version,
    hostname,
  } = req.body || {};

  try {
    const { rows } = await pool.query('SELECT * FROM devices WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Dispositivo não encontrado.' });
    const device = rows[0];
    if (device.status !== 'Estoque - Lacrado') {
      return res.status(409).json({
        error: `Só é possível preparar dispositivos em Estoque - Lacrado. Estado atual: ${device.status}.`
      });
    }

    // Se veio serial e ele ja existe em outro device, aborta.
    if (serial_number) {
      const dup = await pool.query(
        'SELECT id FROM devices WHERE LOWER(serial_number) = LOWER($1) AND id <> $2',
        [serial_number, id]
      );
      if (dup.rows.length > 0) {
        return res.status(409).json({ error: 'Já existe outro dispositivo com esse serial number.' });
      }
    }

    const now = new Date().toISOString();
    await pool.query(
      `UPDATE devices SET
        status = $1,
        serial_number = COALESCE($2, serial_number),
        model = COALESCE($3, model),
        condition = COALESCE($4, condition),
        ram_gb = COALESCE($5, ram_gb),
        cpu_model = COALESCE($6, cpu_model),
        os_version = COALESCE($7, os_version),
        hostname = COALESCE($8, hostname),
        last_seen = $9
       WHERE id = $10`,
      ['Disponível', serial_number || null, model || null, condition || null,
       ram_gb ? Math.round(ram_gb) : null, cpu_model || null, os_version || null,
       hostname || null, now, id]
    );

    await pool.query(
      `INSERT INTO audit_logs (id, user_email, action, details, resource_type, resource_id, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [crypto.randomBytes(4).toString('hex'), req.user.email, 'STOCK_PREPARE',
       `${device.tag} preparado. Serial: ${serial_number || '(vazio)'} Modelo: ${model || '(vazio)'}`,
       'DEVICE', id, now]
    );

    sendRealtimeUpdate('devices');
    res.json({ success: true });
  } catch (err) {
    console.error('[prepare] Erro:', err);
    res.status(500).json({ error: err.message });
  }
});

// API Local de Tutoriais (Sem Supabase)
app.get('/api/tutorials', (req, res) => {
  const tutorials = readTutorials();
  // Ordena por data decrescente (mais novo primeiro)
  tutorials.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(tutorials);
});

app.post('/api/tutorials', authenticateToken, (req, res) => {
  const tutorials = readTutorials();
  const newTutorial = {
    ...req.body,
    id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    created_at: new Date().toISOString()
  };
  tutorials.push(newTutorial);
  writeTutorials(tutorials);
  res.status(201).json(newTutorial);
});

app.put('/api/tutorials/:id', authenticateToken, (req, res) => {
  const tutorials = readTutorials();
  const index = tutorials.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Tutorial não encontrado' });
  
  tutorials[index] = { ...tutorials[index], ...req.body };
  writeTutorials(tutorials);
  res.json(tutorials[index]);
});

app.delete('/api/tutorials/:id', authenticateToken, (req, res) => {
  let tutorials = readTutorials();
  tutorials = tutorials.filter(t => t.id !== req.params.id);
  writeTutorials(tutorials);
  res.status(204).end();
});

// --- SETTINGS ENDPOINTS ---

app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, role, modules, created_at FROM authorized_users ORDER BY created_at DESC');
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email) return res.status(400).json({ error: 'Email obrigatorio' });
    const id = Math.random().toString(36).substring(2, 9);
    const pwd = password || 'eav@123';
    const pwdHash = await hashPassword(pwd);
    const userRole = role || 'admin';
    const defaultModules = '["assets","links","audit","tasks","vault","tutorials","lab"]';

    const check = await pool.query('SELECT * FROM authorized_users WHERE email = $1', [email]);
    if (check.rows.length > 0) return res.status(400).json({ error: 'Usuario ja existe' });

    await pool.query(
      "INSERT INTO authorized_users (id, email, password, role, modules, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, email, pwdHash, userRole, defaultModules, new Date().toISOString()]
    );
    res.json({ data: { id, email, role: userRole, modules: defaultModules } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM authorized_users WHERE id = $1', [req.params.id]);
    res.json({ data: 'ok' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint de Login Local Offline (Valida contra a aba authorized_users da planilha)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const users = await readDBTable('authorized_users');
    const user = users.find(u => String(u.email || '').toLowerCase().trim() === String(email).toLowerCase().trim());

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
        await pool.query('UPDATE authorized_users SET password = $1 WHERE id = $2', [newHash, user.id]);
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
        name: user.email.split('@')[0]
      },
      token: token
    });
  } catch (err) {
    console.error('Erro no login local:', err);
    return res.status(500).json({ error: 'Erro interno no servidor ao autenticar.' });
  }
});

// Logout: remove a sessao do lado do servidor. O cliente ja limpa o
// localStorage, mas se so limpar la, o token continua valido aqui ate
// expirar/servidor reiniciar. Isso resolve.
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  ACTIVE_SESSIONS.delete(req.sessionToken);
  return res.json({ success: true });
});

// Endpoint de Autenticação com Google Login (GSI)
const googleClient = new OAuth2Client();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '219719535721-26k832m63t27fpik9cionsnje45mp0du.apps.googleusercontent.com';

app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'Token de credencial do Google é obrigatório.' });
  }

  try {
    // Valida o ID Token enviado pelo Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const email = payload['email'];
    
    if (!email) {
      return res.status(401).json({ error: 'Não foi possível ler o e-mail da conta Google.' });
    }

    // Verifica se o e-mail está na lista de usuários autorizados no banco
    const users = await readDBTable('authorized_users');
    const user = users.find(u => String(u.email || '').toLowerCase().trim() === String(email).toLowerCase().trim());

    if (!user) {
      return res.status(401).json({ error: `O e-mail ${email} não está autorizado a acessar a Central de TI.` });
    }

    console.log(`[Auth Google] Login bem-sucedido para: ${email}`);
    const token = createSession(user);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        modules: user.modules,
        name: payload['name'] || user.email.split('@')[0]
      },
      token: token
    });
  } catch (err) {
    console.error('Erro na autenticação do Google:', err);
    return res.status(401).json({ error: 'Autenticação do Google falhou.' });
  }
});

// --- AI COPILOT ROUTE ---
app.post('/api/ai/chat', authenticateToken, async (req, res) => {
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
    } catch(e) { console.error('Erro lendo banco para IA', e); }

    const contextData = `
Contexto do Sistema EAV Equipamentos (Central de Gestão TI):
Temos ${devices.length} equipamentos cadastrados, ${assignments.length} empréstimos registrados e ${audit_logs.length} logs de auditoria.

Lista de Setores/Departamentos:
${JSON.stringify(departments.map(d => ({ ID: d.id, Nome: d.name })), null, 2)}

Resumo dos Equipamentos (Ativos):
${JSON.stringify(devices.map(d => {
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
  const activeAssign = assignments.find(a => String(a.device_id) === String(d.id) && !a.returned_at);
  const deviceCampus = activeAssign ? (activeAssign.campus || 'Desconhecido') : 'Desconhecido';
  const deviceDept = activeAssign ? activeAssign.department_id : null;
  return { ID: d.id, SN: d.serial_number || d.serialNumber, Hostname: hostname, IP: ip, Tipo: d.type, UsuarioAtivo: loggedUser, Campus: deviceCampus, Status: d.status, Model: d.model, Dept: deviceDept };
}), null, 2)}

Resumo dos Empréstimos Ativos:
${JSON.stringify(assignments.filter(a => !a.returned_at).map(a => ({ DeviceID: a.device_id, User: a.user_name, Campus: a.campus, Date: a.assigned_at })), null, 2)}

Últimos 30 Registros de Atividades (Auditoria / Histórico de quem fez o quê por último):
${JSON.stringify(audit_logs.slice(-30).map(a => ({ Acao: a.action, Device: a.device_id, Detalhes: a.details, Usuario: a.user_email, Data: a.timestamp })), null, 2)}

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
${history.map(h => `${h.role === 'user' ? 'Usuário' : 'Copilot'}: ${h.text}`).join('\n')}

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
      return res.status(429).json({ error: `Você atingiu o limite da OpenAI! Verifique os fundos da sua API Key.` });
    }

    return res.status(500).json({ error: 'Falha ao conectar com a IA: ' + errorMessage });
  }
});


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
app.post('/api/vault/audit', authenticateToken, async (req, res) => {
    try {
        const { action, secret_id, secret_name } = req.body;
        const id = crypto.randomUUID();
        const created_at = new Date().toISOString();
        const user_email = req.user ? req.user.email : 'unknown';
        const details = `Segredo: ${secret_name || secret_id}`;
        
        await pool.query(
            'INSERT INTO audit_logs (id, user_email, action, details, resource_type, resource_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [id, user_email, action, details, 'VAULT', secret_id, created_at]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/vault/projects', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM vault_projects ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/vault/projects', authenticateToken, async (req, res) => {
    if (req.user && req.user.role !== 'superadmin') return res.status(403).json({ error: 'Apenas Super Admins podem criar projetos.' });
    try {
        const { name } = req.body;
        const id = crypto.randomUUID();
        const created_at = new Date().toISOString();
        await pool.query('INSERT INTO vault_projects (id, name, created_at) VALUES ($1, $2, $3)', [id, name, created_at]);
        res.json({ id, name, created_at });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/vault/secrets', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, key_name as key, note, project_id, encrypted_value, created_at FROM vault_secrets ORDER BY key_name ASC');
        const secrets = result.rows.map(row => ({
            id: row.id,
            key: row.key,
            note: row.note,
            projectIds: row.project_id ? [row.project_id] : [],
            value: decryptSecret(row.encrypted_value) || 'ERRO_DESCRIPTOGRAFIA',
            created_at: row.created_at
        }));
        res.json(secrets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/vault/secrets', authenticateToken, async (req, res) => {
    if (req.user && req.user.role !== 'superadmin') return res.status(403).json({ error: 'Apenas Super Admins podem criar segredos.' });
    try {
        const { key, value, note, projectId } = req.body;
        const id = crypto.randomUUID();
        const encryptedValue = encryptSecret(value);
        const created_at = new Date().toISOString();
        
        await pool.query(
            'INSERT INTO vault_secrets (id, key_name, encrypted_value, note, project_id, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
            [id, key, encryptedValue, note, projectId, created_at]
        );
        res.json({ id, key, value, note, projectIds: [projectId] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/vault/secrets/:id', authenticateToken, async (req, res) => {
    if (req.user && req.user.role !== 'superadmin') return res.status(403).json({ error: 'Apenas Super Admins podem excluir segredos.' });
    try {
        await pool.query('DELETE FROM vault_secrets WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/vault/projects/:id', authenticateToken, async (req, res) => {
    if (req.user && req.user.role !== 'superadmin') return res.status(403).json({ error: 'Apenas Super Admins podem excluir projetos.' });
    try {
        await pool.query('DELETE FROM vault_secrets WHERE project_id = $1', [req.params.id]);
        await pool.query('DELETE FROM vault_projects WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- MOSYLE API INTEGRATION ---
app.post('/api/mosyle/config', authenticateToken, async (req, res) => {
    if (req.user && req.user.role !== 'superadmin') return res.status(403).json({ error: 'Apenas Super Admins podem configurar integrações.' });
    try {
        const { email, password, token } = req.body;
        // Salva de forma segura no banco de dados na tabela vault_secrets
        const configId = 'mosyle_config_id_static';
        const configValue = JSON.stringify({ email, password, token });
        const encryptedValue = encryptSecret(configValue);
        
        // Upsert logic (deleta se existir e insere)
        await pool.query('DELETE FROM vault_secrets WHERE key_name = $1', ['mosyle_api_config']);
        await pool.query(
            'INSERT INTO vault_secrets (id, key_name, encrypted_value, note, created_at) VALUES ($1, $2, $3, $4, $5)',
            [configId, 'mosyle_api_config', encryptedValue, 'Credenciais da API do Mosyle', new Date().toISOString()]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/mosyle/config', authenticateToken, async (req, res) => {
    if (req.user && req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acesso negado.' });
    try {
        const result = await pool.query('SELECT encrypted_value FROM vault_secrets WHERE key_name = $1', ['mosyle_api_config']);
        if (result.rows.length > 0) {
            const decrypted = decryptSecret(result.rows[0].encrypted_value);
            if (decrypted) {
                const config = JSON.parse(decrypted);
                // Return masked data for security
                return res.json({ 
                    configured: true, 
                    email: config.email, 
                    tokenPreview: config.token ? config.token.substring(0, 5) + '...' : ''
                });
            }
        }
        res.json({ configured: false });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/mosyle/deactivate', authenticateToken, async (req, res) => {
    if (req.user && req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acesso negado.' });
    try {
        await pool.query('DELETE FROM vault_secrets WHERE key_name = $1', ['mosyle_api_config']);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

function getFriendlyAppleModelName(identifier) {
    if (!identifier) return 'Desconhecido';
    const id = identifier.toString().trim().toUpperCase();
    
    const mapping = {
        // MacBooks Air
        'MACBOOKAIR8,1': 'MacBook Air (Retina, 13-inch, 2018)',
        'MACBOOKAIR8,2': 'MacBook Air (Retina, 13-inch, 2019)',
        'MACBOOKAIR9,1': 'MacBook Air (Retina, 13-inch, 2020)',
        'MACBOOKAIR10,1': 'MacBook Air (M1, 2020)',
        'MAC14,2': 'MacBook Air (13-inch, M2, 2022)',
        'MAC14,15': 'MacBook Air (15-inch, M2, 2023)',
        'MAC15,12': 'MacBook Air (13-inch, M3, 2024)',
        'MAC15,13': 'MacBook Air (15-inch, M3, 2024)',
        'MAC16,1': 'MacBook Air (13-inch, M4, 2025)',
        'MAC16,2': 'MacBook Air (15-inch, M4, 2025)',
        
        // MacBooks Pro
        'MACBOOKPRO15,1': 'MacBook Pro (15-inch, 2018)',
        'MACBOOKPRO15,2': 'MacBook Pro (13-inch, 2018/2019)',
        'MACBOOKPRO15,3': 'MacBook Pro (15-inch, 2019)',
        'MACBOOKPRO15,4': 'MacBook Pro (13-inch, 2019)',
        'MACBOOKPRO16,1': 'MacBook Pro (16-inch, 2019)',
        'MACBOOKPRO16,2': 'MacBook Pro (13-inch, 2020)',
        'MACBOOKPRO16,3': 'MacBook Pro (13-inch, 2020, 2 TB3)',
        'MACBOOKPRO16,4': 'MacBook Pro (16-inch, 2019)',
        'MACBOOKPRO17,1': 'MacBook Pro (13-inch, M1, 2020)',
        'MACBOOKPRO18,3': 'MacBook Pro (14-inch, M1 Pro, 2021)',
        'MACBOOKPRO18,4': 'MacBook Pro (14-inch, M1 Max, 2021)',
        'MACBOOKPRO18,1': 'MacBook Pro (16-inch, M1 Pro, 2021)',
        'MACBOOKPRO18,2': 'MacBook Pro (16-inch, M1 Max, 2021)',
        'MAC14,9': 'MacBook Pro (14-inch, M2 Pro, 2023)',
        'MAC14,5': 'MacBook Pro (14-inch, M2 Max, 2023)',
        'MAC14,10': 'MacBook Pro (16-inch, M2 Pro, 2023)',
        'MAC14,6': 'MacBook Pro (16-inch, M2 Max, 2023)',
        'MAC15,3': 'MacBook Pro (14-inch, M3, Nov 2023)',
        'MAC15,6': 'MacBook Pro (14-inch, M3 Pro, Nov 2023)',
        'MAC15,8': 'MacBook Pro (14-inch, M3 Max, Nov 2023)',
        'MAC15,7': 'MacBook Pro (16-inch, M3 Pro, Nov 2023)',
        'MAC15,9': 'MacBook Pro (16-inch, M3 Max, Nov 2023)',
        'MAC15,10': 'MacBook Pro (16-inch, M3 Max, Nov 2023)',
        'MAC15,11': 'MacBook Pro (16-inch, M3 Max, Nov 2023)',
        'MAC16,10': 'MacBook Pro (14-inch, M4, 2024)',
        'MAC16,6': 'MacBook Pro (14-inch, M4 Pro, 2024)',
        'MAC16,8': 'MacBook Pro (14-inch, M4 Max, 2024)',
        'MAC16,7': 'MacBook Pro (16-inch, M4 Pro, 2024)',
        'MAC16,5': 'MacBook Pro (16-inch, M4 Max, 2024)',

        // Macs Mini & Studio
        'MACMINI9,1': 'Mac mini (M1, 2020)',
        'MAC14,3': 'Mac mini (M2, 2023)',
        'MAC14,12': 'Mac mini (M2 Pro, 2023)',
        'MAC13,1': 'Mac Studio (M1 Max, 2022)',
        'MAC13,2': 'Mac Studio (M1 Ultra, 2022)',
        'MAC14,13': 'Mac Studio (M2 Max, 2023)',
        'MAC14,14': 'Mac Studio (M2 Ultra, 2023)',
        'MAC16,12': 'Mac mini (M4, 2024)',

        // iPads
        'IPAD8,11': 'iPad Pro (12.9-inch, 4th gen)',
        'IPAD8,12': 'iPad Pro (12.9-inch, 4th gen)',
        'IPAD13,8': 'iPad Pro (12.9-inch, 5th gen)',
        'IPAD13,9': 'iPad Pro (12.9-inch, 5th gen)',
        'IPAD13,10': 'iPad Pro (12.9-inch, 5th gen)',
        'IPAD13,11': 'iPad Pro (12.9-inch, 5th gen)',
        'IPAD14,5': 'iPad Pro (12.9-inch, 6th gen)',
        'IPAD14,6': 'iPad Pro (12.9-inch, 6th gen)',
        'IPAD13,4': 'iPad Pro (11-inch, 3rd gen)',
        'IPAD13,5': 'iPad Pro (11-inch, 3rd gen)',
        'IPAD13,6': 'iPad Pro (11-inch, 3rd gen)',
        'IPAD13,7': 'iPad Pro (11-inch, 3rd gen)',
        'IPAD14,3': 'iPad Pro (11-inch, 4th gen)',
        'IPAD14,4': 'iPad Pro (11-inch, 4th gen)',
        'IPAD11,3': 'iPad Air (3rd gen)',
        'IPAD11,4': 'iPad Air (3rd gen)',
        'IPAD13,1': 'iPad Air (4th gen)',
        'IPAD13,2': 'iPad Air (4th gen)',
        'IPAD13,16': 'iPad Air (5th gen)',
        'IPAD13,17': 'iPad Air (5th gen)',
        'IPAD14,8': 'iPad Air (11-inch, M2)',
        'IPAD14,9': 'iPad Air (11-inch, M2)',
        'IPAD14,10': 'iPad Air (13-inch, M2)',
        'IPAD14,11': 'iPad Air (13-inch, M2)',
        'IPAD11,1': 'iPad mini (5th gen)',
        'IPAD11,2': 'iPad mini (5th gen)',
        'IPAD14,1': 'iPad mini (6th gen)',
        'IPAD14,2': 'iPad mini (6th gen)',
        'IPAD7,11': 'iPad (7th gen)',
        'IPAD7,12': 'iPad (7th gen)',
        'IPAD11,6': 'iPad (8th gen)',
        'IPAD11,7': 'iPad (8th gen)',
        'IPAD12,1': 'iPad (9th gen)',
        'IPAD12,2': 'iPad (9th gen)',
        'IPAD13,18': 'iPad (10th gen)',
        'IPAD13,19': 'iPad (10th gen)'
    };
    
    return mapping[id] || identifier;
}

async function runMosyleSync(manualResponse = null) {
    try {
        let token = process.env.MOSYLE_ACCESS_TOKEN;
        let config = { email: '', password: '' };
        
        // Se não tiver variável de ambiente, tenta pegar do banco
        if (!token) {
            const result = await pool.query('SELECT encrypted_value FROM vault_secrets WHERE key_name = $1', ['mosyle_api_config']);
            if (result.rows.length === 0) {
                if (manualResponse) return manualResponse.status(400).json({ error: 'Token não configurado. Adicione no Environment Variables do Coolify ou pela interface.' });
                console.log('[Auto-Sync] Token do Mosyle não configurado no Cofre.');
                return;
            }
            
            const decrypted = decryptSecret(result.rows[0].encrypted_value);
            if (!decrypted) {
                if (manualResponse) return manualResponse.status(500).json({ error: 'Erro ao descriptografar credenciais do banco.' });
                console.error('[Auto-Sync] Erro ao descriptografar credenciais do banco.');
                return;
            }
            
            config = JSON.parse(decrypted);
            token = config.token ? config.token.trim() : null;
        } else {
            token = token.trim();
        }
        
        if (!token) {
            if (manualResponse) return manualResponse.status(400).json({ error: 'Token inválido ou vazio.' });
            console.error('[Auto-Sync] Token inválido ou vazio.');
            return;
        }
        
        const fetch = (await import('node-fetch')).default;
        
        // 1. Fazer o Login para pegar o JWT Bearer Token
        const loginResponse = await fetch('https://managerapi.mosyle.com/v2/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "accessToken": token,
                "email": config.email,
                "password": config.password
            })
        });

        if (!loginResponse.ok) {
            const errText = await loginResponse.text();
            if (manualResponse) return manualResponse.status(401).json({ error: 'Falha no login do Mosyle. Verifique o Email/Senha e o Token.', details: errText });
            console.error('[Auto-Sync] Falha no login do Mosyle:', errText);
            return;
        }

        const bearerHeader = loginResponse.headers.get('authorization');
        if (!bearerHeader) {
            if (manualResponse) return manualResponse.status(500).json({ error: 'Mosyle não retornou o JWT Bearer Token no cabeçalho.' });
            console.error('[Auto-Sync] Mosyle não retornou o JWT Bearer Token.');
            return;
        }
        
        // Listar MACs
        const mosyleEndpoint = 'https://managerapi.mosyle.com/v2/listdevices'; 
        
        const responseMac = await fetch(mosyleEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': bearerHeader
            },
            body: JSON.stringify({
                "accessToken": token,
                "operation": "list",
                "options": {
                    "os": "mac",
                    "page_size": 1000,
                    "specific_columns": ["deviceudid", "serial_number", "device_name", "device_model", "os", "osversion", "total_disk", "battery", "tags", "usertype", "userid", "username", "useremail", "CustomDeviceAttributes"]
                }
            })
        });

        // Listar iOS (iPads)
        const responseIos = await fetch(mosyleEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': bearerHeader
            },
            body: JSON.stringify({
                "accessToken": token,
                "operation": "list",
                "options": {
                    "os": "ios",
                    "page_size": 1000,
                    "specific_columns": ["deviceudid", "serial_number", "device_name", "device_model", "os", "osversion", "total_disk", "battery", "tags", "usertype", "userid", "username", "useremail", "CustomDeviceAttributes"]
                }
            })
        });
        
        let dataMac, dataIos;
        try {
            dataMac = await responseMac.json();
            dataIos = await responseIos.json();
        } catch(e) {
            if (manualResponse) return manualResponse.status(500).json({ error: `Erro ao ler resposta da API do Mosyle.` });
            console.error('[Auto-Sync] Erro ao ler resposta da API.');
            return;
        }
        
        if (!responseMac.ok || !responseIos.ok) {
            if (manualResponse) return manualResponse.status(500).json({ error: `Erro na API do Mosyle. Certifique-se de que o token é válido.` });
            console.error('[Auto-Sync] Erro na API do Mosyle.');
            return;
        }

        const allDevices = [
            ...(dataMac?.response?.devices || []),
            ...(dataIos?.response?.devices || [])
        ];

        // Mapear e salvar no banco de dados isolado (mosyle_devices)
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Apagamos a tabela atual de mosyle e inserimos a nova lista espelhada
            await client.query('DELETE FROM mosyle_devices');
            
            for (const dev of allDevices) {
                const id = Math.random().toString(36).substring(2, 9);
                const rawModel = dev.device_model || dev.Model || dev.MachineModel || dev.MachineName || 'Desconhecido';
                const modelStr = getFriendlyAppleModelName(rawModel);
                
                await client.query(
                    'INSERT INTO mosyle_devices (id, deviceudid, serial_number, device_name, os, model, total_disk, battery_level, raw_data, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                    [
                        id,
                        dev.deviceudid || '',
                        dev.serial_number || '',
                        dev.device_name || dev.LocalHostName || '',
                        dev.os || '',
                        modelStr,
                        dev.total_disk || '',
                        dev.battery_level || '',
                        JSON.stringify(dev),
                        new Date().toISOString()
                    ]
                );

                // ==========================================
                // AUTO-SYNC COM O INVENTÁRIO CENTRAL
                // ==========================================
                if (dev.serial_number) {
                    const sn = dev.serial_number;
                    // Padronizamos 'MacBook' (CamelCase) para bater com o enum DeviceType do frontend.
                    const typeStr = dev.os === 'mac' ? 'MacBook' : 'iPad';
                    const osVersion = dev.osversion || '';
                    const now = new Date().toISOString();

                    // 1. Atualizar ou Inserir em 'devices'
                    const deviceRes = await client.query('SELECT id, tag, supplier, status FROM devices WHERE serial_number = $1', [sn]);
                    let centralDeviceId;
                    const mUser = dev.username || dev.useremail;

                    if (deviceRes.rows.length > 0) {
                        centralDeviceId = deviceRes.rows[0].id;
                        const currentTag = deviceRes.rows[0].tag;
                        const currentSupplier = deviceRes.rows[0].supplier;
                        const currentStatus = deviceRes.rows[0].status;

                        // Preserva a tag existente se for EAV-XXXX (nao sobrescreve por 'Mosyle MDM').
                        const tagToUpdate = (currentTag && currentTag.trim() !== '') ? currentTag : 'Mosyle MDM';
                        const supplierToUpdate = (currentSupplier && currentSupplier.trim() !== '') ? currentSupplier : 'Mosyle';

                        // Se o device foi cadastrado como estoque lacrado, o sync NAO promove
                        // pra Em Uso automaticamente -- aguarda o admin vincular via
                        // POST /api/devices/:id/link-mosyle. Isso evita que o Mosyle
                        // "roube" um EAV-XXXX recem-cadastrado que ainda nao foi conferido.
                        const newStatus = currentStatus === 'Estoque - Lacrado'
                            ? 'Estoque - Lacrado'
                            : (mUser ? 'Em Uso' : 'Disponível');

                        await client.query(
                            'UPDATE devices SET model = $1, type = $2, os_version = $3, last_seen = $4, status = $5, tag = $6, supplier = $7 WHERE id = $8',
                            [modelStr, typeStr, osVersion, now, newStatus, tagToUpdate, supplierToUpdate, centralDeviceId]
                        );

                        // Se o status era Lacrado, NAO cria/atualiza assignment -- aguarda vinculacao manual.
                        if (currentStatus === 'Estoque - Lacrado') continue;
                    } else {
                        centralDeviceId = crypto.randomBytes(4).toString('hex');
                        const newStatus = mUser ? 'Em Uso' : 'Disponível';
                        await client.query(
                            'INSERT INTO devices (id, serial_number, model, type, status, condition, created_at, last_seen, os_version, tag, supplier) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
                            [centralDeviceId, sn, modelStr, typeStr, newStatus, 'Novo', now, now, osVersion, 'Mosyle MDM', 'Mosyle']
                        );
                    }

                    // 2. Lógica de Atribuição (Assignments)
                    
                    if (mUser) {
                        let mRole = dev.usertype || 'Colaborador'; 
                        if (mRole === 'Student') mRole = 'Aluno';
                        else if (mRole === 'Teacher') mRole = 'Professor';
                        else if (mRole === 'Staff' || mRole === 'Administrator') mRole = 'Colaborador';

                        const assignRes = await client.query('SELECT id, user_name FROM assignments WHERE device_id = $1 AND returned_at IS NULL', [centralDeviceId]);
                        
                        let needsNewAssignment = false;
                        if (assignRes.rows.length > 0) {
                            const currentAssign = assignRes.rows[0];
                            if (currentAssign.user_name !== (dev.username || dev.useremail)) {
                                await client.query('UPDATE assignments SET returned_at = $1 WHERE id = $2', [now, currentAssign.id]);
                                needsNewAssignment = true;
                            } else {
                                // O usuário é o mesmo, mas vamos forçar a atualização do cargo caso esteja com o termo inglês
                                await client.query('UPDATE assignments SET user_role = $1 WHERE id = $2', [mRole, currentAssign.id]);
                            }
                        } else {
                            needsNewAssignment = true;
                        }

                        if (needsNewAssignment) {
                            const assignId = Math.random().toString(36).substring(2, 9);
                            await client.query(
                                'INSERT INTO assignments (id, device_id, user_name, user_email, user_role, assigned_at, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                                [assignId, centralDeviceId, dev.username || dev.useremail || 'Desconhecido', dev.useremail || '', mRole, now, now]
                            );
                        }
                    } else {
                        // Sem usuário no MDM -> encerra qualquer atribuição ativa
                        await client.query('UPDATE assignments SET returned_at = $1 WHERE device_id = $2 AND returned_at IS NULL', [now, centralDeviceId]);
                    }
                }
            }
            await client.query('COMMIT');
        } catch (dbErr) {
            await client.query('ROLLBACK');
            if (manualResponse) return manualResponse.status(500).json({ error: 'Erro ao salvar dispositivos do Mosyle no banco local: ' + dbErr.message });
            console.error('[Auto-Sync] Erro no DB:', dbErr.message);
            return;
        } finally {
            client.release();
        }
        
        if (manualResponse) {
            manualResponse.json({ success: true, message: `Sincronização concluída com sucesso! ${allDevices.length} dispositivos (Macs/iPads) foram mapeados e salvos em ambiente isolado.` });
        } else {
            console.log(`[Auto-Sync] Concluído: ${allDevices.length} dispositivos (Macs/iPads) foram mapeados e salvos.`);
        }
    } catch (err) {
        console.error('[Mosyle Auto-Sync]', err);
        if (manualResponse) manualResponse.status(500).json({ error: err.message });
    }
}

app.post('/api/mosyle/sync', authenticateToken, async (req, res) => {
    if (req.user && req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acesso negado.' });
    await runMosyleSync(res);
});

// Executa o Auto-Sync a cada 1 hora (3600000 milissegundos)
setInterval(() => {
    console.log('[Auto-Sync] Iniciando sincronização agendada do Mosyle...');
    runMosyleSync();
}, 3600000);

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
