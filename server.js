import express from 'express';
import https from 'https';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { exec, spawn } from 'child_process';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

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
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

// --- POSTGRES DATABASE SYSTEM ---
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Função utilitária para converter placeholders '?' (SQLite) para '$1, $2' (PostgreSQL)
function convertPlaceholders(sql) {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

async function syncFromGoogleSheets() {
  console.log('[Sync] Iniciando sincronização automática do Google Sheets para o PostgreSQL...');
  
  let creds;
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    try {
      creds = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    } catch (e) {
      console.error('[Sync] Erro ao parsear GOOGLE_CREDENTIALS_JSON:', e.message);
      return;
    }
  } else {
    // Tenta ler do arquivo local (para desenvolvimento)
    const localCredsPath = path.join(__dirname, 'data', 'google-credentials.json');
    if (fs.existsSync(localCredsPath)) {
      try {
        creds = JSON.parse(fs.readFileSync(localCredsPath, 'utf-8'));
      } catch (e) {
        console.error('[Sync] Erro ao ler arquivo local google-credentials.json:', e.message);
        return;
      }
    } else {
      console.log('[Sync] Credenciais do Google Sheets não encontradas (nem GOOGLE_CREDENTIALS_JSON nem arquivo local). Pulando sincronização.');
      return;
    }
  }

  try {
    const auth = new google.auth.JWT({
      email: creds.client_email,
      key: creds.private_key.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const client = google.sheets({ version: 'v4', auth });
    const SPREADSHEET_ID = '1uNLKLitQLRCf1bwVZ9Gy-VnZttUp7HybYxMypFaz0Yg';
    const tables = ['devices', 'assignments', 'department', 'shortcuts', 'audit_logs', 'authorized_users'];
    
    const pgClient = await pool.connect();
    try {
      await pgClient.query('BEGIN');
      for (const table of tables) {
        console.log(`[Sync] Baixando dados para tabela: ${table}...`);
        const res = await client.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${table}!A:Z`
        });
        const rows = res.data.values || [];
        if (rows.length < 2) continue;
        
        // Limpar tabela
        await pgClient.query(`DELETE FROM ${table}`);
        
        const rawHeaders = rows[0];
        const dataRows = rows.slice(1);
        
        // Tratar headers
        const headers = rawHeaders.map((h, i) => {
          if (!h) return `col_${i}`;
          if (h.includes('http://')) return 'id'; // correção para atalhos
          return String(h).replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
        });

        // Garante que todas as colunas existem na tabela no Postgres
        for (const col of headers) {
          if (col === 'id') continue;
          await pgClient.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col} TEXT`);
        }
        
        const placeholders = headers.map((_, i) => `$${i + 1}`).join(', ');
        const insertQuery = `INSERT INTO ${table} (${headers.join(', ')}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`;
        
        for (const row of dataRows) {
          const values = headers.map((_, i) => row[i] == null ? '' : String(row[i]));
          await pgClient.query(insertQuery, values);
        }
        console.log(`[Sync] Tabela ${table} sincronizada com ${dataRows.length} registros.`);
      }
      await pgClient.query('COMMIT');
      console.log('[Sync] Sincronização concluída com sucesso!');
    } catch (err) {
      await pgClient.query('ROLLBACK');
      console.error('[Sync] Erro durante a transação de sincronização:', err);
    } finally {
      pgClient.release();
    }
  } catch (err) {
    console.error('[Sync] Erro na sincronização com Google Sheets:', err);
  }
}

