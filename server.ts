import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import sharp from "sharp";
import nodemailer from "nodemailer";

// Helper function to create transporter
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER || "dallas.reinger@ethereal.email",
      pass: process.env.SMTP_PASS || "rST2kUvqVd39x32P6j",
    },
  });
};

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "100mb" }));

  const uploadDir = path.join(process.cwd(), "uploads");
  const categories = ["foto", "video", "pdf", "dokumen", "foto_pejabat", "foto_staf", "og_image"];

  // Create upload directories if they don't exist
  if (!fs.existsSync(uploadDir)) {
    try { fs.mkdirSync(uploadDir, { recursive: true }); } catch (e) { console.warn("Could not create uploadDir", e); }
  }
  
  categories.forEach((cat) => {
    const catPath = path.join(uploadDir, cat);
    if (!fs.existsSync(catPath)) {
      try { fs.mkdirSync(catPath, { recursive: true }); } catch (e) { console.warn("Could not create catPath", e); }
    }
  });

  // Serve static files from uploads
  app.use("/uploads", express.static(uploadDir));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      storage: "local_hosting_active"
    });
  });

  // Configure Multer storage using memory storage to avoid read-only filesystem issues
  const storage = multer.memoryStorage();

  const upload = multer({
    storage,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    }
  });

  // Dynamic route to serve uploaded files from either disk or MySQL database
  app.get("/uploads/:category/:filename", async (req, res) => {
    try {
      const { category, filename } = req.params;
      const localFilePath = path.join(uploadDir, category, filename);

      // 1. If file exists on local disk, serve it directly (cache)
      if (fs.existsSync(localFilePath)) {
        return res.sendFile(localFilePath);
      }

      // 2. If it does not exist on disk, read it from the "uploaded_files" database collection
      const files = await readCollection("uploaded_files");
      const foundFile = files.find(f => f.id === filename);

      if (foundFile && foundFile.base64) {
        const parts = foundFile.base64.split(",");
        const base64Data = parts[1] || parts[0];
        if (base64Data) {
          const buffer = Buffer.from(base64Data, "base64");
          res.setHeader("Content-Type", foundFile.mimetype || "application/octet-stream");
          res.setHeader("Cache-Control", "public, max-age=31536000"); // cache for 1 year
          return res.send(buffer);
        }
      }

      // 3. File not found
      res.status(404).send("File tidak ditemukan");
    } catch (err) {
      console.error("Error serving uploaded file:", err);
      res.status(500).send("Gagal memuat file");
    }
  });

  // Upload endpoint
  app.post("/api/upload", upload.single("file"), async (req, res) => {
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

      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `${baseName}-${uniqueSuffix}${ext}`;
      const relativeUrl = `/uploads/${category}/${filename}`;

      // Auto-resize image for Open Graph if uploaded file is an image
      let ogBuffer: Buffer | null = null;
      const isImage = file.mimetype.startsWith("image/");
      const ogFilename = `${baseName}-${uniqueSuffix}-og${ext}`;
      const ogRelativeUrl = `/uploads/og_image/${ogFilename}`;

      if (isImage) {
        try {
          const extLower = ext.toLowerCase();
          // Resize to standard Open Graph dimensions (max 1200x630, fit inside, keep aspect ratio)
          let transformer = sharp(file.buffer).resize({ width: 1200, height: 630, fit: "inside", withoutEnlargement: true });
          
          if (extLower === ".jpg" || extLower === ".jpeg") {
            transformer = transformer.jpeg({ quality: 80, progressive: true });
          } else if (extLower === ".png") {
            transformer = transformer.png({ compressionLevel: 8 });
          } else if (extLower === ".webp") {
            transformer = transformer.webp({ quality: 80 });
          } else {
            transformer = transformer.jpeg({ quality: 80 });
          }
          
          ogBuffer = await transformer.toBuffer();
          console.log(`Generated OG-optimized image: ${ogFilename} (${Math.round(ogBuffer.length / 1024)} KB)`);
        } catch (sharpErr) {
          console.error("Error creating OG image with sharp:", sharpErr);
        }
      }

      // Write to local disk in background/non-blocking as a cache
      try {
        const catPath = path.join(uploadDir, category);
        if (!fs.existsSync(catPath)) {
          try { fs.mkdirSync(catPath, { recursive: true }); } catch (e) { console.warn("Could not create catPath", e); }
        }
        fs.writeFileSync(path.join(catPath, filename), file.buffer);
        
        if (ogBuffer) {
          const ogPath = path.join(uploadDir, "og_image");
          if (!fs.existsSync(ogPath)) {
            try { fs.mkdirSync(ogPath, { recursive: true }); } catch (e) { console.warn("Could not create ogPath", e); }
          }
          fs.writeFileSync(path.join(ogPath, ogFilename), ogBuffer);
        }
      } catch (writeErr) {
        console.warn("Local disk cache write failed (probably read-only filesystem):", writeErr);
      }

      // Save file data and base64 to database "uploaded_files" collection
      const sizeInKb = Math.round(file.size / 1024);
      const sizeStr = sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`;

      const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

      const fileDoc: any = {
        id: filename,
        name: file.originalname,
        url: relativeUrl,
        base64: fileBase64,
        category: category,
        mimetype: file.mimetype,
        size: sizeStr,
        createdAt: new Date().toISOString()
      };

      let ogFileDoc: any = null;
      if (ogBuffer) {
        const ogSizeInKb = Math.round(ogBuffer.length / 1024);
        const ogSizeStr = `${ogSizeInKb} KB`;
        const ogMimeType = ext.toLowerCase() === ".png" ? "image/png" : (ext.toLowerCase() === ".webp" ? "image/webp" : "image/jpeg");
        const ogFileBase64 = `data:${ogMimeType};base64,${ogBuffer.toString("base64")}`;

        ogFileDoc = {
          id: ogFilename,
          name: `${baseName}-og${ext}`,
          url: ogRelativeUrl,
          base64: ogFileBase64,
          category: "og_image",
          mimetype: ogMimeType,
          size: ogSizeStr,
          createdAt: new Date().toISOString(),
          isOg: true
        };
      }

      const release = await acquireLock("uploaded_files");
      try {
        if (useMySQL && pool) {
          await pool.query(
            'INSERT INTO collections (id, collection_name, data) VALUES (?, ?, ?)',
            [filename, 'uploaded_files', JSON.stringify(fileDoc)]
          );
          if (ogFileDoc) {
            await pool.query(
              'INSERT INTO collections (id, collection_name, data) VALUES (?, ?, ?)',
              [ogFilename, 'uploaded_files', JSON.stringify(ogFileDoc)]
            );
          }
        } else {
          const files = await readCollection("uploaded_files");
          files.push(fileDoc);
          if (ogFileDoc) {
            files.push(ogFileDoc);
          }
          await writeCollection("uploaded_files", files);
        }
      } finally {
        release();
      }

      res.json({
        id: filename,
        name: file.originalname,
        url: relativeUrl,
        embedUrl: relativeUrl,
        size: sizeStr
      });
    } catch (err: any) {
      console.error("Error in /api/upload:", err);
      res.status(500).json({ error: "Gagal mengunggah file ke penyimpanan", details: err.message });
    }
  });

  // Proxy image for Open Graph
  app.get("/api/proxy-image", async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      if (!imageUrl) return res.status(400).send("Missing URL");
      
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Fetch failed");
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get("content-type") || "image/jpeg";
      
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
      res.send(buffer);
    } catch (err: any) {
      console.error("Image proxy error:", err.message);
      res.status(500).send("Proxy error");
    }
  });

  // Manual newsletter send endpoint
  app.post("/api/newsletter/send", async (req, res) => {
    try {
      const { subject, title, content, subscribers } = req.body;
      if (!subject || !title || !content || !Array.isArray(subscribers)) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      let sentCount = 0;

      for (const sub of subscribers) {
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #065f46; color: white; padding: 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 22px;">${title}</h1>
            </div>
            <div style="padding: 24px; color: #333; line-height: 1.6;">
              ${content}
            </div>
            <div style="background-color: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #777;">
              <p style="margin: 0;">Pesan ini dikirim ke ${sub.email}</p>
              <p style="margin: 4px 0 0 0;">Kemenag OKI - Hak Cipta Dilindungi</p>
            </div>
          </div>
        `;

        const logId = 'auto-' + Math.random().toString(36).substring(2, 11);
        const logItem = {
          id: logId,
          subscriberEmail: sub.email,
          newsTitle: title,
          subject: subject,
          htmlBody,
          sentAt: new Date().toISOString(),
          status: 'Gagal'
        };

        try {
          const transporter = getTransporter();
          await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Humas Kemenag OKI" <humas@kemenagoki.id>',
            to: sub.email,
            subject: subject,
            html: htmlBody
          });
          logItem.status = 'Terkirim (Manual)';
          console.log(`[NEWSLETTER] Email successfully sent to ${sub.email}`);
          sentCount++;
        } catch (emailErr) {
          console.error(`[NEWSLETTER] Failed to send email to ${sub.email}:`, emailErr);
        }
        
        if (useMySQL && pool) {
          await pool.query(
            'INSERT INTO collections (id, collection_name, data) VALUES (?, ?, ?)',
            [logId, 'newsletter_sent_logs', JSON.stringify(logItem)]
          );
        } else {
          const logs = await readCollection('newsletter_sent_logs');
          logs.push(logItem);
          await writeCollection('newsletter_sent_logs', logs);
        }
      }

      res.json({ success: true, count: sentCount });
    } catch (err: any) {
      console.error("Error in /api/newsletter/send:", err);
      res.status(500).json({ error: "Gagal mengirim buletin", details: err.message });
    }
  });

  // Get files endpoint
  app.get("/api/koordinat", async (req, res) => {
    try {
      const q = String(req.query.q || "").trim();
      if (!q) {
        return res.status(400).json({ status: false, error: "Query parameter q is required" });
      }

      let cleanName = q
        .replace(/^KAB\.\s*/i, "")
        .replace(/^KOTA\s*/i, "")
        .replace(/^KABUPATEN\s*/i, "")
        .trim();

      let lat = -3.37; // Default OKI / Kayuagung
      let lon = 104.83;
      let found = false;

      // 1. Try Open-Meteo Geocoding
      try {
        const omUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanName)}&count=1&language=id&format=json`;
        const omRes = await fetch(omUrl);
        if (omRes.ok) {
          const omData = await omRes.json();
          if (omData.results && omData.results.length > 0) {
            lat = omData.results[0].latitude;
            lon = omData.results[0].longitude;
            found = true;
          }
        }
      } catch (e) {
        console.warn("Open-Meteo geocoding failed:", e);
      }

      // 2. If not found, try Nominatim with custom User-Agent
      if (!found) {
        try {
          const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanName + ", Indonesia")}&format=json&limit=1`;
          const nomRes = await fetch(nomUrl, {
            headers: { "User-Agent": "KemenagApp/1.0 (contact@kemenag.go.id)" }
          });
          if (nomRes.ok) {
            const nomData = await nomRes.json();
            if (nomData && nomData.length > 0) {
              lat = parseFloat(nomData[0].lat);
              lon = parseFloat(nomData[0].lon);
              found = true;
            }
          }
        } catch (e) {
          console.warn("Nominatim geocoding failed:", e);
        }
      }

      // Format Lintang
      const absLat = Math.abs(lat);
      const latDeg = Math.floor(absLat);
      const latMin = Math.round((absLat - latDeg) * 60);
      const latDir = lat >= 0 ? "LU" : "LS";
      const lintangStr = `${latDeg}°${latMin}' ${latDir}`;

      // Format Bujur
      const absLon = Math.abs(lon);
      const lonDeg = Math.floor(absLon);
      const lonMin = Math.round((absLon - lonDeg) * 60);
      const lonDir = lon >= 0 ? "BT" : "BB";
      const bujurStr = `${lonDeg}°${lonMin}' ${lonDir}`;

      // Calculate Arah Kiblat & Distance to Ka'bah (Lat: 21.422487, Lon: 39.826206)
      const kaabaLat = 21.422487 * (Math.PI / 180);
      const kaabaLon = 39.826206 * (Math.PI / 180);
      const userLat = lat * (Math.PI / 180);
      const userLon = lon * (Math.PI / 180);

      const y = Math.sin(kaabaLon - userLon);
      const x = Math.cos(userLat) * Math.tan(kaabaLat) - Math.sin(userLat) * Math.cos(kaabaLon - userLon);
      let qiblaRad = Math.atan2(y, x);
      let qiblaDegTotal = (qiblaRad * (180 / Math.PI) + 360) % 360;

      const qiblaDeg = Math.floor(qiblaDegTotal);
      const qiblaMin = Math.round((qiblaDegTotal - qiblaDeg) * 60);

      // Haversine distance
      const R = 6371; // Earth radius in km
      const dLat = kaabaLat - userLat;
      const dLon = kaabaLon - userLon;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(userLat) * Math.cos(kaabaLat) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = (R * c).toFixed(3);

      const arahKiblatStr = `${qiblaDeg}°${qiblaMin}' Jarak Ka'bah : ${distance} KM`;

      res.json({
        status: true,
        query: cleanName,
        lat,
        lon,
        lintang: lintangStr,
        bujur: bujurStr,
        arahKiblat: arahKiblatStr
      });
    } catch (err: any) {
      console.error("Error in /api/koordinat:", err);
      res.status(500).json({ status: false, error: err.message });
    }
  });

  // Get files endpoint
  app.get("/api/files", async (req, res) => {
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
      } else if (type === "og_image") {
        targetCategories = ["og_image"];
      } else {
        targetCategories = ["foto", "video", "pdf", "dokumen", "foto_pejabat", "foto_staf"];
      }

      // Read from database first
      const dbFiles = await readCollection("uploaded_files");
      const resultsMap = new Map<string, any>();

      const isOgOrSystemFile = (item: { id?: string; name?: string; url?: string; category?: string; isOg?: boolean; size?: string }) => {
        const nameLower = String(item.name || "").toLowerCase();
        const idLower = String(item.id || "").toLowerCase();
        const urlLower = String(item.url || "").toLowerCase();
        const catLower = String(item.category || "").toLowerCase();

        return (
          item.isOg ||
          catLower === "og_image" ||
          urlLower.includes("/og_image/") ||
          urlLower.includes("-og.") ||
          idLower.includes("-og.") ||
          idLower.includes("og_image") ||
          idLower.startsWith("og_") ||
          nameLower.includes("og_image") ||
          nameLower.startsWith("og_") ||
          idLower.includes("dummy") ||
          nameLower.includes("dummy") ||
          item.size === "0 KB"
        );
      };

      // Clean up any old dummy or misplaced og_image records from DB if found
      try {
        if (!useMySQL) {
          const dirty = dbFiles.some(f => isOgOrSystemFile(f) && f.category !== "og_image");
          if (dirty) {
            const cleaned = dbFiles.filter(f => !isOgOrSystemFile(f) || f.category === "og_image");
            await writeCollection("uploaded_files", cleaned);
          }
        } else if (pool) {
          await pool.query(
            `DELETE FROM collections WHERE collection_name = 'uploaded_files' AND (LOWER(id) LIKE '%og_image%' OR LOWER(id) LIKE '%dummy%')`
          );
        }
      } catch (cleanErr) {
        console.warn("DB cleanup for og_image/dummy records failed:", cleanErr);
      }

      dbFiles.forEach((f) => {
        const isOgFile = isOgOrSystemFile(f);
        // Skip OG images and system dummy files unless specifically requesting type=og_image
        if (isOgFile && type !== "og_image") {
          return;
        }
        const cat = f.category || "foto";
        if (targetCategories.includes(cat)) {
          resultsMap.set(f.id, {
            id: f.id,
            name: f.name || f.id,
            url: f.url,
            embedUrl: f.url,
            size: f.size || "0 KB",
            createdTime: f.createdAt || new Date().toISOString(),
            mimeType: f.mimetype || "application/octet-stream"
          });
        }
      });

      // Also read from local disk, merging in anything that is not in DB
      targetCategories.forEach((cat) => {
        if (cat === "og_image" && type !== "og_image") return;
        const catPath = path.join(uploadDir, cat);
        if (fs.existsSync(catPath)) {
          try {
            const files = fs.readdirSync(catPath);
            files.forEach((filename) => {
              if (filename.startsWith(".")) return;
              const lowerName = filename.toLowerCase();
              // Skip OG images and dummy files from local file listings unless type is og_image
              if (
                (lowerName.includes("-og.") || 
                 lowerName.includes("og_image") || 
                 lowerName.startsWith("og_") || 
                 lowerName.includes("dummy")) && 
                type !== "og_image"
              ) return;

              if (resultsMap.has(filename)) return; // already in DB, skip

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
                  
                  resultsMap.set(filename, {
                    id: filename,
                    name: originalName,
                    url: relativeUrl,
                    embedUrl: relativeUrl,
                    size: sizeStr,
                    createdTime: stat.birthtime || new Date().toISOString(),
                    mimeType: inferredMimeType
                  });
                }
              } catch (e) {
                console.error(`Error reading stat for file ${filePath}:`, e);
              }
            });
          } catch (readdirErr) {
            console.error(`Error reading directory ${catPath}:`, readdirErr);
          }
        }
      });

      const results = Array.from(resultsMap.values());
      results.sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime());
      res.json({ files: results, appUrl: process.env.APP_URL || "" });
    } catch (err: any) {
      console.error("Error in /api/files:", err);
      res.status(500).json({ error: "Gagal mengambil daftar file", details: err.message });
    }
  });

  // Delete file endpoint
  app.delete("/api/files/:category/:filename", async (req, res) => {
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

      // Determine corresponding OG filename
      const ext = path.extname(filename);
      const base = filename.slice(0, -ext.length);
      const ogFilename = `${base}-og${ext}`;
      const ogFilePath = path.join(uploadDir, category, ogFilename);

      // Delete from local disk if exists (both original and OG version)
      try {
        if (fs.existsSync(resolvedPath)) {
          fs.unlinkSync(resolvedPath);
        }
        if (fs.existsSync(ogFilePath)) {
          fs.unlinkSync(ogFilePath);
        }
      } catch (e) {
        console.warn("Failed to delete from local disk (probably read-only):", e);
      }

      // Delete from database
      const release = await acquireLock("uploaded_files");
      try {
        if (useMySQL && pool) {
          await pool.query('DELETE FROM collections WHERE collection_name = ? AND id = ?', ['uploaded_files', filename]);
          await pool.query('DELETE FROM collections WHERE collection_name = ? AND id = ?', ['uploaded_files', ogFilename]);
        } else {
          const files = await readCollection("uploaded_files");
          const filtered = files.filter(f => f.id !== filename && f.id !== ogFilename);
          await writeCollection("uploaded_files", filtered);
        }
      } finally {
        release();
      }

      res.json({ success: true, message: "File berhasil dihapus dari hosting" });
    } catch (err: any) {
      console.error("Error in delete file:", err);
      res.status(500).json({ error: "Gagal menghapus file", details: err.message });
    }
  });

  // Local Database and Authentication APIs (Replacing Firebase/Google entirely)
  
  
  const dbDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dbDir)) {
    try { fs.mkdirSync(dbDir, { recursive: true }); } catch (e) { console.warn("Could not create dbDir", e); }
  }

  function getCollectionPath(collection: string) {
    return path.join(dbDir, `${collection}.json`);
  }

  let pool: mysql.Pool | null = null;
  let useMySQL = false;
  let dbConnectionError: string | null = null;

  async function initDB() {
    if (!process.env.DB_HOST || !process.env.DB_USER) {
      console.log("MySQL credentials not provided, using local JSON fallback.");
      dbConnectionError = "Kredensial MySQL tidak lengkap di pengaturan";
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
      dbConnectionError = null;
    } catch (err: any) {
      console.error("MySQL connection error:", err.message);
      dbConnectionError = err.message;
      console.log("Falling back to local JSON file storage.");
    }
  }

  // Initialize DB asynchronously but don't block server startup
  initDB();

  app.get("/api/db-status", (req, res) => {
    res.json({
      useMySQL,
      error: dbConnectionError,
      host: process.env.DB_HOST
    });
  });

  
  function parseDBData(dataRaw: any) {
    if (dataRaw === null || dataRaw === undefined) {
      return {};
    }
    
    // Handle Buffer
    if (Buffer.isBuffer(dataRaw)) {
      try {
        const str = dataRaw.toString('utf8');
        const parsed = JSON.parse(str);
        if (typeof parsed === 'string') {
          return JSON.parse(parsed);
        }
        return parsed;
      } catch (e) {
        console.error("Error parsing Buffer data:", e);
        return {};
      }
    }
    
    // Handle string
    if (typeof dataRaw === 'string') {
      try {
        const parsed = JSON.parse(dataRaw);
        if (typeof parsed === 'string') {
          return JSON.parse(parsed);
        }
        return parsed;
      } catch (e) {
        console.error("Error parsing string data:", e);
        return {};
      }
    }
    
    // Handle already-parsed object/array (if mysql2 does auto-deserialization)
    if (typeof dataRaw === 'object') {
      // In case mysql2 parsed it but it is actually still double-stringified inside the object
      if (typeof dataRaw.data === 'string') {
        try {
          return JSON.parse(dataRaw.data);
        } catch (e) {}
      }
      return dataRaw;
    }
    
    return dataRaw;
  }

  // Active lock/queue dictionary per collection to prevent concurrent write race conditions
  const collectionLocks: Record<string, Promise<any>> = {};

  async function acquireLock(collection: string): Promise<() => void> {
    let release: () => void;
    const nextPromise = new Promise<void>((resolve) => {
      release = resolve;
    });
    
    const currentPromise = collectionLocks[collection] || Promise.resolve();
    collectionLocks[collection] = currentPromise.then(() => nextPromise);
    
    await currentPromise;
    return release!;
  }

  async function readCollection(collection: string): Promise<any[]> {
    if (useMySQL && pool) {
      try {
        const [rows] = await pool.query('SELECT data FROM collections WHERE collection_name = ?', [collection]);
        return (rows as any[]).map(r => parseDBData(r.data));
      } catch (err: any) {
        console.error(`Error reading collection ${collection} from MySQL:`, err.message);
        throw err;
      }
    } else {
      const filePath = getCollectionPath(collection);
      if (!fs.existsSync(filePath)) {
        return [];
      }
      try {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
      } catch (e) {
        console.error(`Error reading collection ${collection} from JSON:`, e);
        throw e;
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
        throw err;
      } finally {
        if (connection) connection.release();
      }
    } else {
      const filePath = getCollectionPath(collection);
      try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
      } catch (err) {
        console.error(`Error writing collection ${collection} to JSON file:`, err);
        throw err;
      }
    }
  }


  // GET all documents in a collection
  app.get("/api/db/:collection", async (req, res) => {
    try {
      const { collection: collectionName } = req.params;
      const items = await readCollection(collectionName);
      res.json(items);
    } catch (err: any) {
      console.error(`Error in GET /api/db/${req.params.collection}:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // GET a single document by ID
  app.get("/api/db/:collection/:id", async (req, res) => {
    try {
      const { collection: collectionName, id } = req.params;
      const items = await readCollection(collectionName);
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
  app.post("/api/db/:collection", async (req, res) => {
    const { collection: collectionName } = req.params;
    const release = await acquireLock(collectionName);
    try {
      const data = req.body;
      const id = data.id || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const newItem = { 
        ...data, 
        id,
        createdAt: data.createdAt || new Date().toISOString()
      };

      if (useMySQL && pool) {
        await pool.query(
          'INSERT INTO collections (id, collection_name, data) VALUES (?, ?, ?)',
          [id, collectionName, JSON.stringify(newItem)]
        );
      } else {
        const items = await readCollection(collectionName);
        items.push(newItem);
        await writeCollection(collectionName, items);
      }

      // Automatically trigger newsletter broadcast when a news article is added
      if (collectionName === "news") {
        try {
          const subscribers = await readCollection("newsletter_subscribers");
          if (subscribers.length > 0) {
            console.log(`[NEWSLETTER] Intercepted new news article "${newItem.title}". Bulking to ${subscribers.length} subscribers...`);
            
            const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
            const articleLink = `${appUrl}/berita/${id}`;
            const formattedDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            
            for (const sub of subscribers) {
              const htmlBody = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); background-color: #ffffff;">
                  <div style="background-color: #065f46; color: white; padding: 32px 24px; text-align: center; border-bottom: 4px solid #f59e0b;">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; opacity: 0.8; display: block; margin-bottom: 8px;">KEMENTERIAN AGAMA KABUPATEN OKI</span>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 800; line-height: 1.2;">Buletin Berita Terbaru</h1>
                  </div>
                  
                  ${newItem.image ? `
                  <div style="width: 100%; max-height: 280px; overflow: hidden; background-color: #f3f4f6;">
                    <img src="${newItem.image.startsWith('http') ? newItem.image : appUrl + newItem.image}" alt="${newItem.title}" style="width: 100%; height: auto; object-fit: cover; display: block;" />
                  </div>
                  ` : ''}
                  
                  <div style="padding: 28px 24px; color: #374151;">
                    <span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 16px;">
                      ${newItem.category || 'Berita Terkini'}
                    </span>
                    
                    <h2 style="color: #111827; margin: 0 0 12px 0; font-size: 20px; font-weight: 800; line-height: 1.3;">
                      ${newItem.title}
                    </h2>
                    
                    <p style="color: #9ca3af; font-size: 11px; margin: 0 0 20px 0;">
                      Penulis: <strong style="color: #4b5563;">${newItem.author || 'Humas Kemenag OKI'}</strong> &bull; ${newItem.date || formattedDate}
                    </p>
                    
                    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
                    
                    <div style="font-size: 14px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
                      ${newItem.excerpt ? `<p style="font-style: italic; color: #6b7280; border-left: 3px solid #10b981; padding-left: 12px; margin-bottom: 16px;">"${newItem.excerpt}"</p>` : ''}
                      <p>Berita baru telah dipublikasikan di website resmi Kantor Kementerian Agama Kabupaten Ogan Komering Ilir. Silakan klik tombol di bawah ini untuk melihat detail lengkap berita, galeri, serta tanggapan masyarakat.</p>
                    </div>
                    
                    <div style="text-align: center; margin-bottom: 12px;">
                      <a href="${articleLink}" target="_blank" style="background-color: #065f46; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(6, 95, 70, 0.2);">
                        Baca Selengkapnya
                      </a>
                    </div>
                  </div>
                  
                  <div style="background-color: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0;">Anda menerima email ini karena Anda terdaftar sebagai pelanggan buletin di Kemenag OKI.</p>
                    <p style="margin: 4px 0 0 0;">© ${new Date().getFullYear()} Kemenag OKI. Hak Cipta Dilindungi.</p>
                  </div>
                </div>
              `;
              
              const logId = 'auto-' + Math.random().toString(36).substring(2, 11);
              const logItem = {
                id: logId,
                subscriberEmail: sub.email,
                newsTitle: newItem.title,
                subject: `Berita Terkini Kemenag OKI: ${newItem.title}`,
                htmlBody,
                sentAt: new Date().toISOString(),
                status: 'Gagal'
              };

              try {
                const transporter = getTransporter();
                await transporter.sendMail({
                  from: process.env.SMTP_FROM || '"Humas Kemenag OKI" <humas@kemenagoki.id>',
                  to: sub.email,
                  subject: logItem.subject,
                  html: htmlBody
                });
                logItem.status = 'Terkirim (Otomatis)';
                console.log(`[NEWSLETTER] Email successfully sent to ${sub.email}`);
              } catch (emailErr) {
                console.error(`[NEWSLETTER] Failed to send email to ${sub.email}:`, emailErr);
              }
              
              if (useMySQL && pool) {
                await pool.query(
                  'INSERT INTO collections (id, collection_name, data) VALUES (?, ?, ?)',
                  [logId, 'newsletter_sent_logs', JSON.stringify(logItem)]
                );
              } else {
                const logs = await readCollection('newsletter_sent_logs');
                logs.push(logItem);
                await writeCollection('newsletter_sent_logs', logs);
              }
              console.log(`[NEWSLETTER] Automated bulletin email logged for subscriber: ${sub.email}`);
            }
          }
        } catch (bulletinErr) {
          console.error('[NEWSLETTER] Fail automatic newsletter broadcast:', bulletinErr);
        }
      }

      res.json({ id });
    } catch (err: any) {
      console.error(`Error POST /api/db/${collectionName}:`, err);
      res.status(500).json({ error: err.message });
    } finally {
      release();
    }
  });

  // PUT (update/set) a document by ID


  const updateHandler = async (req: any, res: any) => {
    const { collection: collectionName, id } = req.params;
    const release = await acquireLock(collectionName);
    try {
      const data = req.body;

      if (useMySQL && pool) {
        // Read existing first
        const [rows] = await pool.query('SELECT data FROM collections WHERE collection_name = ? AND id = ?', [collectionName, id]);
        let existingData = {};
        if (Array.isArray(rows) && rows.length > 0) {
          existingData = parseDBData((rows as any[])[0].data);
        }
        const updatedItem = { ...existingData, ...data, id };
        
        await pool.query(
          'INSERT INTO collections (id, collection_name, data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)',
          [id, collectionName, JSON.stringify(updatedItem)]
        );
      } else {
        const items = await readCollection(collectionName);
        const index = items.findIndex((i) => i.id === id);
        
        if (index !== -1) {
          items[index] = { ...items[index], ...data, id };
        } else {
          items.push({ ...data, id });
        }
        await writeCollection(collectionName, items);
      }
      
      res.json({ success: true });
    } catch (err: any) {
      console.error(`Error PUT /api/db/${collectionName}/${id}:`, err);
      res.status(500).json({ error: err.message });
    } finally {
      release();
    }
  };

  // DELETE a document by ID
  // Route definitions using POST to bypass strict hosting web servers that block PUT/DELETE
  app.put("/api/db/:collection/:id", updateHandler);
  app.post("/api/db/:collection/:id", updateHandler);

  const deleteDbHandler = async (req: any, res: any) => {
    const { collection: collectionName, id } = req.params;
    const release = await acquireLock(collectionName);
    try {
      if (useMySQL && pool) {
        await pool.query('DELETE FROM collections WHERE collection_name = ? AND id = ?', [collectionName, id]);
      } else {
        let items = await readCollection(collectionName);
        items = items.filter((i) => i.id !== id);
        await writeCollection(collectionName, items);
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error(`Error DELETE /api/db/${collectionName}/${id}:`, err);
      res.status(500).json({ error: err.message });
    } finally {
      release();
    }
  };

  // POST local authentication login
  app.delete("/api/db/:collection/:id", deleteDbHandler);
  app.post("/api/db/:collection/:id/delete", deleteDbHandler);

  // Clear all documents in a collection
  app.post("/api/db/:collection/clear", async (req, res) => {
    const { collection: collectionName } = req.params;
    const release = await acquireLock(collectionName);
    try {
      if (useMySQL && pool) {
        await pool.query('DELETE FROM collections WHERE collection_name = ?', [collectionName]);
      } else {
        await writeCollection(collectionName, []);
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error(`Error clear /api/db/${collectionName}:`, err);
      res.status(500).json({ error: err.message });
    } finally {
      release();
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const adminPassword = process.env.ADMIN_PASSWORD || "kemenagoki123";
      
      let authenticatedUser = null;
      
      if (password === adminPassword) {
        authenticatedUser = {
          uid: "admin-uid",
          email: email || "anisreza498@gmail.com",
          displayName: "Super Admin (Anis Reza)",
          role: "Super Admin",
        };
      } else {
        // Check allowed_users database
        try {
          const users = await readCollection("allowed_users");
          const foundUser = users.find(u => u.email?.toLowerCase() === email?.toLowerCase() && u.password === password);
          if (foundUser) {
            authenticatedUser = {
              uid: foundUser.id || "user-uid",
              email: foundUser.email,
              displayName: foundUser.name || foundUser.email,
              role: foundUser.role || "Admin",
            };
          }
        } catch (dbErr) {
          console.warn("Failed to check allowed_users:", dbErr);
        }
      }

      if (authenticatedUser) {
        res.json(authenticatedUser);
      } else {
        res.status(401).json({ error: "Email atau Password salah!" });
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
      const settingsColl = await readCollection("settings");
      if (settingsColl && settingsColl.length > 0) {
        const settings = settingsColl[0];
        if (settings.siteName) title = settings.siteName;
        if (settings.metaDescription) description = settings.metaDescription;
        if (settings.ogImageUrl) {
          image = settings.ogImageUrl;
        } else if (settings.logoUrl) {
          image = settings.logoUrl;
        }
      }
    } catch (e) {
      console.error("Error reading settings for OG tags:", e);
    }

    try {
      // Match route
      // 1. Berita / News
      const beritaMatch = reqPath.match(/^\/(berita|news)\/([^/]+)/);
      if (beritaMatch) {
        const idOrSlug = beritaMatch[2];
        const items = await readCollection("news");
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
          const items = await readCollection("announcements");
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
          const items = await readCollection("agendas");
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

    // Check if we can find a smaller, OG-optimized version of the image (less than 300KB)
    const getOGResizedUrl = async (originalUrl: string): Promise<string | null> => {
      if (!originalUrl || originalUrl.startsWith("http")) return null;
      try {
        const parts = originalUrl.split("/");
        const filename = parts[parts.length - 1];
        const category = parts[parts.length - 2] || "foto";
        if (!filename) return null;

        const ext = path.extname(filename);
        const base = filename.slice(0, -ext.length);
        const ogFilename = `${base}-og${ext}`;
        const ogRelativeUrl = `/uploads/${category}/${ogFilename}`;

        // Check local disk cache first
        const localFilePath = path.join(uploadDir, category, ogFilename);
        if (fs.existsSync(localFilePath)) {
          return ogRelativeUrl;
        }

        // Check database files
        const dbFiles = await readCollection("uploaded_files");
        const found = dbFiles.find(f => f.id === ogFilename);
        if (found) {
          return ogRelativeUrl;
        }
      } catch (err) {
        console.warn("Failed checking OG resized URL in injectOGTags:", err);
      }
      return null;
    };

    if (image) {
      if (!image.startsWith("http")) {
        const ogResized = await getOGResizedUrl(image);
        if (ogResized) {
          image = `${protocol}://${host}${ogResized.startsWith("/") ? "" : "/"}${ogResized}`;
        } else {
          image = `${protocol}://${host}${image.startsWith("/") ? "" : "/"}${image}`;
        }
      } else {
        // It's a full URL, but if it's pointing to our host, see if we have an OG version of it
        const ourHostPrefix = `${protocol}://${host}`;
        const cleanHostPrefix = `://${host}`;
        
        let matchedPath: string | null = null;
        if (image.startsWith(ourHostPrefix)) {
          matchedPath = image.substring(ourHostPrefix.length);
        } else if (image.includes(cleanHostPrefix)) {
          const idx = image.indexOf(cleanHostPrefix);
          matchedPath = image.substring(idx + cleanHostPrefix.length);
        }

        if (matchedPath) {
          const ogResized = await getOGResizedUrl(matchedPath);
          if (ogResized) {
            image = `${protocol}://${host}${ogResized}`;
          }
        } else {
          // It's a completely external URL, proxy it to prevent CDN blocking bots
          image = `${protocol}://${host}/api/proxy-image?url=${encodeURIComponent(image)}`;
        }
      }
    }

    // Replace in template
    let result = html;
    
    // Clean and escape helper to prevent HTML or quotes from breaking the meta tags
    const cleanForMeta = (str: string) => {
      if (!str) return "";
      let clean = str.replace(/<[^>]*>/g, ""); // Strip HTML tags
      clean = clean.replace(/"/g, "&quot;");    // Escape double quotes
      clean = clean.replace(/\s+/g, " ");       // Replace multiple whitespaces/newlines
      return clean.trim();
    };

    const cleanTitle = cleanForMeta(title);
    const cleanDescription = cleanForMeta(description);

    // Replace titles
    result = result.replace(/<title>.*?<\/title>/gi, `<title>${cleanTitle}</title>`);
    result = result.replace(/<meta\s+name="title"\s+content=".*?"\s*\/?>/gi, `<meta name="title" content="${cleanTitle}" />`);
    result = result.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/gi, `<meta property="og:title" content="${cleanTitle}" />`);
    result = result.replace(/<meta\s+property="twitter:title"\s+content=".*?"\s*\/?>/gi, `<meta property="twitter:title" content="${cleanTitle}" />`);
    
    // Replace descriptions
    result = result.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/gi, `<meta name="description" content="${cleanDescription}" />`);
    result = result.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/gi, `<meta property="og:description" content="${cleanDescription}" />`);
    result = result.replace(/<meta\s+property="twitter:description"\s+content=".*?"\s*\/?>/gi, `<meta property="twitter:description" content="${cleanDescription}" />`);
    
    // Replace images
    result = result.replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/gi, `<meta property="og:image" content="${image}" />`);
    result = result.replace(/<meta\s+property="twitter:image"\s+content=".*?"\s*\/?>/gi, `<meta property="twitter:image" content="${image}" />`);
    
    // Replace URLs
    result = result.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/gi, `<meta property="og:url" content="${fullUrl}" />`);
    result = result.replace(/<meta\s+property="twitter:url"\s+content=".*?"\s*\/?>/gi, `<meta property="twitter:url" content="${fullUrl}" />`);
    
    return result;
  }

  // POST endpoint to auto-fetch/sync videos from YouTube/TikTok/Facebook APIs
  app.post("/api/videos/auto-fetch", async (req, res) => {
    try {
      const settingsList = await readCollection("video_api_settings");
      const settings = settingsList[0] || {};
      
      const ytApiKey = settings.youtubeApiKey || "";
      const ytChannelId = settings.youtubeChannelId || "";
      const tkClientKey = settings.tiktokClientKey || "";
      const fbAccessToken = settings.facebookAccessToken || "";
      const fbPageId = settings.facebookPageId || "";

      let fetchedCount = 0;
      let logs: string[] = [];

      // 1. YouTube API Real Fetch
      if (ytApiKey && ytChannelId) {
        try {
          const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${ytChannelId}&maxResults=5&order=date&type=video&key=${ytApiKey}`;
          const response = await fetch(ytUrl);
          
          if (response.ok) {
            const result = (await response.json()) as any;
            if (result.items && Array.isArray(result.items)) {
              const currentVideos = await readCollection("videos");
              let addedYt = 0;

              for (const item of result.items) {
                const videoId = item.id?.videoId;
                if (!videoId) continue;
                
                const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
                const exists = currentVideos.some((v: any) => v.videoUrl === videoUrl);
                
                if (!exists) {
                  const title = item.snippet?.title || "Video Humas Kemenag OKI";
                  const thumbnail = item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=400";
                  
                  const newVideo = {
                    id: "yt-" + videoId,
                    title,
                    videoUrl,
                    thumbnail,
                    duration: "05:00",
                    createdAt: new Date().toISOString()
                  };
                  
                  if (useMySQL && pool) {
                    await pool.query(
                      'INSERT INTO collections (id, collection_name, data) VALUES (?, ?, ?)',
                      ["yt-" + videoId, 'videos', JSON.stringify(newVideo)]
                    );
                  } else {
                    currentVideos.unshift(newVideo);
                  }
                  
                  addedYt++;
                  fetchedCount++;
                  logs.push(`Berhasil mengimpor video YouTube: "${title}"`);
                }
              }
              if (addedYt > 0 && !useMySQL) {
                await writeCollection("videos", currentVideos);
              }
            }
          } else {
            const errText = await response.text();
            console.error("YouTube API error:", errText);
            logs.push("Koneksi YouTube Gagal: Harap periksa kembali YouTube API Key.");
          }
        } catch (ytErr: any) {
          console.error("YouTube auto-fetch error:", ytErr);
          logs.push(`Kesalahan sinkronisasi YouTube: ${ytErr.message}`);
        }
      }

      
      // 2. Facebook Graph API Real Fetch
      if (fbAccessToken && fbPageId) {
        try {
          const fbUrl = `https://graph.facebook.com/v19.0/${fbPageId}/posts?fields=id,message,created_time,permalink_url,full_picture,attachments{media_type,media,url}&access_token=${fbAccessToken}&limit=10`;
          const fbResponse = await fetch(fbUrl);
          if (fbResponse.ok) {
            const fbResult = await fbResponse.json();
            if (fbResult.data && Array.isArray(fbResult.data)) {
              const currentVideos = await readCollection("videos");
              const currentPhotos = await readCollection("photos");
              let addedFbVideos = 0;
              let addedFbPhotos = 0;
              
              for (const post of fbResult.data) {
                const message = post.message || "Postingan Facebook";
                const title = message.length > 60 ? message.substring(0, 60) + '...' : message;
                const permalink = post.permalink_url || `https://www.facebook.com/${post.id}`;
                
                let isVideo = false;
                let isPhoto = false;
                let mediaUrl = post.full_picture;
                
                if (post.attachments && post.attachments.data && post.attachments.data.length > 0) {
                  const attachment = post.attachments.data[0];
                  if (attachment.media_type === 'video' || attachment.media_type === 'video_inline') {
                    isVideo = true;
                  } else if (attachment.media_type === 'photo' || attachment.media_type === 'album') {
                    isPhoto = true;
                  }
                } else if (post.full_picture) {
                   isPhoto = true;
                }
                
                if (isVideo) {
                  const exists = currentVideos.some(v => v.videoUrl === permalink || v.id === "fb-" + post.id);
                  if (!exists) {
                    const newVideo = {
                      id: "fb-" + post.id,
                      title,
                      videoUrl: permalink,
                      thumbnail: mediaUrl || "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80&w=400",
                      duration: "00:00",
                      createdAt: post.created_time || new Date().toISOString()
                    };
                    if (useMySQL && pool) {
                      await pool.query('INSERT INTO collections (id, collection_name, data) VALUES (?, ?, ?)', [newVideo.id, 'videos', JSON.stringify(newVideo)]);
                    } else {
                      currentVideos.unshift(newVideo);
                    }
                    addedFbVideos++;
                    fetchedCount++;
                    logs.push(`Berhasil mengimpor Video FB: "${title}"`);
                  }
                } else if (isPhoto && mediaUrl) {
                  const exists = currentPhotos.some(p => p.image === mediaUrl || p.id === "fb-" + post.id);
                  if (!exists) {
                    const newPhoto = {
                      id: "fb-" + post.id,
                      title,
                      image: mediaUrl,
                      createdAt: post.created_time || new Date().toISOString()
                    };
                    if (useMySQL && pool) {
                      await pool.query('INSERT INTO collections (id, collection_name, data) VALUES (?, ?, ?)', [newPhoto.id, 'photos', JSON.stringify(newPhoto)]);
                    } else {
                      currentPhotos.unshift(newPhoto);
                    }
                    addedFbPhotos++;
                    fetchedCount++;
                    logs.push(`Berhasil mengimpor Foto FB: "${title}"`);
                  }
                }
              }
              
              if (addedFbVideos > 0 && !useMySQL) await writeCollection("videos", currentVideos);
              if (addedFbPhotos > 0 && !useMySQL) await writeCollection("photos", currentPhotos);
            }
          } else {
            const errText = await fbResponse.text();
            console.error("Facebook API error:", errText);
            logs.push("Koneksi Facebook Gagal: Harap periksa kembali Token dan ID Page.");
          }
        } catch (fbErr) {
          console.error("Facebook auto-fetch error:", fbErr);
          logs.push(`Kesalahan sinkronisasi Facebook: ${fbErr.message}`);
        }
      }

      // 3. High fidelity TikTok mock simulation to enable instant dashboard preview
      if (!fbAccessToken && (tkClientKey || (!ytApiKey && !ytChannelId))) {
        const mockVideos = [
          {
            id: "auto-tk-1",
            title: "Pelepasan Jamaah Haji OKI 2026 Menuju Embarkasi Palembang",
            videoUrl: "https://www.tiktok.com/@kemenag_oki/video/7382910293847291029",
            thumbnail: "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80&w=400",
            duration: "01:45"
          },
          {
            id: "auto-fb-1",
            title: "Layanan Keliling KUA OKI 'Jemput Bola' di Wilayah Perairan",
            videoUrl: "https://www.facebook.com/watch/?v=8472910293847291",
            thumbnail: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=400",
            duration: "03:15"
          },
          {
            id: "auto-yt-extra",
            title: "Harmonisasi Umat Beragama di Ogan Komering Ilir - Humas Kemenag",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            thumbnail: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=400",
            duration: "10:20"
          }
        ];

        const currentVideos = await readCollection("videos");
        let addedMock = 0;

        for (const mv of mockVideos) {
          const exists = currentVideos.some((v: any) => v.videoUrl === mv.videoUrl);
          if (!exists) {
            const newVideo = {
              ...mv,
              createdAt: new Date().toISOString()
            };
            
            if (useMySQL && pool) {
              await pool.query(
                'INSERT INTO collections (id, collection_name, data) VALUES (?, ?, ?)',
                [mv.id, 'videos', JSON.stringify(newVideo)]
              );
            } else {
              currentVideos.unshift(newVideo);
            }
            addedMock++;
            fetchedCount++;
            logs.push(`Berhasil mengimpor otomatis: "${mv.title}"`);
          }
        }
        
        if (addedMock > 0 && !useMySQL) {
          await writeCollection("videos", currentVideos);
        }
      }

      res.json({
        success: true,
        fetchedCount,
        logs: logs.length > 0 ? logs : ["Semua media video dari sosial media Anda sudah mutakhir."]
      });
    } catch (err: any) {
      console.error("Auto-fetch videos error:", err);
      res.status(500).json({ error: "Gagal memproses sinkronisasi video otomatis", details: err.message });
    }
  });

  let viteInstance: any = null;

  // Intercept HTML pages requests to dynamically inject Open Graph (OG) meta tags
  app.get("*", async (req, res, next) => {
    // Skip if it is an API route, uploaded file, or standard static assets with extensions
    if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/") || req.path.startsWith("/@") || req.path.includes(".")) {
      return next();
    }

    // Many scrapers (Facebook, WhatsApp, Twitter) use Accept: */* instead of text/html
    // Since we already filter out extensions and APIs above, it's safe to process this request
    const acceptHeader = req.headers.accept || "";
    const isHtmlRequest = acceptHeader.includes("text/html") || acceptHeader.includes("*/*") || acceptHeader === "";
    
    // Also explicitly check common bot User-Agents just to be safe
    const userAgent = (req.headers["user-agent"] || "").toLowerCase();
    const isBot = userAgent.includes("bot") || userAgent.includes("whatsapp") || userAgent.includes("facebook") || userAgent.includes("twitter") || userAgent.includes("telegram");

    if (!isHtmlRequest && !isBot) {
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
