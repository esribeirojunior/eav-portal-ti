import express from 'express';
import https from 'https';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { exec, spawn } from 'child_process';
import dotenv from 'dotenv';
import OpenAI from 'openai';

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
  const filesToCopy = ['inventario.xlsx', 'google-credentials.json', 'tutorials.json'];
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

// --- EXCEL & GOOGLE SHEETS DATABASE SYSTEM ---
import XLSX from 'xlsx';
import { google } from 'googleapis';

const EXCEL_PATH = path.join(DATA_DIR, 'inventario.xlsx');
const GOOGLE_CREDS_PATH = path.join(DATA_DIR, 'google-credentials.json');
const SPREADSHEET_ID = '1uNLKLitQLRCf1bwVZ9Gy-VnZttUp7HybYxMypFaz0Yg';

let sheetsClient = null;

function getSheetsClient() {
  if (sheetsClient) return sheetsClient;
  if (!fs.existsSync(GOOGLE_CREDS_PATH)) {
    return null;
  }
  try {
    const creds = JSON.parse(fs.readFileSync(GOOGLE_CREDS_PATH, 'utf-8'));
    const auth = new google.auth.JWT({
      email: creds.client_email,
      key: creds.private_key.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    sheetsClient = google.sheets({ version: 'v4', auth });
    console.log("[GoogleSheets] Cliente da API inicializado com sucesso!");
    return sheetsClient;
  } catch (err) {
    console.error("[GoogleSheets] Erro ao inicializar cliente da API:", err);
    return null;
  }
}

async function initGoogleSheetsDB() {
  const client = getSheetsClient();
  if (!client) return;

  try {
    const metadata = await client.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID
    });
    const sheetNames = metadata.data.sheets.map(s => s.properties.title);
    
    const requiredSheets = ['devices', 'assignments', 'department', 'shortcuts', 'authorized_users', 'audit_logs'];
    const requests = [];

    for (const sheet of requiredSheets) {
      if (!sheetNames.includes(sheet)) {
        console.log(`[GoogleSheets] Criando aba faltante: ${sheet}`);
        requests.push({
          addSheet: {
            properties: { title: sheet }
          }
        });
      }
    }

    if (requests.length > 0) {
      await client.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { requests }
      });
      console.log("[GoogleSheets] Abas criadas com sucesso!");
      
      // Escreve os cabeçalhos padrão nelas
      for (const sheet of requiredSheets) {
        if (!sheetNames.includes(sheet)) {
          const headers = getHeadersForSheet(sheet);
          const depts = sheet === 'department' ? [
            ['id', 'name'],
            ['ti-dept-id-1', 'TI'],
            ['ti-dept-id-2', 'DIRETORIA'],
            ['ti-dept-id-3', 'SECRETARIA'],
            ['ti-dept-id-4', 'COORDENAÇÃO'],
            ['ti-dept-id-5', 'DOCENTES'],
            ['ti-dept-id-6', 'DISCENTES'],
            ['ti-dept-id-7', 'MANUTENÇÃO'],
            ['ti-dept-id-8', 'FINANCEIRO'],
            ['ti-dept-id-9', 'SUPRIMENTOS'],
            ['ti-dept-id-10', 'RH'],
            ['ti-dept-id-11', 'DP'],
            ['ti-dept-id-12', 'ADMISSIONS'],
            ['ti-dept-id-13', 'MARKETING'],
            ['ti-dept-id-14', 'GUARITA']
          ] : null;
          
          const shortcuts = sheet === 'shortcuts' ? [
            ['id', 'title', 'description', 'url', 'icon_name', 'color', 'campus'],
            ['s1', 'BenQ DMS', 'Gestão de Telas Interativas e Projetores', 'https://dms.benq.com/', 'Monitor', 'bg-orange-500', 'Todos'],
            ['s2', 'Google Admin', 'Gestão de Contas, Chromebooks e Políticas', 'https://admin.google.com/', 'Globe', 'bg-blue-600', 'Todos'],
            ['s3', 'Meraki Dashboard', 'Infraestrutura de Rede e Wi-Fi', 'https://dashboard.meraki.com/', 'Globe', 'bg-emerald-600', 'Todos'],
            ['s4', 'Suporte Microsoft', 'Portal de Administração Microsoft 365', 'https://admin.microsoft.com/', 'Cloud', 'bg-indigo-600', 'Todos']
          ] : null;

          const authUsers = sheet === 'authorized_users' ? [
            ['id', 'email', 'created_at'],
            ['u1', 'erisson.junior@escolaamericana.com.br', new Date().toISOString()],
            ['u2', 'admin@teste.local', new Date().toISOString()]
          ] : null;

          const values = depts || shortcuts || authUsers || [headers];

          await client.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheet}!A1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values }
          });
        }
      }
    }
  } catch (err) {
    console.error("[GoogleSheets] Erro ao inicializar banco de dados no Google Sheets:", err);
  }
}