async function initPostgresDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS devices (id TEXT PRIMARY KEY, tag TEXT, serial_number TEXT, model TEXT, type TEXT, status TEXT, condition TEXT, last_seen TEXT, created_at TEXT);
      CREATE TABLE IF NOT EXISTS assignments (id TEXT PRIMARY KEY, device_id TEXT, user_name TEXT, department_id TEXT, assigned_at TEXT, returned_at TEXT, return_photo_url TEXT, user_role TEXT, grade TEXT, campus TEXT, created_at TEXT);
      CREATE TABLE IF NOT EXISTS department (id TEXT PRIMARY KEY, name TEXT);
      CREATE TABLE IF NOT EXISTS shortcuts (id TEXT PRIMARY KEY, title TEXT, description TEXT, url TEXT, icon_name TEXT, color TEXT, campus TEXT);
      CREATE TABLE IF NOT EXISTS authorized_users (id TEXT PRIMARY KEY, email TEXT, password TEXT, created_at TEXT);
      CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, user_email TEXT, action TEXT, details TEXT, resource_type TEXT, resource_id TEXT, created_at TEXT);
    `);
    console.log('[PostgreSQL] Banco de dados inicializado com sucesso.');
    
    // Auto-popula o banco de dados do Google Sheets se estiver vazio
    const checkRes = await pool.query("SELECT COUNT(*) FROM department");
    if (parseInt(checkRes.rows[0].count) === 0) {
      console.log('[PostgreSQL] Banco vazio detectado. Sincronizando com Google Sheets...');
      await syncFromGoogleSheets();
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

// --- CONTROLE DE SESSÕES & AUTENTICAÇÃO ---
const ACTIVE_SESSIONS = new Set();

function authenticateToken(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || '';
  const isLocalhost = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';

  // Permitir acesso irrestrito se a requisição vier do próprio computador (localhost)
  if (isLocalhost) {
    return next();
  }

  // Se vier da rede externa/local (ex: 192.168.x.x), exige token de login
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || !ACTIVE_SESSIONS.has(token)) {
    return res.status(401).json({ error: 'Acesso não autorizado. Por favor, faça login no sistema.' });
  }
  next();
}

// Endpoint de Banco de Dados simulado
app.post('/api/db', authenticateToken, async (req, res) => {
  processBase64Fields(req.body);
  const { table, filters = {}, ilikeCol, ilikeVal, insertData, updateData, isDelete, isUpsert, orderCol, orderAsc, isSingle } = req.body;

  if (table === 'authorized_users' && (insertData || updateData || isDelete || isUpsert)) {
    return res.status(403).json({ error: { message: 'Acesso negado.' } });
  }

  try {
    let whereClause = '';
    const params = [];
    const filterKeys = Object.keys(filters);
    
    if (filterKeys.length > 0) {
      whereClause = 'WHERE ' + filterKeys.map(k => `${k} = ?`).join(' AND ');
      params.push(...filterKeys.map(k => filters[k]));
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
      const updateKeys = Object.keys(updateData);
      const setClause = updateKeys.map(k => `${k} = ?`).join(', ');
      const updateParams = updateKeys.map(k => updateData[k]);
      const sql = convertPlaceholders(`UPDATE ${table} SET ${setClause} ${whereClause}`);
      await pool.query(sql, [...updateParams, ...params]);
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
          if (!finalItem.id) finalItem.id = Math.random().toString(36).substring(2, 9);
          if (!finalItem.created_at && !isUpsert) finalItem.created_at = new Date().toISOString();
          
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
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
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
      const allAssignments = allAssignmentsRes.rows;
      const allDepartments = allDepartmentsRes.rows;
      result = result.map(dev => {
        const devAssigns = allAssignments
          .filter(a => String(a.device_id) === String(dev.id))
          .map(a => {
            const dept = allDepartments.find(d => String(d.id) === String(a.department_id));
            return { ...a, department: dept ? { name: dept.name } : null };
          });
        return { ...dev, assignments: devAssigns };
      });
    }

    if (table === 'authorized_users') {
      result = result.map(u => ({ id: u.id, email: u.email, created_at: u.created_at }));
    }

    return res.json({ data: isSingle ? (result[0] || null) : result, error: null });
  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
});


// Endpoint para sincronização do Agente RMM (Monitoramento Local)
app.post('/api/agent/sync', async (req, res) => {
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
    monitors
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

    let targetDevice;
    let actionStr;

    if (existingIndex >= 0) {
      // Atualiza o dispositivo existente
      const sql = convertPlaceholders('UPDATE devices SET status=?, model=?, condition=?, last_seen=? WHERE id=?');
      await pool.query(sql, [
        'Em Uso', 
        model || devices[existingIndex].model, 
        technicalInfo, 
        new Date().toISOString(), 
        devices[existingIndex].id
      ]);
      targetDevice = { ...devices[existingIndex], status: 'Em Uso', model: model || devices[existingIndex].model, condition: technicalInfo, last_seen: new Date().toISOString() };
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
        created_at: new Date().toISOString()
      };
      
      const keys = Object.keys(newDevice);
      const placeholders = keys.map(() => '?').join(', ');
      const sql = convertPlaceholders(`INSERT INTO devices (${keys.join(', ')}) VALUES (${placeholders})`);
      await pool.query(sql, keys.map(k => newDevice[k]));
      targetDevice = newDevice;
      actionStr = 'created';
    }
    
    sendRealtimeUpdate('devices');

    // ============================================
    // MOTOR DE AUTO-ATRIBUIÇÃO (AUTO-ASSIGNMENT)
    // ============================================
    const cleanUsername = username ? (username.includes('\\') ? username.split('\\').pop() : username) : 'Desconhecido';
    
    if (cleanUsername !== 'Desconhecido') {
      const assignments = await readDBTable('assignments');
      const activeAssignmentIndex = assignments.findIndex(a => a.device_id === targetDevice.id && !a.returned_at);
      
      let needsNewAssignment = false;
      let lastCampus = '';
      let lastDepartment = '';

      if (activeAssignmentIndex >= 0) {
        const currentAssign = assignments[activeAssignmentIndex];
        lastCampus = currentAssign.campus || '';
        lastDepartment = currentAssign.department_id || '';
        
        // Se a máquina estiver com outro usuário, encerra o empréstimo antigo
        if (currentAssign.user_name.toLowerCase() !== cleanUsername.toLowerCase()) {
          const sql = convertPlaceholders('UPDATE assignments SET returned_at=? WHERE id=?');
          await pool.query(sql, [new Date().toISOString(), currentAssign.id]);
          needsNewAssignment = true;
        }
      } else {
        // Encontrar os dados da última atribuição (histórico) para herdar o departamento
        const pastAssignments = assignments.filter(a => a.device_id === targetDevice.id).sort((a,b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime());
        if (pastAssignments.length > 0) {
          lastCampus = pastAssignments[pastAssignments.length - 1].campus || '';
          lastDepartment = pastAssignments[pastAssignments.length - 1].department_id || '';
        }
        needsNewAssignment = true;
      }

      if (needsNewAssignment) {
        const newAssignment = {
          id: Math.random().toString(36).substring(2, 9),
          device_id: targetDevice.id,
          user_name: cleanUsername,
          department_id: lastDepartment || 'ti-dept-id-triagem',
          assigned_at: new Date().toISOString(),
          returned_at: '',
          return_photo_url: '',
          user_role: 'Colaborador',
          grade: '',
          campus: lastCampus || 'Aeroporto',
          created_at: new Date().toISOString()
        };
        const aKeys = Object.keys(newAssignment);
        const aPlaceholders = aKeys.map(() => '?').join(', ');
        const sql = convertPlaceholders(`INSERT INTO assignments (${aKeys.join(', ')}) VALUES (${aPlaceholders})`);
        await pool.query(sql, aKeys.map(k => newAssignment[k]));
        sendRealtimeUpdate('assignments');
      }
    }

    return res.json({ success: true, action: actionStr, device: targetDevice });
  } catch (err) {
    console.error('[Agent Sync] Erro:', err);
    return res.status(500).json({ error: 'Erro no servidor: ' + err.message });
  }
});

// Endpoint de Ping do RMM
app.post('/api/agent/ping', authenticateToken, (req, res) => {
  const { hostname, ip } = req.body;
  if (!hostname && !ip) return res.status(400).json({ error: 'Hostname ou IP necessário para o Ping.' });

  // Dá prioridade para o IP se disponível (evita falha de resolução DNS)
  const targetHost = ip || hostname;

  console.log(`[Ping] Disparando ping na rede para: ${targetHost}...`);

  // O comando do Windows envia 1 pacote apenas para teste rápido
  exec(`ping -n 1 -w 2000 ${targetHost}`, (error, stdout, stderr) => {
    if (error) {
      console.log(`[Ping] Falha: Host ${targetHost} não alcançável.`);
      return res.json({ online: false, error: 'Host inalcançável', output: stdout });
    }

    // Tentar extrair o tempo do ping "tempo=XXms" ou "time=XXms"
    let timeMatch = stdout.match(/tempo[=<](\d+)ms/i) || stdout.match(/time[=<](\d+)ms/i);
    let ms = timeMatch ? timeMatch[1] : '?';

    console.log(`[Ping] Sucesso: Host ${targetHost} online (${ms}ms)`);
    return res.json({ online: true, time: ms, output: stdout });
  });
});

// Endpoint para acionar o Acesso Remoto (VNC)
app.post('/api/remote-control', authenticateToken, (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP necessário para o Acesso Remoto.' });

  console.log(`[VNC] Disparando conexão remota VNC para: ${ip}...`);

  const vncPass = process.env.VNC_PASSWORD || 'eav@2017';

  // Usa spawn desanexado para forçar a janela a abrir como um aplicativo independente (em primeiro plano)
  const vncProcess = spawn('C:\\Program Files\\TightVNC\\tvnviewer.exe', [ip, `-password=${vncPass}`], {
    detached: true,
    stdio: 'ignore',
    windowsHide: false
  });
  vncProcess.unref();

  return res.json({ success: true, message: `Conexão VNC disparada para ${ip}` });
});

// Endpoint administrativo para forçar sincronização do Google Sheets
app.post('/api/admin/sync-sheets', authenticateToken, async (req, res) => {
  try {
    await syncFromGoogleSheets();
    return res.json({ success: true, message: 'Banco de dados sincronizado com sucesso a partir do Google Sheets!' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro durante a sincronização: ' + err.message });
  }
});

// Serve os arquivos estáticos do build do React
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/uploads', express.static(path.join(DATA_DIR, 'uploads')));

// Endpoint proxy para a Monitcall
app.get('/api/monitcall', (req, res) => {
  const target = req.query.target || 'ramais';
  const fila = req.query.fila || '1021';

  const username = 'Demo';
  const password = 'Y7R8EM';
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
        res.setHeader('Access-Control-Allow-Origin', '*');
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

// Endpoint de Login Local Offline (Valida contra a aba authorized_users da planilha)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const users = await readDBTable('authorized_users');
    const user = users.find(u => String(u.email || '').toLowerCase().trim() === String(email).toLowerCase().trim());
    
    if (!user) {
      return res.status(401).json({ error: 'Usuário não cadastrado ou não autorizado.' });
    }
    
    if (String(user.password || '').trim() !== String(password).trim()) {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }
    
    console.log(`[Auth] Login bem-sucedido para: ${email}`);
    const token = crypto.randomUUID();
    ACTIVE_SESSIONS.add(token);
    return res.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.email.split('@')[0]
      },
      token: token
    });
  } catch (err) {
    console.error('Erro no login local:', err);
    return res.status(500).json({ error: 'Erro interno no servidor ao autenticar.' });
  }
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
    const token = crypto.randomUUID();
    ACTIVE_SESSIONS.add(token);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
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
app.post('/api/ai/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'Mensagem obrigatória' });
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Chave do Gemini não configurada no servidor.' });
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
  return { ID: d.id, SN: d.serial_number || d.serialNumber, Hostname: hostname, IP: ip, Tipo: d.type, UsuarioAtivo: loggedUser, Campus: d.campus, Status: d.status, Model: d.model, Dept: d.departmentId };
}), null, 2)}

Resumo dos Empréstimos Ativos:
${JSON.stringify(assignments.filter(a => !a.returned_at).map(a => ({ DeviceID: a.device_id, User: a.user_name, Date: a.assigned_at })), null, 2)}

Últimos 30 Registros de Atividades (Auditoria / Histórico de quem fez o quê por último):
${JSON.stringify(audit_logs.slice(-30).map(a => ({ Acao: a.action, Device: a.device_id, Detalhes: a.details, Usuario: a.user_email, Data: a.timestamp })), null, 2)}

Você é o "EAV Copilot", um analista de dados assistente super inteligente para a equipe de TI da Escola Americana de Vitória (EAV).
Responda de forma direta, amigável e em Português usando os dados fornecidos. Você consegue cruzar os IDs dos departamentos com os nomes deles para dar respostas claras.
Use as tabelas de auditoria para saber as últimas ações, movimentações ou "último equipamento" adicionado/alterado.
Formate a resposta usando Markdown (listas, negrito) para ficar bonito no chat.

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

// Rota catch-all para o React SPA (todas as rotas vão para o index.html)
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

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
