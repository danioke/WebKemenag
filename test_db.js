const mysql = require('mysql2/promise');
require('dotenv').config();
async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME
  });
  const [rows] = await pool.query("SELECT data FROM collections WHERE collection_name = 'navigation' LIMIT 1");
  console.log(typeof rows[0].data);
  console.log(rows[0].data);
  process.exit(0);
}
run();
