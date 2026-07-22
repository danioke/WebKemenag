const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// Add mysql import at the top
content = content.replace('import express from "express";', `import express from "express";\nimport mysql from "mysql2/promise";\nimport dotenv from "dotenv";\ndotenv.config();\n`);

// Replace the readCollection / writeCollection
const newDbLogic = `
  let pool: mysql.Pool;

  async function initDB() {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'my_database',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    try {
      const connection = await pool.getConnection();
      await connection.query(\`
        CREATE TABLE IF NOT EXISTS collections (
          id VARCHAR(255) NOT NULL,
          collection_name VARCHAR(255) NOT NULL,
          data JSON NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (collection_name, id)
        )
      \`);
      connection.release();
      console.log("Connected to MySQL database and verified collections table.");
    } catch (err) {
      console.error("MySQL connection error:", err);
    }
  }

  // Initialize DB asynchronously but don't block server startup
  initDB();

  async function readCollection(collection: string): Promise<any[]> {
    if (!pool) return [];
    try {
      const [rows] = await pool.query('SELECT data FROM collections WHERE collection_name = ?', [collection]);
      return (rows as any[]).map(r => r.data);
    } catch (err) {
      console.error(\`Error reading collection \${collection}:\`, err);
      return [];
    }
  }

  async function writeCollection(collection: string, data: any[]) {
    if (!pool) return;
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('DELETE FROM collections WHERE collection_name = ?', [collection]);
      
      if (data.length > 0) {
        for (const item of data) {
          const id = item.id || Math.random().toString(36).substring(2, 15);
          await connection.query(
            'INSERT INTO collections (id, collection_name, data) VALUES (?, ?, ?)',
            [id, collection, JSON.stringify(item)]
          );
        }
      }
      
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      console.error(\`Error writing collection \${collection}:\`, err);
    } finally {
      connection.release();
    }
  }
`;

// we need to replace the block from `const dbDir` to the end of `async function writeCollection`
// Let's use regex
content = content.replace(/const dbDir = path\.join[\s\S]*?async function writeCollection[\s\S]*?\}\n/, newDbLogic);

fs.writeFileSync('server.ts', content);
console.log("Patched server.ts");
