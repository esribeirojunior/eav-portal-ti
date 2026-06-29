import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const { Client } = pg;

const postgresUrl = process.env.DATABASE_URL;

if (!postgresUrl) {
  console.error('Erro: DATABASE_URL não encontrada no arquivo .env.');
  process.exit(1);
}

async function resetDB() {
  console.log(`Conectando ao PostgreSQL no Coolify...`);

  const client = new Client({ connectionString: postgresUrl });
  await client.connect();
  console.log('Conectado com sucesso!');

  console.log('Limpando as tabelas (zerando o banco)...');

  // Limpa as tabelas. 
  // O usuário pediu para apagar tudo.
  const tablesToClear = [
    'devices',
    'assignments',
    'department',
    'shortcuts',
    'authorized_users',
    'audit_logs'
  ];

  for (const table of tablesToClear) {
    try {
      await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`- Tabela ${table} APAGADA COM SUCESSO.`);
    } catch (err) {
      console.error(`Erro ao apagar a tabela ${table}:`, err);
    }
  }

  console.log('Banco zerado com sucesso! Agora você pode reiniciar a aplicação (para ela criar os itens padrão se tiver apagado tudo) e importar sua planilha novamente.');

  await client.end();
}

resetDB().catch(err => {
  console.error('Erro geral:', err);
  process.exit(1);
});
