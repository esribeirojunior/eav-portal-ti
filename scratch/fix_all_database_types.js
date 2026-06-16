import path from 'path';
import fs from 'fs';
import { google } from 'googleapis';
import XLSX from 'xlsx';

const __dirname = path.resolve();
const DATA_DIR = path.join(__dirname, 'data');
const EXCEL_PATH = path.join(DATA_DIR, 'inventario.xlsx');
const GOOGLE_CREDS_PATH = path.join(DATA_DIR, 'google-credentials.json');
const SPREADSHEET_ID = '1uNLKLitQLRCf1bwVZ9Gy-VnZttUp7HybYxMypFaz0Yg';

function getSheetsClient() {
  if (!fs.existsSync(GOOGLE_CREDS_PATH)) return null;
  try {
    const creds = JSON.parse(fs.readFileSync(GOOGLE_CREDS_PATH, 'utf-8'));
    const auth = new google.auth.JWT({
      email: creds.client_email,
      key: creds.private_key.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    return google.sheets({ version: 'v4', auth });
  } catch (err) {
    console.error("Erro credenciais:", err);
    return null;
  }
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

function getHeadersForSheet(sheetName) {
  switch (sheetName) {
    case 'devices': return ['id', 'tag', 'serial_number', 'model', 'type', 'status', 'condition', 'created_at'];
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

async function run() {
  const client = getSheetsClient();
  let devices = [];
  let useGoogle = false;

  if (client) {
    console.log("Conectado ao Google Sheets. Lendo tabela devices...");
    const response = await client.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'devices!A:Z'
    });
    devices = valuesToJSON(response.data.values);
    useGoogle = true;
  } else {
    console.log("Lendo tabela devices do Excel local...");
    const wb = XLSX.readFile(EXCEL_PATH);
    const sheet = wb.Sheets['devices'];
    devices = XLSX.utils.sheet_to_json(sheet);
  }

  let fixedCount = 0;
  devices = devices.map(d => {
    const modelLower = (d.model || '').toLowerCase().trim();
    if (d.type === 'Outro' || !d.type) {
      // 1. Monitor
      if (
        modelLower.includes('v206hql') ||
        modelLower.includes('v19b') ||
        modelLower.includes('20mk400') ||
        modelLower.includes('p2222h') ||
        modelLower.includes('p2422') ||
        modelLower.includes('lg50um') ||
        modelLower.includes('lg 34') ||
        modelLower.includes('e22')
      ) {
        console.log(`Corrigindo [Monitor]: Tag=${d.tag}, Modelo="${d.model}"`);
        d.type = 'Monitor';
        fixedCount++;
      }
      // 2. MacBook
      else if (modelLower === 'm3' || modelLower.includes('macbook')) {
        console.log(`Corrigindo [MacBook]: Tag=${d.tag}, Modelo="${d.model}"`);
        d.type = 'MacBook';
        fixedCount++;
      }
      // 3. Notebook
      else if (
        modelLower.includes('vostro') ||
        modelLower.includes('latitude') ||
        modelLower.includes('thinkpad') ||
        modelLower.includes('lenovo think') ||
        modelLower.includes('inspiron')
      ) {
        console.log(`Corrigindo [Notebook]: Tag=${d.tag}, Modelo="${d.model}"`);
        d.type = 'Notebook';
        fixedCount++;
      }
    }
    return d;
  });

  if (fixedCount === 0) {
    console.log("Nenhum dispositivo precisou de correção.");
    return;
  }

  console.log(`Total de correções: ${fixedCount}`);

  if (useGoogle) {
    console.log(`Gravando ${devices.length} linhas de volta para o Google Sheets...`);
    const values = jsonTo2DArray(devices, 'devices');
    await client.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'devices!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values }
    });
    // Limpa excesso
    await client.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `devices!A${values.length + 1}:Z`
    });
    console.log("Google Sheets atualizado com sucesso!");
  } else {
    console.log(`Gravando ${devices.length} linhas de volta para o Excel local...`);
    const wb = XLSX.readFile(EXCEL_PATH);
    const newSheet = XLSX.utils.json_to_sheet(devices);
    wb.Sheets['devices'] = newSheet;
    XLSX.writeFile(wb, EXCEL_PATH);
    console.log("Excel local atualizado com sucesso!");
  }
}

run().catch(console.error);
