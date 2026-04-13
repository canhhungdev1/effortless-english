const { Client } = require('pg');

async function testConnection() {
  const url = 'postgresql://postgres:Quynh%40050706@db.hnseanactrpzboxweoui.supabase.co:5432/postgres';
  const client = new Client({
    connectionString: url,
  });

  try {
    console.log('Connecting to 5432...');
    await client.connect();
    console.log('Connected successfully to 5432');
    await client.end();
  } catch (err) {
    console.error('Failed to connect to 5432:', err.message);
  }

  const urlPooler = 'postgresql://postgres:Quynh%40050706@db.hnseanactrpzboxweoui.supabase.co:6543/postgres?sslmode=require';
  const client2 = new Client({
    connectionString: urlPooler,
  });

  try {
    console.log('Connecting to 6543...');
    await client2.connect();
    console.log('Connected successfully to 6543');
    await client2.end();
  } catch (err) {
    console.error('Failed to connect to 6543:', err.message);
  }
}

testConnection();
