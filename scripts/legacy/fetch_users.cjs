const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const SPREADSHEET_ID = '1uNLKLitQLRCf1bwVZ9Gy-VnZttUp7HybYxMypFaz0Yg';
const CREDENTIALS_PATH = path.join(process.cwd(), 'data', 'google-credentials.json');
const DB_PATH = path.join(process.cwd(), 'data', 'inventario.db');

async function fetchUsers() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error('Credenciais do Google não encontradas:', CREDENTIALS_PATH);
    return;
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const client = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  const sheets = google.sheets({ version: 'v4', auth: client });

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'authorized_users!A:Z',
    });

    const rows = res.data.values;
    if (!rows || rows.length < 2) {
      console.log('Nenhum usuário encontrado na planilha do Google.');
      return;
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    const db = new Database(DB_PATH);
    
    // Deleta o admin padrão que havíamos criado para não dar conflito, e insere os reais
    db.prepare('DELETE FROM authorized_users').run();
    
    const insertStmt = db.prepare('INSERT OR IGNORE INTO authorized_users (id, email, password, created_at) VALUES (?, ?, ?, ?)');
    
    let count = 0;
    db.transaction(() => {
      for (const row of dataRows) {
        const id = row[headers.indexOf('id')];
        const email = row[headers.indexOf('email')];
        const password = row[headers.indexOf('password')];
        const created_at = row[headers.indexOf('created_at')];
        
        if (id && email) {
          insertStmt.run(id, email, password, created_at);
          count++;
        }
      }
    })();

    console.log(`Sucesso! Importados ${count} usuários do Google Sheets para o SQLite.`);
  } catch (err) {
    console.error('Erro ao buscar do Google Sheets:', err);
  }
}

fetchUsers();