function getHeadersForSheet(sheetName) {
  switch (sheetName) {
    case 'devices': return ['id', 'tag', 'serial_number', 'model', 'type', 'status', 'condition', 'last_seen', 'created_at'];
    case 'assignments': return ['id', 'device_id', 'user_name', 'department_id', 'assigned_at', 'returned_at', 'return_photo_url', 'user_role', 'grade', 'campus'];
    case 'department': return ['id', 'name'];
    case 'shortcuts': return ['id', 'title', 'description', 'url', 'icon_name', 'color', 'campus'];
    case 'authorized_users': return ['id', 'email', 'created_at'];
    case 'audit_logs': return ['id', 'user_email', 'action', 'details', 'resource_type', 'resource_id', 'created_at'];
    default: return ['id'];
  }
}

function jsonTo2DArray(data, sheetName) {
  const headers = getHeadersForSheet(sheetName);
  if (!data || data.length === 0) {
    return [headers];
  }
  const uniqueKeys = Array.from(new Set([...headers, ...Object.keys(data[0] || {})]));
  const rows = data.map(item => uniqueKeys.map(key => item[key] ?? ''));
  return [uniqueKeys, ...rows];
}

function valuesToJSON(values) {
  if (!values || values.length === 0) return [];
  const headers = values[0];
  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] ?? '';
    });
    return obj;
  });
}

// --- CACHE PARA EVITAR EXCESSO DE REQUISIÇÕES AO GOOGLE SHEETS ---
const dbCache = {};
const CACHE_TTL = 15000; // 15 segundos de cache

async function readDBTable(sheetName) {
  // Verifica cache primeiro
  const cached = dbCache[sheetName];
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }

  const client = getSheetsClient();
  if (client) {
    try {
      await initGoogleSheetsDB();
      const response = await client.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A:Z`
      });
      const values = response.data.values;
      const result = valuesToJSON(values);
      // Salva no cache
      dbCache[sheetName] = { data: result, timestamp: Date.now() };
      return result;
    } catch (e) {
      console.error(`[GoogleSheets] Erro ao ler tabela ${sheetName}:`, e);
      // Se tem cache antigo, usa ele em vez de quebrar
      if (cached) {
        console.log(`[GoogleSheets] Usando cache antigo para ${sheetName}`);
        return cached.data;
      }
      throw e;
    }
  }
  return readExcelTable(sheetName);
}

async function writeDBTable(sheetName, data) {
  // Atualiza o cache local imediatamente ao gravar
  dbCache[sheetName] = { data, timestamp: Date.now() };

  const client = getSheetsClient();
  if (client) {
    try {
      await initGoogleSheetsDB();
      const values = jsonTo2DArray(data, sheetName);
      
      // 1. Grava os novos dados primeiro para garantir que a operação é válida
      await client.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values }
      });

      // 2. Se a gravação teve sucesso, limpa apenas as linhas antigas excedentes no final
      await client.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A${values.length + 1}:Z`
      });

      return;
    } catch (e) {
      console.error(`[GoogleSheets] Erro ao gravar tabela ${sheetName}:`, e);
      throw e; // Lança o erro para que a operação falhe visivelmente
    }
  }
  writeExcelTable(sheetName, data);
}

