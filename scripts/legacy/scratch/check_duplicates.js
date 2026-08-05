import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function check() {
  await client.connect();
  console.log('Conectado ao PostgreSQL.');

  const tagsRes = await client.query(`
    SELECT tag, COUNT(*) 
    FROM devices 
    GROUP BY tag 
    HAVING COUNT(*) > 1
  `);
  console.log('Tags duplicadas:', tagsRes.rows);

  const serialsRes = await client.query(`
    SELECT serial_number, COUNT(*) 
    FROM devices 
    GROUP BY serial_number 
    HAVING COUNT(*) > 1
  `);
  console.log('Serials duplicados:', serialsRes.rows);

  await client.end();
}

check().catch(console.error);
