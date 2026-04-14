import 'dotenv/config';
import { Pool } from 'pg';

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not defined');
    return;
  }
  console.log('Testing connection to:', connectionString.replace(/:([^@]+)@/, ':****@'));

  const pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const client = await pool.connect();
    console.log('Successfully connected to the database');
    const res = await client.query('SELECT NOW()');
    console.log('Query result:', res.rows[0]);
    client.release();
  } catch (err) {
    console.error('Connection error:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    await pool.end();
  }
}

testConnection();