// Inicializa a planilha de banco de dados Excel local se não existir (Fallback)
function initExcelDB() {
  if (!fs.existsSync(EXCEL_PATH)) {
    console.log("[ExcelDB] Criando nova planilha de inventário...");
    const wb = XLSX.utils.book_new();
    
    const depts = [
      { id: 'ti-dept-id-1', name: 'TI' },
      { id: 'ti-dept-id-2', name: 'DIRETORIA' },
      { id: 'ti-dept-id-3', name: 'SECRETARIA' },
      { id: 'ti-dept-id-4', name: 'COORDENAÇÃO' },
      { id: 'ti-dept-id-5', name: 'DOCENTES' },
      { id: 'ti-dept-id-6', name: 'DISCENTES' },
      { id: 'ti-dept-id-7', name: 'MANUTENÇÃO' },
      { id: 'ti-dept-id-8', name: 'FINANCEIRO' },
      { id: 'ti-dept-id-9', name: 'SUPRIMENTOS' },
      { id: 'ti-dept-id-10', name: 'RH' },
      { id: 'ti-dept-id-11', name: 'DP' },
      { id: 'ti-dept-id-12', name: 'ADMISSIONS' },
      { id: 'ti-dept-id-13', name: 'MARKETING' },
      { id: 'ti-dept-id-14', name: 'GUARITA' }
    ];
    
    const shortcuts = [
      { id: 's1', title: 'BenQ DMS', description: 'Gestão de Telas Interativas e Projetores', url: 'https://dms.benq.com/', icon_name: 'Monitor', color: 'bg-orange-500', campus: 'Todos' },
      { id: 's2', title: 'Google Admin', description: 'Gestão de Contas, Chromebooks e Políticas', url: 'https://admin.google.com/', icon_name: 'Globe', color: 'bg-blue-600', campus: 'Todos' },
      { id: 's3', title: 'Meraki Dashboard', description: 'Infraestrutura de Rede e Wi-Fi', url: 'https://dashboard.meraki.com/', icon_name: 'Globe', color: 'bg-emerald-600', campus: 'Todos' },
      { id: 's4', title: 'Suporte Microsoft', description: 'Portal de Administração Microsoft 365', url: 'https://admin.microsoft.com/', icon_name: 'Cloud', color: 'bg-indigo-600', campus: 'Todos' }
    ];

    const authorizedUsers = [
      { id: 'u1', email: 'erisson.junior@escolaamericana.com.br', password: '123456', created_at: new Date().toISOString() },
      { id: 'u2', email: 'admin@teste.local', password: 'admin123', created_at: new Date().toISOString() }
    ];

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([]), 'devices');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([]), 'assignments');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(depts), 'department');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(shortcuts), 'shortcuts');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(authorizedUsers), 'authorized_users');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([]), 'audit_logs');
    
    XLSX.writeFile(wb, EXCEL_PATH);
  } else {
    // Caso a planilha já exista, garante que a aba authorized_users existe
    try {
      const wb = XLSX.readFile(EXCEL_PATH);
      let updated = false;

      if (!wb.Sheets['authorized_users']) {
        console.log("[ExcelDB] Aba 'authorized_users' ausente na planilha existente. Criando...");
        const authorizedUsers = [
          { id: 'u1', email: 'erisson.junior@escolaamericana.com.br', password: '123456', created_at: new Date().toISOString() },
          { id: 'u2', email: 'admin@teste.local', password: 'admin123', created_at: new Date().toISOString() }
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(authorizedUsers), 'authorized_users');
        updated = true;
      }

      if (updated) {
        XLSX.writeFile(wb, EXCEL_PATH);
        console.log("[ExcelDB] Planilha existente atualizada com a aba de usuários autorizados.");
      }
    } catch (err) {
      console.error("[ExcelDB] Erro ao verificar/atualizar abas da planilha existente:", err);
    }
  }
}

