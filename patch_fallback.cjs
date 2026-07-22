const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const replacement = `
  const dbDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  function getCollectionPath(collection: string) {
    return path.join(dbDir, \`\${collection}.json\`);
  }

  let pool: mysql.Pool | null = null;
  let useMySQL = false;

  async function initDB() {
    if (!process.env.DB_HOST || !process.env.DB_USER) {
      console.log("MySQL credentials not provided, using local JSON fallback.");
      return;
    }

    try {
      const testPool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'my_database',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      const connection = await testPool.getConnection();
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
      pool = testPool;
      useMySQL = true;
    } catch (err: any) {
      console.error("MySQL connection error:", err.message);
      console.log("Falling back to local JSON file storage.");
    }
  }

  // Initialize DB asynchronously but don't block server startup
  initDB();

  async function readCollection(collection: string): Promise<any[]> {
    if (useMySQL && pool) {
      try {
        const [rows] = await pool.query('SELECT data FROM collections WHERE collection_name = ?', [collection]);
        return (rows as any[]).map(r => r.data);
      } catch (err: any) {
        console.error(\`Error reading collection \${collection} from MySQL:\`, err.message);
        return [];
      }
    } else {
      const filePath = getCollectionPath(collection);
      if (!fs.existsSync(filePath)) {
        return [];
      }
      try {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
      } catch (e) {
        console.error(\`Error reading collection \${collection} from JSON:\`, e);
        return [];
      }
    }
  }

  async function writeCollection(collection: string, data: any[]) {
    if (useMySQL && pool) {
      let connection;
      try {
        connection = await pool.getConnection();
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
      } catch (err: any) {
        if (connection) await connection.rollback();
        console.error(\`Error writing collection \${collection} to MySQL:\`, err.message);
      } finally {
        if (connection) connection.release();
      }
    } else {
      const filePath = getCollectionPath(collection);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    }
  }
`;

content = content.replace(/let pool: mysql\.Pool;[\s\S]*?async function writeCollection[\s\S]*?\}\n  \}/, replacement);

fs.writeFileSync('server.ts', content);
console.log("Patched server.ts with fallback");
