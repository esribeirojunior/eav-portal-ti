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

async function run() {
  const client = getSheetsClient();
  let devices = [];

  if (client) {
    console.log("Lendo tabela devices do Google Sheets...");
    const response = await client.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'devices!A:Z'
    });
    devices = valuesToJSON(response.data.values);
  } else {
    console.log("Lendo tabela devices do Excel local...");
    const wb = XLSX.readFile(EXCEL_PATH);
    const sheet = wb.Sheets['devices'];
    devices = XLSX.utils.sheet_to_json(sheet);
  }

  const outros = devices.filter(d => d.type === 'Outro' || !d.type);
  console.log(`\nEncontrados ${outros.length} dispositivos marcados como 'Outro':`);
  outros.forEach(d => {
    console.log(`- ID: ${d.id} | Tag: ${d.tag} | Modelo: "${d.model}" | Atual: "${d.type}"`);
  });
}

run().catch(console.error);
