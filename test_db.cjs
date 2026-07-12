const mysql = require('mysql2/promise');
require('dotenv').config();
async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost', user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', database: process.env.DB_NAME || 'my_database'
  });
  const [rows] = await pool.query("SELECT data FROM collections LIMIT 1");
  if (rows.length > 0) {
    console.log(typeof rows[0].data);
    console.log(rows[0].data);
  } else {
    console.log("Empty DB");
  }
  process.exit(0);
}
run();
