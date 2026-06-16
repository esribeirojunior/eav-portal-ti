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
  let users = [];

  if (client) {
    console.log("Lendo authorized_users do Google Sheets...");
    const response = await client.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'authorized_users!A:Z'
    });
    users = valuesToJSON(response.data.values);
  } else {
    console.log("Lendo authorized_users do Excel local...");
    const wb = XLSX.readFile(EXCEL_PATH);
    const sheet = wb.Sheets['authorized_users'];
    users = XLSX.utils.sheet_to_json(sheet);
  }

  console.log("Usuários autorizados encontrados:", JSON.stringify(users, null, 2));
}

run().catch(console.error);
