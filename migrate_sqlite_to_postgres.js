import Database from 'better-sqlite3';
import pg from 'pg';
import path from 'path';

const { Client } = pg;

const sqliteDbPath = path.join(process.cwd(), 'data', 'inventario.db');
const postgresUrl = process.argv[2] || process.env.DATABASE_URL_EXTERNAL;

if (!postgresUrl) {
  console.error('Erro: Por favor, forneça a URL de conexão externa do PostgreSQL.');
  console.error('Exemplo: node migrate_sqlite_to_postgres.js "postgres://postgres:senha@IP_DO_SERVIDOR:PORTA/postgres"');
  process.exit(1);
}

async function migrate() {
  console.log(`Iniciando migração de SQLite (${sqliteDbPath}) para PostgreSQL...`);
  
  const sqliteDb = new Database(sqliteDbPath);
  const pgClient = new Client({ connectionString: postgresUrl });
  
  await pgClient.connect();
  console.log('Conectado ao PostgreSQL remoto com sucesso.');

  // 1. Criar tabelas no Postgres se não existirem
  console.log('Criando tabelas no PostgreSQL...');
  await pgClient.query(`
    CREATE TABLE IF NOT EXISTS devices (id TEXT PRIMARY KEY, tag TEXT, serial_number TEXT, model TEXT, type TEXT, status TEXT, condition TEXT, last_seen TEXT, created_at TEXT);
    CREATE TABLE IF NOT EXISTS assignments (id TEXT PRIMARY KEY, device_id TEXT, user_name TEXT, department_id TEXT, assigned_at TEXT, returned_at TEXT, return_photo_url TEXT, user_role TEXT, grade TEXT, campus TEXT, created_at TEXT);
    CREATE TABLE IF NOT EXISTS department (id TEXT PRIMARY KEY, name TEXT);
    CREATE TABLE IF NOT EXISTS shortcuts (id TEXT PRIMARY KEY, title TEXT, description TEXT, url TEXT, icon_name TEXT, color TEXT, campus TEXT);
    CREATE TABLE IF NOT EXISTS authorized_users (id TEXT PRIMARY KEY, email TEXT, password TEXT, created_at TEXT);
    CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, user_email TEXT, action TEXT, details TEXT, resource_type TEXT, resource_id TEXT, created_at TEXT);
  `);

  const tables = ['devices', 'assignments', 'department', 'shortcuts', 'authorized_users', 'audit_logs'];

  for (const table of tables) {
    console.log(`Migrando tabela: ${table}...`);
    // Pegar dados do SQLite
    const rows = sqliteDb.prepare(`SELECT * FROM ${table}`).all();
    console.log(`- Encontrados ${rows.length} registros no SQLite.`);

    // Limpar tabela no Postgres antes de importar
    await pgClient.query(`DELETE FROM ${table}`);

    if (rows.length === 0) continue;

    // Inserir dados no Postgres
    const keys = Object.keys(rows[0]);
    const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');
    const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;

    for (const row of rows) {
      const values = keys.map(k => row[k]);
      await pgClient.query(query, values);
    }
    console.log(`- Tabela ${table} migrada com sucesso!`);
  }

  console.log('Migração concluída com sucesso!');
  await pgClient.end();
  sqliteDb.close();
}

migrate().catch(err => {
  console.error('Erro durante a migração:', err);
  process.exit(1);
});
