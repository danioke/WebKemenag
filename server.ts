import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  const uploadDir = path.join(process.cwd(), "uploads");
  const categories = ["foto", "video", "pdf", "dokumen", "foto_pejabat", "foto_staf"];

  // Create upload directories if they don't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  categories.forEach((cat) => {
    const catPath = path.join(uploadDir, cat);
    if (!fs.existsSync(catPath)) {
      fs.mkdirSync(catPath, { recursive: true });
    }
  });

  // Serve static files from uploads
  app.use("/uploads", express.static(uploadDir));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", storage: "local_hosting_active" });
  });

  // Configure Multer storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      let category = req.body.category || "";
      if (!category || !categories.includes(category)) {
        if (file.mimetype.startsWith("image/")) {
          category = "foto";
        } else if (file.mimetype.startsWith("video/")) {
          category = "video";
        } else if (file.mimetype === "application/pdf") {
          category = "pdf";
        } else {
           category = "dokumen";
        }
      }
      cb(null, path.join(uploadDir, category));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "_");
      cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    }
  });

  const upload = multer({
    storage,
    limits: {
      fileSize: 150 * 1024 * 1024 // 150MB
    }
  });

  // Upload endpoint
  app.post("/api/upload", upload.single("file"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Tidak ada file yang diunggah" });
      }

      const file = req.file;
      let category = req.body.category || "";
      if (!category || !categories.includes(category)) {
        if (file.mimetype.startsWith("image/")) {
          category = "foto";
        } else if (file.mimetype.startsWith("video/")) {
          category = "video";
        } else if (file.mimetype === "application/pdf") {
          category = "pdf";
        } else {
          category = "dokumen";
        }
      }

      const relativeUrl = `/uploads/${category}/${file.filename}`;
      const sizeInKb = Math.round(file.size / 1024);
      const sizeStr = sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`;

      res.json({
        id: file.filename,
        name: file.originalname,
        url: relativeUrl,
        embedUrl: relativeUrl,
        size: sizeStr
      });
    } catch (err: any) {
      console.error("Error in /api/upload:", err);
      res.status(500).json({ error: "Gagal mengunggah file ke penyimpanan hosting", details: err.message });
    }
  });

  // Get files endpoint
  app.get("/api/files", (req, res) => {
    try {
      const type = req.query.type || "all";
      let targetCategories: string[] = [];

      if (type === "image") {
        targetCategories = ["foto"];
      } else if (type === "video") {
        targetCategories = ["video"];
      } else if (type === "pdf") {
        targetCategories = ["pdf", "dokumen"];
      } else if (type === "foto_pejabat") {
        targetCategories = ["foto_pejabat"];
      } else if (type === "foto_staf") {
        targetCategories = ["foto_staf"];
      } else {
        targetCategories = ["foto", "video", "pdf", "dokumen", "foto_pejabat", "foto_staf"];
      }

      const results: any[] = [];

      targetCategories.forEach((cat) => {
        const catPath = path.join(uploadDir, cat);
        if (fs.existsSync(catPath)) {
          const files = fs.readdirSync(catPath);
          
          files.forEach((filename) => {
            if (filename.startsWith(".")) return;
            
            const filePath = path.join(catPath, filename);
            try {
              const stat = fs.statSync(filePath);
              
              if (stat.isFile()) {
                const sizeInKb = Math.round(stat.size / 1024);
                const sizeStr = sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`;
                const relativeUrl = `/uploads/${cat}/${filename}`;
                
                const nameParts = filename.split("-");
                let originalName = filename;
                if (nameParts.length > 1) {
                  const ext = path.extname(filename);
                  originalName = nameParts.slice(0, -2).join("-") + ext;
                  if (originalName.startsWith("_") || originalName === ext) {
                    originalName = filename;
                  }
                }
                
                let inferredMimeType = "application/octet-stream";
                const extLower = path.extname(filename).toLowerCase();
                if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(extLower)) {
                  inferredMimeType = "image/jpeg";
                } else if ([".mp4", ".webm", ".ogg"].includes(extLower)) {
                  inferredMimeType = "video/mp4";
                } else if (extLower === ".pdf") {
                  inferredMimeType = "application/pdf";
                }
                
                results.push({
                  id: filename,
                  name: originalName,
                  url: relativeUrl,
                  embedUrl: relativeUrl,
                  size: sizeStr,
                  createdTime: stat.birthtime,
                  mimeType: inferredMimeType
                });
              }
            } catch (e) {
              console.error(`Error reading stat for file ${filePath}:`, e);
            }
          });
        }
      });

      results.sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime());
      res.json(results);
    } catch (err: any) {
      console.error("Error in /api/files:", err);
      res.status(500).json({ error: "Gagal mengambil daftar file", details: err.message });
    }
  });

  // Delete file endpoint
  app.delete("/api/files/:category/:filename", (req, res) => {
    try {
      const { category, filename } = req.params;
      
      if (!categories.includes(category)) {
        return res.status(400).json({ error: "Kategori tidak valid" });
      }

      const filePath = path.join(uploadDir, category, filename);
      const resolvedPath = path.resolve(filePath);
      
      if (!resolvedPath.startsWith(uploadDir)) {
        return res.status(403).json({ error: "Akses ditolak" });
      }

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ success: true, message: "File berhasil dihapus dari hosting" });
      } else {
        res.status(404).json({ error: "File tidak ditemukan" });
      }
    } catch (err: any) {
      console.error("Error in delete file:", err);
      res.status(500).json({ error: "Gagal menghapus file", details: err.message });
    }
  });

  // Local Database and Authentication APIs (Replacing Firebase/Google entirely)
  const dbDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  function getCollectionPath(collection: string) {
    return path.join(dbDir, `${collection}.json`);
  }

  function readCollection(collection: string): any[] {
    const filePath = getCollectionPath(collection);
    if (!fs.existsSync(filePath)) {
      return [];
    }
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (e) {
      console.error(`Error reading collection ${collection}:`, e);
      return [];
    }
  }

  function writeCollection(collection: string, data: any[]) {
    const filePath = getCollectionPath(collection);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  }

  // GET all documents in a collection
  app.get("/api/db/:collection", (req, res) => {
    try {
      const { collection } = req.params;
      const items = readCollection(collection);
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET a single document by ID
  app.get("/api/db/:collection/:id", (req, res) => {
    try {
      const { collection, id } = req.params;
      const items = readCollection(collection);
      const item = items.find((i) => i.id === id);
      if (item) {
        res.json(item);
      } else {
        res.status(404).json({ error: "Document not found" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST (add) a new document to a collection
  app.post("/api/db/:collection", (req, res) => {
    try {
      const { collection } = req.params;
      const data = req.body;
      const items = readCollection(collection);
      
      const id = data.id || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const newItem = { 
        ...data, 
        id,
        createdAt: data.createdAt || new Date().toISOString()
      };
      
      items.push(newItem);
      writeCollection(collection, items);
      res.json({ id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT (update/set) a document by ID
  app.put("/api/db/:collection/:id", (req, res) => {
    try {
      const { collection, id } = req.params;
      const data = req.body;
      const items = readCollection(collection);
      const index = items.findIndex((i) => i.id === id);
      
      if (index !== -1) {
        items[index] = { ...items[index], ...data, id };
      } else {
        items.push({ ...data, id });
      }
      
      writeCollection(collection, items);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE a document by ID
  app.delete("/api/db/:collection/:id", (req, res) => {
    try {
      const { collection, id } = req.params;
      let items = readCollection(collection);
      items = items.filter((i) => i.id !== id);
      writeCollection(collection, items);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST local authentication login
  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      // Admin password is read from process.env.ADMIN_PASSWORD or defaults to a clean default
      const adminPassword = process.env.ADMIN_PASSWORD || "kemenagoki123";
      
      if (password === adminPassword) {
        res.json({
          uid: "admin-uid",
          email: email || "anisreza498@gmail.com",
          displayName: "Super Admin (Anis Reza)",
          role: "Super Admin",
        });
      } else {
        res.status(401).json({ error: "Password administrator salah!" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  function createSlug(text: string) {
    if (!text) return '';
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  async function injectOGTags(html: string, req: express.Request): Promise<string> {
    const reqPath = req.path;
    const host = req.headers.host || "kemenagoki.go.id";
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;
    
    // Default metadata
    let title = "Kementerian Agama Kabupaten OKI";
    let description = "Website Resmi Kantor Kementerian Agama Kabupaten Ogan Komering Ilir (OKI). Melayani masyarakat dengan ikhlas beramal.";
    let image = `${protocol}://${host}/og-image.jpg`;

    try {
      // Match route
      // 1. Berita / News
      const beritaMatch = reqPath.match(/^\/(berita|news)\/([^/]+)/);
      if (beritaMatch) {
        const idOrSlug = beritaMatch[2];
        const items = readCollection("news");
        const item = items.find((i: any) => i.id === idOrSlug || (i.title && createSlug(i.title) === idOrSlug));
        if (item) {
          title = `${item.title} | Kementerian Agama Kabupaten OKI`;
          description = item.excerpt || (item.content ? item.content.substring(0, 160).replace(/<[^>]*>/g, "") : "") || description;
          if (item.image) {
            if (item.image.startsWith("http")) {
              image = item.image;
            } else {
              image = `${protocol}://${host}${item.image.startsWith("/") ? "" : "/"}${item.image}`;
            }
          }
        }
      }
      // 2. Pengumuman
      else if (reqPath.startsWith("/pengumuman/")) {
        const idOrSlug = reqPath.split("/pengumuman/")[1]?.split("?")[0];
        if (idOrSlug) {
          const items = readCollection("announcements");
          const item = items.find((i: any) => i.id === idOrSlug || (i.title && createSlug(i.title) === idOrSlug));
          if (item) {
            title = `${item.title} | Kementerian Agama Kabupaten OKI`;
            description = `Pengumuman resmi Kantor Kementerian Agama Kabupaten Ogan Komering Ilir. Tanggal: ${item.date || "-"}. Ukuran file: ${item.size || "-"}.`;
            image = `${protocol}://${host}/pdf-announcement.jpg`;
          }
        }
      }
      // 3. Agenda
      else if (reqPath.startsWith("/agenda/")) {
        const idOrSlug = reqPath.split("/agenda/")[1]?.split("?")[0];
        if (idOrSlug) {
          const items = readCollection("agendas");
          const item = items.find((i: any) => i.id === idOrSlug || (i.title && createSlug(i.title) === idOrSlug));
          if (item) {
            title = `${item.title} | Kementerian Agama Kabupaten OKI`;
            description = `Agenda Kegiatan: ${item.title}. Tanggal: ${item.date || ""} ${item.month || ""}, Waktu: ${item.time || ""}, Lokasi: ${item.location || ""}. Status: ${item.status || "-"}.`;
            image = `${protocol}://${host}/calendar-agenda.jpg`;
          }
        }
      }
      // 4. Layanan
      else if (reqPath.startsWith("/layanan/")) {
        const id = reqPath.split("/layanan/")[1]?.split("?")[0];
        const defaultLayananTitles: Record<string, string> = {
          'pendidikan-madrasah': 'Pendidikan Madrasah',
          'bimas-islam': 'Bimbingan Masyarakat Islam',
          'pondok-pesantren': 'Pondok Pesantren',
          'sertifikasi-halal': 'Sertifikasi Halal',
          'urusan-agama-islam': 'Urusan Agama Islam',
          'pendidikan-agama-islam': 'Pendidikan Agama Islam'
        };
        if (id && defaultLayananTitles[id]) {
          title = `${defaultLayananTitles[id]} - Layanan Terpadu | Kementerian Agama Kabupaten OKI`;
          description = `Informasi pelayanan, tugas, fungsi, dan struktural seksi ${defaultLayananTitles[id]} di Kantor Kementerian Agama Kabupaten Ogan Komering Ilir.`;
        }
      }
    } catch (e) {
      console.error("Error reading metadata from collections for OG tags:", e);
    }

    // Replace in template
    let result = html;
    
    // Replace titles
    result = result.replace(/<title>.*?<\/title>/gi, `<title>${title}</title>`);
    result = result.replace(/<meta\s+name="title"\s+content=".*?"\s*\/?>/gi, `<meta name="title" content="${title}" />`);
    result = result.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/gi, `<meta property="og:title" content="${title}" />`);
    result = result.replace(/<meta\s+property="twitter:title"\s+content=".*?"\s*\/?>/gi, `<meta property="twitter:title" content="${title}" />`);
    
    // Replace descriptions
    result = result.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/gi, `<meta name="description" content="${description}" />`);
    result = result.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/gi, `<meta property="og:description" content="${description}" />`);
    result = result.replace(/<meta\s+property="twitter:description"\s+content=".*?"\s*\/?>/gi, `<meta property="twitter:description" content="${description}" />`);
    
    // Replace images
    result = result.replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/gi, `<meta property="og:image" content="${image}" />`);
    result = result.replace(/<meta\s+property="twitter:image"\s+content=".*?"\s*\/?>/gi, `<meta property="twitter:image" content="${image}" />`);
    
    // Replace URLs
    result = result.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/gi, `<meta property="og:url" content="${fullUrl}" />`);
    result = result.replace(/<meta\s+property="twitter:url"\s+content=".*?"\s*\/?>/gi, `<meta property="twitter:url" content="${fullUrl}" />`);
    
    return result;
  }

  let viteInstance: any = null;

  // Intercept HTML pages requests to dynamically inject Open Graph (OG) meta tags
  app.get("*", async (req, res, next) => {
    // Skip if it is an API route, uploaded file, or standard static assets with extensions
    if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/") || req.path.includes(".")) {
      return next();
    }

    // Only intercept if Accept header contains text/html, or if it is a clean directory-style path
    const acceptHeader = req.headers.accept || "";
    const isHtmlRequest = acceptHeader.includes("text/html") || !req.path.includes(".");
    
    if (!isHtmlRequest) {
      return next();
    }

    try {
      let indexHtml = "";
      if (process.env.NODE_ENV !== "production" && viteInstance) {
        const template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf8");
        indexHtml = await viteInstance.transformIndexHtml(req.url, template);
      } else {
        const indexPath = path.join(process.cwd(), "dist", "index.html");
        if (fs.existsSync(indexPath)) {
          indexHtml = fs.readFileSync(indexPath, "utf8");
        } else {
          indexHtml = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf8");
        }
      }

      // Inject the dynamic Open Graph (OG) tags for scrapers/social media bots
      const modifiedHtml = await injectOGTags(indexHtml, req);
      res.status(200).set({ "Content-Type": "text/html" }).end(modifiedHtml);
    } catch (err) {
      console.error("Error generating dynamic OG tags in HTML interceptor:", err);
      next(err);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    viteInstance = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(viteInstance.middlewares);
    console.log("Vite middleware mounted in development mode");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    console.log("Serving production build from dist/ folder");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Hosting Server] Active on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
