# Panduan Deploy ke Hosting (cPanel / Hostinger Node.js)

Project ini menggunakan arsitektur **Full-Stack (React Vite + Express Node.js)**. Berbeda dengan website statis biasa (HTML/PHP), aplikasi ini membutuhkan Node.js agar server database MySQL dan API dapat berjalan.

## Kenapa Muncul Error 503 Saat Deploy dari GitHub?
Jika Anda melakukan **deploy langsung dari GitHub** dan mendapatkan error 503, ini disebabkan karena folder `dist/` **diabaikan (ignored)** oleh `.gitignore`. 
Aplikasi ini *membutuhkan* folder `dist/` untuk berjalan, namun karena tidak ada di GitHub, Node.js App gagal menemukan file `dist/server.cjs` dan akhirnya crash (menghasilkan error 503).

### Solusi untuk Deploy via GitHub:
Pilih salah satu dari 2 solusi ini:
1. **(Direkomendasikan)** Pada pengaturan deploy di Panel Hosting Anda, tambahkan perintah build setelah `npm install`:
   ```bash
   npm install && npm run build
   ```
2. **Atau**, hapus baris `dist` dari file `.gitignore` di komputer Anda, lalu jalankan `npm run build`, dan commit/push folder `dist` tersebut ke GitHub agar ikut terbawa ke hosting.

## Pengaturan "Preset Framework" di Hosting
Jika panel hosting Anda (misal: Hostinger, Vercel, dll) meminta Anda memilih **Preset Framework**:
- **PILIH:** `Node.js` atau `Express` atau `Other / Custom`.
- **JANGAN PILIH:** `Vite`, `React`, atau `Static Site`. 
Karena jika Anda memilih Vite/React, hosting hanya akan meng-hosting frontend statisnya saja, dan API backend (serta database) Anda **tidak akan jalan**.

---

## Metode 1: Menggunakan "Setup Node.js App" di cPanel (Upload Manual)
Banyak hosting seperti Hostinger, Niagahoster, atau cPanel menyediakan menu **"Setup Node.js App"**.

1. Buka cPanel, cari menu **Setup Node.js App** (atau Node.js).
2. Buat aplikasi baru (**Create Application**).
3. Isi konfigurasi berikut:
   - **Node.js Version:** Pilih versi 18 atau 20.
   - **Application mode:** Production
   - **Application root:** `kemenag-app` (atau nama folder tempat Anda clone/upload file, letakkan di *luar* `public_html` agar lebih aman, misal di `/home/user/kemenag-app`).
   - **Application URL:** Pilih domain Anda.
   - **Application startup file:** `dist/server.cjs` (Sangat Penting! File ini harus sudah ada. Jika cPanel memaksa ekstensi `.js`, buat file `app.js` di root yang isinya `require('./dist/server.cjs');` lalu arahkan ke `app.js`).
4. Klik **Create / Save**.
5. Masuk ke aplikasi tersebut lalu jalankan **NPM Install** via tombol di cPanel, atau via SSH (Terminal):
   ```bash
   npm install
   npm run build
   ```
6. Buat/edit file `.env` di dalam folder application root Anda:
   ```env
   DB_HOST=localhost (atau 127.0.0.1)
   DB_USER=username_database_cpanel
   DB_PASSWORD=password_database_cpanel
   DB_NAME=nama_database_cpanel
   ```
7. Restart aplikasi Node.js Anda dari cPanel.

### 💡 Mengapa File Setup Node.js ditaruh di luar public_html?
Ini adalah praktik keamanan standar Node.js. Node.js akan meng-handle request web yang masuk secara internal tanpa perlu mengekspos folder kode Anda ke publik. Router Node.js yang akan mengurus tampilan frontend ke user.

## Metode 2: Hosting VPS (Ubuntu / Debian)
Jika Anda menggunakan VPS, langkahnya lebih bebas:
1. Clone / upload file project ke VPS.
2. Install Node.js dan PM2 (jika belum ada):
   ```bash
   sudo apt update
   sudo apt install nodejs npm
   sudo npm install -g pm2
   ```
3. Masuk ke folder project, install dependensi dan build:
   ```bash
   npm install
   npm run build
   ```
4. Buat file `.env` dan atur koneksi MySQL Anda.
5. Jalankan aplikasi menggunakan PM2:
   ```bash
   pm2 start dist/server.cjs --name "kemenag-oki"
   pm2 save
   ```

## Troubleshooting
- **Aplikasi Crash (Error 503 / 500):** 
  - Pastikan Anda sudah menjalankan `npm run build` sehingga ada file `dist/server.cjs`!
  - Cek file `.env`, pastikan kredensial MySQL benar.
  - Cek permission file/folder.
- **Port Error:** Aplikasi ini sudah menggunakan deteksi otomatis `process.env.PORT || 3000`. Jika server cPanel menggunakan Phusion Passenger, port otomatis akan di-inject ke aplikasi.
