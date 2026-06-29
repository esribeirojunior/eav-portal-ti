import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Client } = pg;

// Get connection string from argument, or environment
const postgresUrl = process.argv[2] || process.env.DATABASE_URL || process.env.DATABASE_URL_EXTERNAL;

if (!postgresUrl) {
  console.error('\n❌ Erro: Por favor, forneça a URL de conexão do PostgreSQL como argumento.');
  console.error('Exemplo: node scratch/repair_database_encoding.js "postgres://postgres:senha@IP_DO_SERVIDOR:PORTA/postgres"\n');
  process.exit(1);
}

const replacements = [
  // 1. Tabela: department
  { table: 'department', column: 'name', from: 'DIREÃÃO', to: 'DIREÇÃO' },
  { table: 'department', column: 'name', from: 'RECEPÃÃO', to: 'RECEPÇÃO' },
  { table: 'department', column: 'name', from: 'COORDENAÃÃO', to: 'COORDENAÇÃO' },
  { table: 'department', column: 'name', from: 'COORDENAÃÃO', to: 'COORDENAÇÃO' },
  { table: 'department', column: 'name', from: 'MANUTENÃÃO', to: 'MANUTENÇÃO' },
  { table: 'department', column: 'name', from: 'MANUTENÃÃO', to: 'MANUTENÇÃO' },
  { table: 'department', column: 'name', from: 'DIREÃÃO', to: 'DIREÇÃO' },
  { table: 'department', column: 'name', from: 'RECEPÃÃO', to: 'RECEPÇÃO' },
  { table: 'department', column: 'name', from: 'ÃÃ', to: 'ÇÃO' },
  { table: 'department', column: 'name', from: 'ÃÃ', to: 'ÇÃO' },
  { table: 'department', column: 'name', from: 'Ã', to: 'Ç' },
  { table: 'department', column: 'name', from: 'Ã', to: 'Ã' },

  // 2. Tabela: assignments
  { table: 'assignments', column: 'user_name', from: 'DIREÃÃO', to: 'DIREÇÃO' },
  { table: 'assignments', column: 'user_name', from: 'RECEPÃÃO', to: 'RECEPÇÃO' },
  { table: 'assignments', column: 'user_name', from: 'COORDENAÃÃO', to: 'COORDENAÇÃO' },
  { table: 'assignments', column: 'user_name', from: 'COORDENAÃÃO', to: 'COORDENAÇÃO' },
  { table: 'assignments', column: 'user_name', from: 'MANUTENÃÃO', to: 'MANUTENÇÃO' },
  { table: 'assignments', column: 'user_name', from: 'MANUTENÃÃO', to: 'MANUTENÇÃO' },
  { table: 'assignments', column: 'user_name', from: 'DIREÃÃO', to: 'DIREÇÃO' },
  { table: 'assignments', column: 'user_name', from: 'RECEPÃÃO', to: 'RECEPÇÃO' },
  { table: 'assignments', column: 'user_name', from: 'ÃÃ', to: 'ÇÃO' },
  { table: 'assignments', column: 'user_name', from: 'ÃÃ', to: 'ÇÃO' },
  { table: 'assignments', column: 'user_name', from: 'Ã', to: 'Ç' },
  { table: 'assignments', column: 'user_name', from: 'Ã', to: 'Ã' },

  { table: 'assignments', column: 'grade', from: 'ÃÃ', to: 'ÇÃO' },
  { table: 'assignments', column: 'grade', from: 'ÃÃ', to: 'ÇÃO' },
  { table: 'assignments', column: 'grade', from: 'Ã', to: 'Ç' },
  { table: 'assignments', column: 'grade', from: 'Ã', to: 'Ã' },

  { table: 'assignments', column: 'campus', from: 'ÃÃ', to: 'ÇÃO' },
  { table: 'assignments', column: 'campus', from: 'ÃÃ', to: 'ÇÃO' },
  { table: 'assignments', column: 'campus', from: 'Ã', to: 'Ç' },
  { table: 'assignments', column: 'campus', from: 'Ã', to: 'Ã' },

  // 3. Tabela: devices
  { table: 'devices', column: 'model', from: 'ÃÃ', to: 'ÇÃO' },
  { table: 'devices', column: 'model', from: 'ÃÃ', to: 'ÇÃO' },
  { table: 'devices', column: 'model', from: 'Ã', to: 'Ç' },
  { table: 'devices', column: 'model', from: 'Ã', to: 'Ã' },

  { table: 'devices', column: 'condition', from: 'ÃÃ', to: 'ÇÃO' },
  { table: 'devices', column: 'condition', from: 'ÃÃ', to: 'ÇÃO' },
  { table: 'devices', column: 'condition', from: 'Ã', to: 'Ç' },
  { table: 'devices', column: 'condition', from: 'Ã', to: 'Ã' },

  // 4. Tabela: shortcuts
  { table: 'shortcuts', column: 'title', from: 'ÃÃ', to: 'ÇÃO' },
  { table: 'shortcuts', column: 'title', from: 'ÃÃ', to: 'ÇÃO' },
  { table: 'shortcuts', column: 'title', from: 'Ã', to: 'Ç' },
  { table: 'shortcuts', column: 'title', from: 'Ã', to: 'Ã' },
  { table: 'shortcuts', column: 'description', from: 'ÃÃ', to: 'ÇÃO' },
  { table: 'shortcuts', column: 'description', from: 'ÃÃ', to: 'ÇÃO' },
  { table: 'shortcuts', column: 'description', from: 'Ã', to: 'Ç' },
  { table: 'shortcuts', column: 'description', from: 'Ã', to: 'Ã' }
];

async function run() {
  console.log(`🔌 Conectando ao banco de dados PostgreSQL...`);
  
  // Use ssl configuration for external postgres if not localhost
  const useSsl = !postgresUrl.includes('localhost') && !postgresUrl.includes('127.0.0.1');
  const client = new Client({ 
    connectionString: postgresUrl,
    ssl: useSsl ? { rejectUnauthorized: false } : false
  });
  
  await client.connect();
  console.log('✅ Conectado com sucesso!');

  console.log('\n🧹 Iniciando limpeza de codificação no banco de dados...');

  let totalUpdated = 0;

  for (const item of replacements) {
    try {
      // Check if table and column exist in the database
      const checkCol = await client.query(`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = $1 AND column_name = $2
        );
      `, [item.table, item.column]);

      if (!checkCol.rows[0].exists) {
        continue; // skip if table/col doesn't exist
      }

      // Execute SQL update using replace
      const query = `
        UPDATE ${item.table} 
        SET ${item.column} = REPLACE(${item.column}, $1, $2)
        WHERE ${item.column} LIKE $3
      `;
      
      const searchPattern = `%${item.from}%`;
      const res = await client.query(query, [item.from, item.to, searchPattern]);
      
      if (res.rowCount > 0) {
        console.log(`✨ [${item.table}.${item.column}] Corrigido "${item.from}" -> "${item.to}" em ${res.rowCount} linhas.`);
        totalUpdated += res.rowCount;
      }
    } catch (err) {
      console.error(`❌ Erro ao atualizar ${item.table}.${item.column} ("${item.from}" -> "${item.to}"):`, err.message);
    }
  }

  console.log(`\n🎉 Limpeza concluída! Total de linhas afetadas: ${totalUpdated}\n`);
  
  await client.end();
}

run().catch(err => {
  console.error('\n❌ Erro geral ao rodar o script:', err);
  process.exit(1);
});
