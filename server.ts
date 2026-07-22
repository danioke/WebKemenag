
import express from 'express';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
function getCollectionPath(collection: string) {
  return path.join(dbDir, `${collection}.json`);
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
    await connection.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id VARCHAR(255) NOT NULL,
        collection_name VARCHAR(255) NOT NULL,
        data JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (collection_name, id)
      )
    `);
    connection.release();
    console.log("Connected to MySQL database and verified collections table.");
    pool = testPool;
    useMySQL = true;
  } catch (err: any) {
    console.error("MySQL connection error:", err.message);
    console.log("Falling back to local JSON file storage.");
  }
}
initDB();

function parseDBData(dataRaw: any) {
  if (typeof dataRaw === 'string') {
    try {
      return JSON.parse(dataRaw);
    } catch (e) {
      return {};
    }
  }
  return dataRaw;
}

async function readCollection(collection: string): Promise<any[]> {
  if (useMySQL && pool) {
    try {
      const [rows] = await pool.query('SELECT data FROM collections WHERE collection_name = ?', [collection]);
      return (rows as any[]).map(r => parseDBData(r.data));
    } catch (err: any) {
      console.error(`Error reading collection ${collection} from MySQL:`, err.message);
      return [];
    }
  } else {
    const filePath = getCollectionPath(collection);
    if (!fs.existsSync(filePath)) return [];
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (e) {
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
      console.error(`Error writing collection ${collection} to MySQL:`, err.message);
    } finally {
      if (connection) connection.release();
    }
  } else {
    const filePath = getCollectionPath(collection);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  }
}

// GET entire collection
app.get("/api/db/:collection", async (req, res) => {
  try {
    const data = await readCollection(req.params.collection);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET a single document by ID
app.get("/api/db/:collection/:id", async (req, res) => {
  try {
    const data = await readCollection(req.params.collection);
    const item = data.find((i: any) => i.id === req.params.id);
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST (create) a new document
app.post("/api/db/:collection", async (req, res) => {
  try {
    const data = await readCollection(req.params.collection);
    const body = req.body || {};
    const id = body.id || Math.random().toString(36).substring(2, 15);
    const newItem = { ...body, id };
    data.push(newItem);
    await writeCollection(req.params.collection, data);
    res.json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/db/newsletter_sent_logs/clear', async (req, res) => {
  try {
    await writeCollection('newsletter_sent_logs', []);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT/POST (update/set) a document by ID
const updateHandler = async (req: any, res: any) => {
  try {
    const data = await readCollection(req.params.collection);
    const index = data.findIndex((i: any) => i.id === req.params.id);
    if (index !== -1) {
      data[index] = { ...data[index], ...req.body, id: req.params.id };
    } else {
      data.push({ ...req.body, id: req.params.id });
    }
    await writeCollection(req.params.collection, data);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
app.put("/api/db/:collection/:id", updateHandler);
app.post("/api/db/:collection/:id", updateHandler);

// DELETE a document by ID
app.post("/api/db/:collection/:id/delete", async (req, res) => {
  try {
    let data = await readCollection(req.params.collection);
    data = data.filter((i: any) => i.id !== req.params.id);
    await writeCollection(req.params.collection, data);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// POST local authentication login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (password === 'kemenagoki123') {
    res.json({
      uid: "admin-uid",
      email: email || "anisreza498@gmail.com",
      displayName: "Super Admin (Anis Reza)",
      role: "admin",
      photoURL: "https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff",
    });
  } else {
    res.status(401).json({ error: "Password salah!" });
  }
});


app.post('/api/videos/auto-fetch', (req, res) => {
  res.json({ fetchedCount: 0 });
});

// MEDIA ROUTES
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.get('/api/files', (req, res) => {
  try {
    const type = req.query.type as string || '';
    const files = fs.readdirSync(uploadsDir).map(file => {
      const stats = fs.statSync(path.join(uploadsDir, file));
      const mime = file.endsWith('.pdf') ? 'application/pdf' : 
                   file.match(/.(mp4|webm)$/i) ? 'video/mp4' : 
                   'image/jpeg';
      return {
        id: file,
        name: file,
        url: `/uploads/${file}`,
        size: (stats.size / 1024).toFixed(2) + ' KB',
        mimeType: mime
      };
    });
    
    // basic filter
    let filtered = files;
    if (type === 'og_image') {
      filtered = files.filter(f => f.id.includes('-og.'));
    } else {
      filtered = files.filter(f => !f.id.includes('-og.'));
      if (type === 'pdf' || type === 'dokumen') {
         filtered = filtered.filter(f => f.mimeType === 'application/pdf');
      } else if (type === 'video') {
         filtered = filtered.filter(f => f.mimeType.startsWith('video/'));
      } else if (type) {
         filtered = filtered.filter(f => f.mimeType.startsWith('image/'));
      }
    }
    res.json(filtered);
  } catch (err) {
    res.json([]);
  }
});

app.delete('/api/files/:cat/:filename', (req, res) => {
  try {
    fs.unlinkSync(path.join(uploadsDir, req.params.filename));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

app.post('/api/newsletter/send', (req, res) => {
  res.json({ success: true, message: "Mock sent" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