function readExcelTable(sheetName) {
  try {
    initExcelDB();
    const wb = XLSX.readFile(EXCEL_PATH);
    const sheet = wb.Sheets[sheetName];
    if (!sheet) return [];
    return XLSX.utils.sheet_to_json(sheet);
  } catch (e) {
    console.error(`Erro ao ler tabela ${sheetName}:`, e);
    return [];
  }
}

function writeExcelTable(sheetName, data) {
  try {
    initExcelDB();
    const wb = XLSX.readFile(EXCEL_PATH);
    const newSheet = XLSX.utils.json_to_sheet(data);
    wb.Sheets[sheetName] = newSheet;
    XLSX.writeFile(wb, EXCEL_PATH);
  } catch (e) {
    console.error(`Erro ao gravar tabela ${sheetName}:`, e);
    throw e;
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
  // Processa campos que contenham imagens Base64 para salvar no disco local
  processBase64Fields(req.body);

  const { table, filters = {}, ilikeCol, ilikeVal, insertData, updateData, isDelete, isUpsert, orderCol, orderAsc, isSingle } = req.body;

  // Proteção da tabela de credenciais (authorized_users)
  if (table === 'authorized_users') {
    if (insertData || updateData || isDelete || isUpsert) {
      return res.status(403).json({ data: null, error: { message: 'Acesso negado para modificar a tabela de usuários.' } });
    }
    try {
      const data = await readDBTable('authorized_users');
      // Filtra senhas antes de responder
      const sanitized = data.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at
      }));
      let filtered = sanitized;
      for (const [col, val] of Object.entries(filters)) {
        filtered = filtered.filter(item => String(item[col] ?? '') === String(val ?? ''));
      }
      return res.json({ data: isSingle ? (filtered[0] || null) : filtered, error: null });
    } catch (err) {
      return res.status(500).json({ data: null, error: { message: err.message } });
    }
  }
  
  const clientName = getSheetsClient() ? 'GoogleSheets' : 'ExcelDB';
  console.log(`[${clientName}] Requisição na tabela: ${table} | Operação: ${insertData ? (isUpsert ? 'UPSERT' : 'INSERT') : updateData ? 'UPDATE' : isDelete ? 'DELETE' : 'SELECT'}`);

  try {
    // 1. SELECT (Querying)
    if (!insertData && !updateData && !isDelete && !isUpsert) {
      if (table === 'devices') {
        const devices = await readDBTable('devices');
        const assignments = await readDBTable('assignments');
        const departments = await readDBTable('department');

        const data = devices.map(dev => {
          const devAssigns = assignments
            .filter(a => String(a.device_id) === String(dev.id))
            .map(a => {
              const dept = departments.find(d => String(d.id) === String(a.department_id));
              return {
                id: a.id,
                device_id: a.device_id,
                user_name: a.user_name,
                department_id: a.department_id,
                department: dept ? { name: dept.name } : null,
                user_role: a.user_role || 'Colaborador',
                grade: a.grade || '',
                assigned_at: a.assigned_at,
                returned_at: a.returned_at || null,
                return_photo_url: a.return_photo_url || null,
                campus: a.campus || ''
              };
            });

          return {
            ...dev,
            assignments: devAssigns
          };
        });

        // Apply filters
        let filtered = data;
        for (const [col, val] of Object.entries(filters)) {
          filtered = filtered.filter(item => String(item[col] ?? '') === String(val ?? ''));
        }

        // Apply ilike filter if present
        if (ilikeCol && ilikeVal) {
          const searchTerm = ilikeVal.replace(/%/g, '').toLowerCase().trim();
          filtered = filtered.filter(item => {
            const itemVal = String(item[ilikeCol] ?? '').toLowerCase().trim();
            return itemVal.includes(searchTerm);
          });
        }

        // Apply sorting
        if (orderCol) {
          filtered.sort((a, b) => {
            const valA = (a[orderCol] || '').toString();
            const valB = (b[orderCol] || '').toString();
            return orderAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
          });
        }

        return res.json({ data: isSingle ? (filtered[0] || null) : filtered, error: null });
      }

      // Default tables
      const data = await readDBTable(table);
      let filtered = data;
      for (const [col, val] of Object.entries(filters)) {
        filtered = filtered.filter(item => String(item[col] ?? '') === String(val ?? ''));
      }

      // Apply ilike filter if present
      if (ilikeCol && ilikeVal) {
        const searchTerm = ilikeVal.replace(/%/g, '').toLowerCase().trim();
        filtered = filtered.filter(item => {
          const itemVal = String(item[ilikeCol] ?? '').toLowerCase().trim();
          return itemVal.includes(searchTerm);
        });
      }

      if (orderCol) {
        filtered.sort((a, b) => {
          const valA = (a[orderCol] || '').toString();
          const valB = (b[orderCol] || '').toString();
          return orderAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        });
      }

      return res.json({ data: isSingle ? (filtered[0] || null) : filtered, error: null });
    }

    // 2. INSERT
    if (insertData && !isUpsert) {
      const rows = await readDBTable(table);
      const newItems = Array.isArray(insertData) ? insertData : [insertData];
      
      const inserted = newItems.map(item => ({
        id: item.id || Math.random().toString(36).substring(2, 9),
        ...item,
        created_at: item.created_at || new Date().toISOString()
      }));

      rows.push(...inserted);
      await writeDBTable(table, rows);
      sendRealtimeUpdate(table);

      return res.json({ data: isSingle ? inserted[0] : inserted, error: null });
    }

    // 3. UPSERT
    if (insertData && isUpsert) {
      const rows = await readDBTable(table);
      const newItems = Array.isArray(insertData) ? insertData : [insertData];
      const results = [];

      for (const item of newItems) {
        let index = -1;
        if (table === 'devices') {
          index = rows.findIndex(r => String(r.tag ?? '').trim().toLowerCase() === String(item.tag ?? '').trim().toLowerCase());
        } else {
          index = rows.findIndex(r => String(r.id ?? '') === String(item.id ?? ''));
        }

        const upserted = {
          id: index >= 0 ? rows[index].id : (item.id || Math.random().toString(36).substring(2, 9)),
          ...item,
          updated_at: new Date().toISOString()
        };

        if (index >= 0) {
          rows[index] = { ...rows[index], ...upserted };
        } else {
          rows.push(upserted);
        }
        results.push(upserted);
      }

      await writeDBTable(table, rows);
      sendRealtimeUpdate(table);
      return res.json({ data: isSingle ? results[0] : results, error: null });
    }

    // 4. UPDATE
    if (updateData) {
      const rows = await readDBTable(table);
      const updatedItems = [];

      const newRows = rows.map(item => {
        let match = true;
        for (const [col, val] of Object.entries(filters)) {
          if (String(item[col] ?? '') !== String(val ?? '')) {
            match = false;
            break;
          }
        }

        if (match) {
          const updated = { ...item, ...updateData };
          updatedItems.push(updated);
          return updated;
        }
        return item;
      });

      await writeDBTable(table, newRows);
      sendRealtimeUpdate(table);
      return res.json({ data: isSingle ? updatedItems[0] : updatedItems, error: null });
    }

    // 5. DELETE
    if (isDelete) {
      const rows = await readDBTable(table);
      const newRows = rows.filter(item => {
        let match = true;
        for (const [col, val] of Object.entries(filters)) {
          if (String(item[col] ?? '') === String(val ?? '')) {
            match = false;
            break;
          }
        }
        return match;
      });

      await writeDBTable(table, newRows);
      sendRealtimeUpdate(table);
      return res.json({ data: null, error: null });
    }

  } catch (err) {
    console.error(`Erro ao processar operação no banco local (${table}):`, err);
    let message = err.message;
    if (err.code === 'EBUSY') {
      message = 'A planilha data/inventario.xlsx está aberta em outro programa (como o Excel). Por favor, feche-a para salvar as alterações.';
    }
    return res.status(500).json({ data: null, error: { message } });
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
      devices[existingIndex] = {
        ...devices[existingIndex],
        status: 'Em Uso',
        model: model || devices[existingIndex].model,
        condition: technicalInfo,
        last_seen: new Date().toISOString()
      };
      targetDevice = devices[existingIndex];
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
      devices.push(newDevice);
      targetDevice = newDevice;
      actionStr = 'created';
    }
    
    await writeDBTable('devices', devices);
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
          assignments[activeAssignmentIndex].returned_at = new Date().toISOString();
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
          department_id: lastDepartment || 'ti-dept-id-triagem', // TRIAGEM como fallback para maquinas virgens
          assigned_at: new Date().toISOString(),
          returned_at: '',
          return_photo_url: '',
          user_role: 'Colaborador', // Padrão
          grade: '',
          campus: lastCampus || 'Aeroporto' // Aeroporto como fallback
        };
        assignments.push(newAssignment);
        await writeDBTable('assignments', assignments);
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
  const { hostname } = req.body;
  if (!hostname) return res.status(400).json({ error: 'Hostname necessário para o Ping.' });

  // Pega o hostname real que o front enviou (sem tentar adivinhar prefixos, pois o Windows pode ter o EAV no nome)
  const targetHost = hostname;

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

