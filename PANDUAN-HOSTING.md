# Panduan Deploy ke Hosting (cPanel / Hostinger Node.js)

Project ini menggunakan arsitektur **Full-Stack (React Vite + Express Node.js)**. Berbeda dengan website statis biasa (HTML/PHP), aplikasi ini membutuhkan Node.js agar server database MySQL dan API dapat berjalan.

Jika Anda melihat folder `.builds` atau error saat melakukan build otomatis via panel hosting, itu biasanya karena auto-installer hosting salah mendeteksi framework (mengira ini murni static React/Vite, padahal ini ada backend Node.js). 

Ikuti panduan manual berikut untuk hasil 100% berhasil di Hosting (cPanel / Hostinger / VPS):

## Persiapan Sebelum Upload
1. Di komputer Anda, pastikan sudah menjalankan:
   ```bash
   npm run build
   ```
2. Perintah di atas akan menghasilkan folder `dist` yang berisi file frontend (HTML/CSS/JS) dan file `dist/server.cjs` yang merupakan backend servernya.
3. Anda **tidak perlu** mengupload folder `node_modules`. 
4. Buat file `.env` dan masukkan konfigurasi database MySQL hosting Anda.

## Metode 1: Menggunakan "Setup Node.js App" di cPanel (Paling Umum)
Banyak hosting seperti Hostinger, Niagahoster, atau cPanel menyediakan menu **"Setup Node.js App"**.

1. Buka cPanel, cari menu **Setup Node.js App** (atau Node.js).
2. Buat aplikasi baru (**Create Application**).
3. Isi konfigurasi berikut:
   - **Node.js Version:** Pilih versi 18 atau 20.
   - **Application mode:** Production
   - **Application root:** `kemenag-app` (atau nama folder tempat Anda upload file, letakkan di *luar* `public_html` agar lebih aman, misalnya di `/home/username/kemenag-app`).
   - **Application URL:** Pilih domain Anda.
   - **Application startup file:** `dist/server.cjs` (Sangat Penting! Ini adalah file utama backend Anda).
4. Klik **Create / Save**.
5. Masuk ke **File Manager** cPanel.
6. **PENTING: Apa saja yang harus diupload?**
   Karena ini adalah aplikasi Full-Stack (memiliki backend Node.js untuk koneksi MySQL), Anda **TIDAK BISA** hanya mengupload isi folder `dist` saja. Anda harus mengupload file-file berikut ke folder application root tadi (`kemenag-app`):
   - 📁 `dist/` (Berisi frontend dan file `server.cjs`)
   - 📁 `uploads/` (Folder untuk menyimpan foto/file PDF yang diupload)
   - 📁 `data/` (Folder untuk penyimpanan sementara jika MySQL mati)
   - 📄 `package.json` (Sangat penting agar cPanel bisa menginstall library Node.js)
   - 📄 `package-lock.json`
   - 📄 `app.js` (File wrapper untuk cPanel yang baru saja kita buat)
   
   *(Anda boleh mengabaikan folder `src`, `node_modules`, dan file konfigurasi lokal lainnya saat proses upload)*.

### 💡 Tips Mengakali Batas Ukuran Upload ZIP di Hosting (Max Upload Size)

Jika Control Panel / File Manager hosting Anda menolak file ZIP karena **ukurannya terlalu besar**, ikuti cara ini untuk memperkecil ukuran file sebelum diupload:

1. **JANGAN masukkan folder `node_modules`** ke dalam file ZIP Anda. Folder ini sangat besar (ratusan MB) dan berisi ribuan file. 
   - *Solusi:* Seperti pada Langkah 8 di atas, biarkan hosting Anda yang menginstallnya nanti menggunakan tombol **Run NPM Install** di cPanel.
2. **JANGAN masukkan folder `.git`** jika ada (folder tersembunyi).
3. **JANGAN masukkan folder `src`, `public`, dan file config** (`vite.config.ts`, `tailwind.config.js`, dll) karena kode mentah ini tidak diperlukan oleh server produksi.
4. **Hanya ZIP file/folder yang benar-benar wajib:**
   - Sorot / Blok folder `dist`, folder `data`, folder `uploads`, file `package.json`, file `package-lock.json`, dan file `app.js`.
   - Klik kanan, lalu pilih **Compress to ZIP file** (Windows) atau **Compress** (Mac).
   - Ukuran ZIP Anda sekarang seharusnya **sangat kecil** (biasanya di bawah 5MB) dan pasti berhasil diupload ke cPanel manapun.

7. Di folder tersebut, buat/edit file `.env` dengan koneksi database MySQL hosting Anda:
   ```env
   DB_HOST=localhost (atau 127.0.0.1)
   DB_USER=username_database_cpanel
   DB_PASSWORD=password_database_cpanel
   DB_NAME=nama_database_cpanel
   ```
8. Kembali ke menu **Setup Node.js App**, scroll ke bawah, lalu klik tombol **Run NPM Install** (untuk mendownload dependencies backend).
9. Jika sudah selesai, klik tombol **Restart** pada aplikasi Node.js Anda.
10. Website siap diakses di domain Anda!

## Metode 2: Hosting VPS (Ubuntu / Debian)
Jika Anda menggunakan VPS (Virtual Private Server), langkahnya lebih mudah dan bebas masalah:

1. Upload file project ke VPS.
2. Install Node.js dan PM2 (jika belum ada):
   ```bash
   sudo apt update
   sudo apt install nodejs npm
   sudo npm install -g pm2
   ```
3. Masuk ke folder project, lalu install dependensi dan build:
   ```bash
   npm install
   npm run build
   ```
4. Buat file `.env` dan atur koneksi MySQL Anda.
5. Jalankan aplikasi menggunakan PM2 agar online 24 jam:
   ```bash
   pm2 start dist/server.cjs --name "kemenag-oki"
   pm2 save
   ```
6. Atur Nginx Reverse Proxy (jika menggunakan Nginx) agar mengarah ke port 3000 (default port aplikasi ini).

## Troubleshooting (Jika ada masalah di cPanel)

- **Aplikasi Crash (Error 503 / 500):** Cek file log (biasanya `stderr.log` di cPanel Node.js App). Kemungkinan besar file `.env` salah, MySQL tidak aktif, atau port tabrakan.
- **Port Error:** Beberapa shared hosting tidak mengizinkan hardcode Port 3000. Jika server cPanel memaksakan Environment `PORT`, aplikasi ini sudah dirancang untuk membaca otomatis file `.env`. Anda tidak perlu mengubah kode apapun.
- **File Startup Tidak Ditemukan:** Jika cPanel mewajibkan file startup harus ada di root dengan nama `app.js`, buat file baru bernama `app.js` di root folder Anda, dan isi dengan kode berikut:
  ```javascript
  require('./dist/server.cjs');
  ```
  Lalu di cPanel, atur *Application startup file* menjadi `app.js`.

Semoga berhasil memindahkan ke hosting! Server aplikasi sudah dirancang mandiri tanpa dependensi luar selain MySQL.
