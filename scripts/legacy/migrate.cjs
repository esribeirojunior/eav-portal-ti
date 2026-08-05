const fs = require('fs');
const path = require('path');

const serverFile = path.join(process.cwd(), 'server.js');
let content = fs.readFileSync(serverFile, 'utf-8');

// 1. Remove googleapis
content = content.replace(/import \{ google \} from 'googleapis';\n?/g, '');

const dbBlock = `// --- SQLITE DATABASE SYSTEM ---
import Database from 'better-sqlite3';
import XLSX from 'xlsx';

const DB_PATH = path.join(DATA_DIR, 'inventario.db');
const EXCEL_PATH = path.join(DATA_DIR, 'inventario.xlsx');

const db = new Database(DB_PATH, { verbose: null });

function initSQLiteDB() {
  db.pragma('journal_mode = WAL');
  
  db.exec(\`
    CREATE TABLE IF NOT EXISTS devices (id TEXT PRIMARY KEY, tag TEXT, serial_number TEXT, model TEXT, type TEXT, status TEXT, condition TEXT, last_seen TEXT, created_at TEXT);
    CREATE TABLE IF NOT EXISTS assignments (id TEXT PRIMARY KEY, device_id TEXT, user_name TEXT, department_id TEXT, assigned_at TEXT, returned_at TEXT, return_photo_url TEXT, user_role TEXT, grade TEXT, campus TEXT);
    CREATE TABLE IF NOT EXISTS department (id TEXT PRIMARY KEY, name TEXT);
    CREATE TABLE IF NOT EXISTS shortcuts (id TEXT PRIMARY KEY, title TEXT, description TEXT, url TEXT, icon_name TEXT, color TEXT, campus TEXT);
    CREATE TABLE IF NOT EXISTS authorized_users (id TEXT PRIMARY KEY, email TEXT, password TEXT, created_at TEXT);
    CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, user_email TEXT, action TEXT, details TEXT, resource_type TEXT, resource_id TEXT, created_at TEXT);
  \`);

  const deptCount = db.prepare('SELECT count(*) as count FROM department').get().count;
  if (deptCount === 0 && fs.existsSync(EXCEL_PATH)) {
    console.log('[SQLite] Banco novo detectado. Migrando dados do Excel antigo...');
    try {
      const wb = XLSX.readFile(EXCEL_PATH);
      const tables = ['devices', 'assignments', 'department', 'shortcuts', 'authorized_users', 'audit_logs'];
      
      db.transaction(() => {
        for (const table of tables) {
          if (!wb.Sheets[table]) continue;
          const rows = XLSX.utils.sheet_to_json(wb.Sheets[table]);
          if (rows.length === 0) continue;
          
          const keys = Object.keys(rows[0]);
          if (keys.length === 0) continue;
          
          const placeholders = keys.map(() => '?').join(', ');
          const stmt = db.prepare(\`INSERT OR IGNORE INTO \${table} (\${keys.join(', ')}) VALUES (\${placeholders})\`);
          
          for (const row of rows) {
            stmt.run(keys.map(k => row[k] == null ? '' : String(row[k])));
          }
          console.log(\`[SQLite] Migrado \${rows.length} registros para \${table}\`);
        }
      })();
      console.log('[SQLite] Migração concluída com sucesso!');
      db.prepare('INSERT INTO authorized_users (id, email, password, created_at) VALUES (?, ?, ?, ?)').run('admin', 'admin@admin.com', 'admin123', new Date().toISOString());
      console.log('[SQLite] Usuário admin padrão inserido com sucesso.');
    } catch (err) {
      console.error('[SQLite] Erro:', err);
    }
  }
}

initSQLiteDB();

async function readDBTable(sheetName) {
  try {
    return db.prepare(\`SELECT * FROM \${sheetName}\`).all();
  } catch(e) {
    console.error(\`Erro lendo \${sheetName}:\`, e);
    return [];
  }
}

async function writeDBTable(sheetName, data) {
  try {
    if (!data || data.length === 0) {
      db.prepare(\`DELETE FROM \${sheetName}\`).run();
      return;
    }
    const keys = Object.keys(data[0]);
    if (keys.length === 0) return;
    
    db.transaction(() => {
      db.prepare(\`DELETE FROM \${sheetName}\`).run();
      const placeholders = keys.map(() => '?').join(', ');
      const stmt = db.prepare(\`INSERT INTO \${sheetName} (\${keys.join(', ')}) VALUES (\${placeholders})\`);
      for (const row of data) {
        stmt.run(keys.map(k => row[k] == null ? '' : String(row[k])));
      }
    })();
  } catch (e) {
    console.error(\`Erro escrevendo:\`, e);
  }
}

const dbConnection = db;
`;

