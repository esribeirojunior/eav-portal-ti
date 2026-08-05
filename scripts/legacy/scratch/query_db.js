import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Client } = pg;
const postgresUrl = process.argv[3] || process.env.DATABASE_URL || process.env.DATABASE_URL_EXTERNAL;

if (!postgresUrl) {
  console.error('❌ Erro: DATABASE_URL não encontrada.');
  process.exit(1);
}

const query = process.argv[2] || 'SELECT * FROM department LIMIT 10';

async function run() {
  const client = new Client({ connectionString: postgresUrl });
  await client.connect();
  console.log(`🔍 Executando: "${query}"...\n`);
  const res = await client.query(query);
  if (res.rows.length === 0) {
    console.log('Nenhum resultado encontrado.');
  } else {
    console.table(res.rows);
  }
  await client.end();
}

run().catch(err => {
  console.error('❌ Erro ao executar query:', err.message);
  process.exit(1);
});
