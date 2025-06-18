const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const seedFile = path.join(__dirname, '../../seeds/sample-data.sql');

async function runSeed() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await client.connect();

    const sql = fs.readFileSync(seedFile, 'utf8');
    console.log('Seeding database...');
    await client.query(sql);

    console.log('✅ Seeding complete');
  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await client.end();
  }
}

runSeed();
