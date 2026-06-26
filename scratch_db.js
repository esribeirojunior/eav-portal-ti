import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='authorized_users';
    `);
    console.log("Columns:", res.rows.map(r => r.column_name));
    
    // Attempt to add column
    try {
      await pool.query("ALTER TABLE authorized_users ADD COLUMN role TEXT DEFAULT 'admin'");
      console.log("Column added.");
    } catch(e) {
      console.log("Column likely exists:", e.message);
    }
    
    // Update user
    await pool.query("UPDATE authorized_users SET role = 'superadmin' WHERE email ILIKE '%erisson.junior%'");
    
    // Verify
    const users = await pool.query('SELECT email, role FROM authorized_users');
    console.log("Users:", users.rows);
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}
run();