// Endpoint to import data from legacy Google Sheet structure to EAV format
app.post('/api/import-google-legacy', authenticateToken, async (req, res) => {
  const client = getSheetsClient();
  if (!client) {
    return res.status(400).json({ error: 'Google Sheets credentials not configured. Por favor, coloque o arquivo data/google-credentials.json.' });
  }

  try {
    await initGoogleSheetsDB();
    
    // Get sheets metadata to find the name of the first sheet (legacy data)
    const metadata = await client.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const firstSheetName = metadata.data.sheets[0].properties.title;
    
    // Don't import if the first sheet is one of the system sheets
    if (['devices', 'assignments', 'department', 'shortcuts', 'audit_logs'].includes(firstSheetName)) {
      return res.status(400).json({ error: `A primeira aba (${firstSheetName}) já é uma aba do sistema. Nenhuma importação necessária.` });
    }

    const response = await client.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${firstSheetName}!A:G`
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return res.status(400).json({ error: 'Nenhum dado encontrado na aba legada.' });
    }

    // Detect headers row
    let headerRowIndex = 0;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].includes('Campus') || rows[i].includes('Departamento') || rows[i].includes('Usuário')) {
        headerRowIndex = i;
        break;
      }
    }

    const headers = rows[headerRowIndex].map(h => String(h || '').trim());
    const dataRows = rows.slice(headerRowIndex + 1);

    const campusIdx = headers.indexOf('Campus');
    const deptIdx = headers.indexOf('Departamento');
    const userIdx = headers.indexOf('Usuário');
    const deviceTypeIdx = headers.indexOf('Dispositivo');
    const modelIdx = headers.indexOf('Modelo');
    const serialIdx = headers.indexOf('Service Tag');

    if (userIdx === -1 || deviceTypeIdx === -1) {
      return res.status(400).json({ error: 'Estrutura da aba legada inválida. Cabeçalhos esperados: Usuário, Dispositivo.' });
    }

    const existingDevices = await readDBTable('devices');
    const existingAssignments = await readDBTable('assignments');

    let importedCount = 0;

    for (const row of dataRows) {
      if (!row[userIdx] && !row[deviceTypeIdx]) continue; // Skip empty rows

      const user = String(row[userIdx] || '').trim();
      const rawType = String(row[deviceTypeIdx] || '').trim();
      const rawModel = modelIdx !== -1 ? String(row[modelIdx] || '').trim() : '';
      const rawSerial = serialIdx !== -1 ? String(row[serialIdx] || '').trim() : '';
      const campus = campusIdx !== -1 ? String(row[campusIdx] || '').trim() : '';
      const dept = deptIdx !== -1 ? String(row[deptIdx] || '').trim() : '';

      if (!rawType) continue;

      // Map device type
      let mappedType = 'Notebook';
      if (rawType.toLowerCase().includes('macbook')) mappedType = 'MacBook';
      else if (rawType.toLowerCase().includes('ipad') || rawType.toLowerCase().includes('tablet')) mappedType = 'Tablet';
      else if (rawType.toLowerCase().includes('mouse')) mappedType = 'Mouse';
      else if (rawType.toLowerCase().includes('teclado')) mappedType = 'Teclado';
      else if (rawType.toLowerCase().includes('headset') || rawType.toLowerCase().includes('fone')) mappedType = 'Headset';
      else if (rawType.toLowerCase().includes('adaptador')) mappedType = 'Adaptador';
      else if (rawType) mappedType = rawType;

      const serial = rawSerial || `SN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const tag = `EAV-${serial.toUpperCase()}`;
      const model = rawModel || `${mappedType} Padrão`;
      
      const deviceId = Math.random().toString(36).substring(2, 9);
      const isAssigned = !!user;

      // Check if tag already exists in devices to avoid duplicate imports
      if (existingDevices.some(d => String(d.tag ?? '').trim().toLowerCase() === tag.trim().toLowerCase())) {
        continue;
      }

      // 1. Add to devices
      const newDevice = {
        id: deviceId,
        tag,
        serial_number: serial,
        model,
        type: mappedType,
        status: isAssigned ? 'Em Uso' : 'Disponível',
        condition: 'Bom',
        created_at: new Date().toISOString()
      };
      existingDevices.push(newDevice);

      // 2. Add to assignments if user is assigned
      if (isAssigned) {
        const assignId = Math.random().toString(36).substring(2, 9);
        
        // Find or map department
        let deptId = 'ti-dept-id-1'; // default TI
        const deptUpper = dept.toUpperCase();
        if (deptUpper.includes('FINANCEIRO') || deptUpper.includes('FINANCE')) deptId = 'ti-dept-id-8';
        else if (deptUpper.includes('SUPRIMENTOS')) deptId = 'ti-dept-id-9';
        else if (deptUpper.includes('RH')) deptId = 'ti-dept-id-10';
        else if (deptUpper.includes('DP') || deptUpper.includes('DEPARTAMENTO PESSOAL')) deptId = 'ti-dept-id-11';
        else if (deptUpper.includes('ADMISSIONS') || deptUpper.includes('ADMISSAO')) deptId = 'ti-dept-id-12';
        else if (deptUpper.includes('MARKETING') || deptUpper.includes('COMUNICACAO')) deptId = 'ti-dept-id-13';
        else if (deptUpper.includes('GUARITA') || deptUpper.includes('PORTARIA')) deptId = 'ti-dept-id-14';
        else if (deptUpper.includes('DIRETORIA') || deptUpper.includes('DIRETOR')) deptId = 'ti-dept-id-2';
        else if (deptUpper.includes('SECRETARIA') || deptUpper.includes('SECRETARY')) deptId = 'ti-dept-id-3';
        else if (deptUpper.includes('COORDENACAO') || deptUpper.includes('COORDENAÇÃO')) deptId = 'ti-dept-id-4';
        else if (deptUpper.includes('DOCENTES') || deptUpper.includes('PROFESSOR')) deptId = 'ti-dept-id-5';
        else if (deptUpper.includes('DISCENTES') || deptUpper.includes('ALUNO')) deptId = 'ti-dept-id-6';
        else if (deptUpper.includes('MANUTENCAO') || deptUpper.includes('MANUTENÇÃO')) deptId = 'ti-dept-id-7';

        const newAssignment = {
          id: assignId,
          device_id: deviceId,
          user_name: user,
          department_id: deptId,
          assigned_at: new Date().toISOString(),
          returned_at: '',
          return_photo_url: '',
          user_role: 'Colaborador',
          grade: '',
          campus: campus
        };
        existingAssignments.push(newAssignment);
      }

      importedCount++;
    }

    await writeDBTable('devices', existingDevices);
    await writeDBTable('assignments', existingAssignments);

    console.log(`[GoogleSheets] Importação concluída! ${importedCount} dispositivos importados.`);
    res.json({ message: `Sucesso! Importados ${importedCount} dispositivos e configurados no sistema.`, count: importedCount });
  } catch (err) {
    console.error('[GoogleSheets] Falha ao importar planilha legada:', err);
    res.status(500).json({ error: `Erro na importação: ${err.message}` });
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
