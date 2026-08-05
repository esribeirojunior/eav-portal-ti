import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'inventario.db');
const db = new Database(dbPath);

console.log('--- BUSCANDO POR RAFA NO BANCO DE DADOS SQLITE ---');

// Listar todas as tabelas
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tabelas no banco:', tables.map(t => t.name).join(', '));

for (const table of tables) {
    try {
        const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
        const textCols = columns.filter(c => c.type === 'TEXT').map(c => c.name);
        if (textCols.length === 0) continue;

        const whereClause = textCols.map(c => `"${c}" LIKE '%rafa%'`).join(' OR ');
        const query = `SELECT * FROM "${table.name}" WHERE ${whereClause}`;
        const results = db.prepare(query).all();
        
        if (results.length > 0) {
            console.log(`\n[Tabela: ${table.name}] Encontrado ${results.length} registros:`);
            console.log(JSON.stringify(results, null, 2));
        }
    } catch (e) {
        console.error(`Erro ao buscar na tabela ${table.name}:`, e.message);
    }
}