const startIndex = content.indexOf('// --- EXCEL & GOOGLE SHEETS DATABASE SYSTEM ---');
const endIndex = content.indexOf('// --- CONTROLE DE SESSÕES & AUTENTICAÇÃO ---');
content = content.substring(0, startIndex) + dbBlock + content.substring(endIndex);

const apiDbStart = content.indexOf("app.post('/api/db'");
const apiDbEndString = "});\r\n\r\n\r\n// Endpoint para sincronização";
const apiDbEndString2 = "});\n\n\n// Endpoint para sincronização";
let apiDbEnd = content.indexOf(apiDbEndString);
if (apiDbEnd === -1) apiDbEnd = content.indexOf(apiDbEndString2);

const newApiDb = `app.post('/api/db', authenticateToken, async (req, res) => {
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
      whereClause = 'WHERE ' + filterKeys.map(k => \`\${k} = ?\`).join(' AND ');
      params.push(...filterKeys.map(k => filters[k]));
    }
    
    if (ilikeCol && ilikeVal) {
      whereClause += (whereClause ? ' AND ' : 'WHERE ') + \`\${ilikeCol} LIKE ?\`;
      params.push(\`%\${ilikeVal.replace(/%/g, '')}%\`);
    }

    if (isDelete) {
      const info = dbConnection.prepare(\`DELETE FROM \${table} \${whereClause}\`).run(...params);
      sendRealtimeUpdate(table);
      return res.json({ data: null, error: null });
    }

    if (updateData) {
      const updateKeys = Object.keys(updateData);
      const setClause = updateKeys.map(k => \`\${k} = ?\`).join(', ');
      const updateParams = updateKeys.map(k => updateData[k]);
      dbConnection.prepare(\`UPDATE \${table} SET \${setClause} \${whereClause}\`).run(...updateParams, ...params);
      sendRealtimeUpdate(table);
      const updatedData = dbConnection.prepare(\`SELECT * FROM \${table} \${whereClause}\`).all(...params);
      return res.json({ data: isSingle ? updatedData[0] : updatedData, error: null });
    }

    if (insertData) {
      const newItems = Array.isArray(insertData) ? insertData : [insertData];
      const results = [];
      dbConnection.transaction(() => {
        for (const item of newItems) {
          const finalItem = { ...item };
          if (!finalItem.id) finalItem.id = Math.random().toString(36).substring(2, 9);
          if (!finalItem.created_at && !isUpsert) finalItem.created_at = new Date().toISOString();
          
          let conflictClause = '';
          if (isUpsert) {
             const updateCols = Object.keys(finalItem).filter(k => k !== 'id').map(k => \`\${k}=excluded.\${k}\`).join(', ');
             conflictClause = \`ON CONFLICT(id) DO UPDATE SET \${updateCols}\`;
          }
          
          const keys = Object.keys(finalItem);
          const placeholders = keys.map(() => '?').join(', ');
          const values = keys.map(k => finalItem[k]);
          
          dbConnection.prepare(\`INSERT INTO \${table} (\${keys.join(', ')}) VALUES (\${placeholders}) \${conflictClause}\`).run(...values);
          results.push(finalItem);
        }
      })();
      sendRealtimeUpdate(table);
      return res.json({ data: isSingle ? results[0] : results, error: null });
    }

    let orderClause = '';
    if (orderCol) {
       orderClause = \`ORDER BY \${orderCol} \${orderAsc ? 'ASC' : 'DESC'}\`;
    }
    
    let result = dbConnection.prepare(\`SELECT * FROM \${table} \${whereClause} \${orderClause}\`).all(...params);

    if (table === 'devices') {
      const allAssignments = dbConnection.prepare('SELECT * FROM assignments').all();
      const allDepartments = dbConnection.prepare('SELECT * FROM department').all();
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
`;

content = content.substring(0, apiDbStart) + newApiDb + content.substring(apiDbEnd);
fs.writeFileSync(serverFile, content);
console.log('Migration OK');
