import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;

async function startServer() {
  const app = express();

  // Parse JSON bodies
  app.use(express.json());

  // Setup local uploads folders structure
  const uploadDir = path.join(process.cwd(), 'uploads');
  const categories = ['foto', 'video', 'pdf', 'dokumen'];

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  categories.forEach((cat) => {
    const catPath = path.join(uploadDir, cat);
    if (!fs.existsSync(catPath)) {
      fs.mkdirSync(catPath, { recursive: true });
    }
  });

  // Serve uploads statically so the browser can retrieve them directly
  app.use('/uploads', express.static(uploadDir));

  // --- API ROUTES ---

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', storage: 'local_hosting_active' });
  });

  // Setup multer storage engine
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      let category = 'dokumen';
      if (file.mimetype.startsWith('image/')) {
        category = 'foto';
      } else if (file.mimetype.startsWith('video/')) {
        category = 'video';
      } else if (file.mimetype === 'application/pdf') {
        category = 'pdf';
      }
      cb(null, path.join(uploadDir, category));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      // Clean name from special chars
      const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
      cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    },
  });

  const upload = multer({
    storage,
    limits: {
      fileSize: 150 * 1024 * 1024, // 150MB maximum size limit
    },
  });

  // Upload file API
  app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Tidak ada file yang diunggah' });
      }

      const file = req.file;
      let category = 'dokumen';
      if (file.mimetype.startsWith('image/')) {
        category = 'foto';
      } else if (file.mimetype.startsWith('video/')) {
        category = 'video';
      } else if (file.mimetype === 'application/pdf') {
        category = 'pdf';
      }

      const relativeUrl = `/uploads/${category}/${file.filename}`;
      const sizeInKb = Math.round(file.size / 1024);
      const sizeStr = sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`;

      res.json({
        id: file.filename,
        name: file.originalname,
        url: relativeUrl,
        embedUrl: relativeUrl,
        size: sizeStr,
      });
    } catch (err: any) {
      console.error('Error in /api/upload:', err);
      res.status(500).json({ error: 'Gagal mengunggah file ke penyimpanan hosting', details: err.message });
    }
  });

  // Get uploaded files list API
  app.get('/api/files', (req, res) => {
    try {
      const type = (req.query.type as string) || 'all';
      
      let targetCategories: string[] = [];
      if (type === 'image') {
        targetCategories = ['foto'];
      } else if (type === 'video') {
        targetCategories = ['video'];
      } else if (type === 'pdf') {
        targetCategories = ['pdf'];
      } else {
        targetCategories = ['foto', 'video', 'pdf', 'dokumen'];
      }

      const results: any[] = [];

      targetCategories.forEach((cat) => {
        const catPath = path.join(uploadDir, cat);
        if (fs.existsSync(catPath)) {
          const files = fs.readdirSync(catPath);
          files.forEach((filename) => {
            if (filename.startsWith('.')) return; // Skip hidden/system files

            const filePath = path.join(catPath, filename);
            try {
              const stat = fs.statSync(filePath);
              if (stat.isFile()) {
                const sizeInKb = Math.round(stat.size / 1024);
                const sizeStr = sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`;
                const relativeUrl = `/uploads/${cat}/${filename}`;
                
                // Extract original name by removing the trailing timestamp suffix
                const nameParts = filename.split('-');
                let originalName = filename;
                if (nameParts.length > 1) {
                  // Reconstruct original name without the timestamp
                  const ext = path.extname(filename);
                  originalName = nameParts.slice(0, -2).join('-') + ext;
                  if (originalName.startsWith('_') || originalName === ext) {
                    originalName = filename;
                  }
                }

                results.push({
                  id: filename,
                  name: originalName,
                  url: relativeUrl,
                  embedUrl: relativeUrl,
                  size: sizeStr,
                  createdTime: stat.birthtime,
                  mimeType: cat === 'foto' ? 'image/jpeg' : cat === 'video' ? 'video/mp4' : cat === 'pdf' ? 'application/pdf' : 'application/octet-stream'
                });
              }
            } catch (e) {
              // Ignore single file failures
            }
          });
        }
      });

      // Sort newest files first
      results.sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime());

      res.json(results);
    } catch (err: any) {
      console.error('Error in /api/files:', err);
      res.status(500).json({ error: 'Gagal mengambil daftar file', details: err.message });
    }
  });

  // Delete file API (Extra convenience for administrators)
  app.delete('/api/files/:category/:filename', (req, res) => {
    try {
      const { category, filename } = req.params;
      
      if (!categories.includes(category)) {
        return res.status(400).json({ error: 'Kategori tidak valid' });
      }

      const filePath = path.join(uploadDir, category, filename);
      
      // Prevent directory traversal attacks
      const resolvedPath = path.resolve(filePath);
      if (!resolvedPath.startsWith(uploadDir)) {
        return res.status(403).json({ error: 'Akses ditolak' });
      }

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ success: true, message: 'File berhasil dihapus dari hosting' });
      } else {
        res.status(404).json({ error: 'File tidak ditemukan' });
      }
    } catch (err: any) {
      console.error('Error in delete file:', err);
      res.status(500).json({ error: 'Gagal menghapus file', details: err.message });
    }
  });

  // --- DEV & PROD ROUTING ---

  if (process.env.NODE_ENV !== 'production') {
    // Development mode: Integrates Vite development server middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted in development mode');
  } else {
    // Production mode: Serves built files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production build from dist/ folder');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Hosting Server] Active on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
