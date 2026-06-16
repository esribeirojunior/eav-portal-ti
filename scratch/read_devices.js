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

async function run() {
  const client = getSheetsClient();
  if (client) {
    console.log("Conectado ao Google Sheets. Lendo tabela devices...");
    const response = await client.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'devices!A:Z'
    });
    const rows = response.data.values;
    const headers = rows[0];
    const devices = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });
    const dellE22 = devices.filter(d => d.model && d.model.includes('E22'));
    console.log("Dispositivos Dell E22 no Google Sheets:", JSON.stringify(dellE22, null, 2));
  } else {
    console.log("Lendo tabela devices do Excel local...");
    const wb = XLSX.readFile(EXCEL_PATH);
    const sheet = wb.Sheets['devices'];
    const devices = XLSX.utils.sheet_to_json(sheet);
    const dellE22 = devices.filter(d => d.model && d.model.includes('E22'));
    console.log("Dispositivos Dell E22 no Excel:", JSON.stringify(dellE22, null, 2));
  }
}

run();
