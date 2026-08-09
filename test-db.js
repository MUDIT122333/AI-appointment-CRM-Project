require('dotenv').config();
const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);

async function testConnection() {
  try {
    const result = await sql`
      SELECT NOW() AS current_time
    `;

    console.log('✅ Supabase connected successfully!');
    console.log(result);

    await sql.end();
  } catch (error) {
    console.error('❌ Supabase connection failed');
    console.error(error);
  }
}

testConnection();