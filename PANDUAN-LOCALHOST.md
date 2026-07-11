# Panduan Menjalankan Project 100% di Localhost dengan Database MySQL

Project ini sudah dirancang secara **Full-Stack (React Vite + Express Node.js)** dengan dukungan penuh database **MySQL**. Jika koneksi MySQL aktif, aplikasi akan langsung menyimpan seluruh data berita, banner, agenda, pengumuman, layanan, dan media ke database MySQL. Jika MySQL tidak aktif atau belum dikonfigurasi, aplikasi memiliki fitur pintar yang otomatis beralih (*fallback*) ke file penyimpanan JSON lokal (`data/*.json`), sehingga aplikasi dijamin aman dan tidak akan pernah crash.

Berikut adalah langkah-langkah praktis untuk memindahkan dan menjalankan project ini secara mandiri 100% di komputer lokal (*localhost*) Anda.

---

## 📋 Persyaratan Sistem (Prerequisites)

Sebelum memulai, pastikan komputer lokal Anda sudah terinstall:
1. **Node.js** (Sangat disarankan versi LTS: v18, v20, atau v22).
2. **MySQL Server** (Bisa menggunakan XAMPP, Laragon, WampServer, Docker, atau instalasi MySQL mandiri).
3. **Git** (Opsional, untuk mendownload/mengelola source code).
4. **Code Editor** (Disarankan menggunakan VS Code).

---

## 🚀 Langkah-Langkah Instalasi di Localhost

### Langkah 1: Ekstrak Source Code Project
Ekstrak file ZIP hasil export project ini atau clone ke direktori komputer lokal Anda (misal: `C:\xampp\htdocs\kemenag-oki` atau `/Users/username/kemenag-oki`).

### Langkah 2: Install Dependensi Node.js
Buka Terminal / Command Prompt (CMD), arahkan ke direktori project Anda, lalu jalankan perintah berikut untuk menginstall seluruh paket library:
```bash
npm install
```

### Langkah 3: Konfigurasi Database MySQL
1. Aktifkan MySQL Server Anda (misalnya melalui panel kontrol XAMPP dengan menekan tombol **Start** pada modul MySQL).
2. Buka alat pengelola database Anda (seperti **phpMyAdmin**, **HeidiSQL**, **DBeaver**, atau Navicat).
3. Buat database baru bernama, contoh: `u239881393_nodebd` atau nama bebas pilihan Anda:
   ```sql
   CREATE DATABASE u239881393_nodebd;
   ```
4. **Import Data Awal (Sangat Direkomendasikan):**
   Gunakan menu **Import** di phpMyAdmin/alat database Anda, lalu pilih file `database.sql` yang ada di folder utama project ini untuk langsung memuat data awal berita, agenda, layanan, banner, dan pengaturan lainnya yang sudah ada.
   
   *Catatan: Jika Anda tidak mengimport `database.sql`, sistem Express server akan otomatis mendeteksi dan membuat tabel kosong bernama `collections` saat pertama kali dijalankan, tetapi data berita dan isinya akan kosong.*

### Langkah 4: Konfigurasi File Environment (`.env`)
1. Di folder utama project, buat file baru bernama `.env` (atau salin dari file `.env.example`).
2. Masukkan kredensial MySQL lokal Anda. Contoh konfigurasi umum localhost:
   ```env
   # Koneksi Database MySQL Lokal
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=            # Kosongkan jika menggunakan default XAMPP/WAMP
   DB_NAME=u239881393_nodebd
   
   # Password Administrator untuk Login Panel Admin
   ADMIN_PASSWORD=kemenagoki123
   
   # URL Aplikasi Lokal
   APP_URL=http://localhost:3000
   
   # API Key untuk AI (Opsional)
   GEMINI_API_KEY=
   ```

### Langkah 5: Jalankan Aplikasi di Localhost

Anda dapat menjalankan aplikasi dalam dua mode:

#### A. Mode Pengembangan (Development Mode - Recommended)
Menjalankan server Express dan hot-rebuild client secara instan untuk kebutuhan edit/pengembangan:
```bash
npm run dev
```
Setelah berjalan, buka browser Anda dan akses:
👉 **`http://localhost:3000`**

Di terminal, Anda akan melihat pesan sukses berikut jika berhasil terkoneksi ke MySQL:
```text
Connected to MySQL database and verified collections table.
[Hosting Server] Active on port 3000
```

#### B. Mode Produksi (Production Mode - High Performance)
Melakukan compile build React agar performa menjadi sangat cepat, lalu menjalankannya sebagai server mandiri:
```bash
# 1. Build project
npm run build

# 2. Jalankan server produksi
npm start
```

---

## 🛠️ Bagaimana Sistem Database MySQL di Project ini Bekerja?

Project ini menggunakan arsitektur **NoSQL-on-SQL (Hybrid JSON Document)** menggunakan kolom JSON native MySQL.
- **Tabel Tunggal Pintar:** Seluruh data disimpan dalam satu tabel bernama `collections`.
  - Kolom `id`: Menyimpan ID dokumen unik (seperti News ID, Agenda ID, dll).
  - Kolom `collection_name`: Menyimpan kategori koleksi (`news`, `agendas`, `announcements`, `banners`, `uploaded_files`, dll).
  - Kolom `data`: Kolom dengan tipe data **JSON** yang menyimpan struktur data lengkap secara dinamis.
- **Keuntungan Pendekatan ini:**
  1. **Skalabilitas Tanpa Batas:** Anda tidak perlu melakukan migrasi database yang rumit atau menjalankan `ALTER TABLE` setiap kali ingin menambah field baru pada berita atau agenda.
  2. **Performa Tinggi:** Kolom JSON di MySQL didukung penuh dengan kecepatan pembacaan setara NoSQL dan diindeks secara otomatis.
  3. **Kemudahan Backup:** Cukup ekspor tabel `collections` untuk mem-backup seluruh website.

---

## 🔐 Login ke Panel Admin

Untuk masuk ke dashboard manajemen konten:
1. Akses halaman login di: **`http://localhost:3000/login`**
2. Masukkan kredensial administrator default:
   - **Email:** `anisreza498@gmail.com`
   - **Password:** `kemenagoki123` *(Sesuai dengan isi variabel `ADMIN_PASSWORD` di `.env` lokal Anda)*
3. Setelah login, Anda memiliki akses penuh untuk menambah, mengedit, dan menghapus seluruh berita, foto, video, agenda, pengumuman, dan file PDF secara interaktif.

Selamat mengembangkan dan mengoperasikan sistem Kementerian Agama Kabupaten OKI secara lokal! 🇮🇩
