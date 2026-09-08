# 📁 E-Arsip — Sistem Pengarsipan Digital Dinas Pendidikan

Sistem pengarsipan dokumen digital berbasis web untuk Dinas Pendidikan Kota Medan. Dibangun dengan arsitektur monorepo yang menggabungkan frontend React dan backend Express dalam satu repository.

---

## 🚀 Tech Stack

### Frontend
| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| [React](https://react.dev/) | ^18.3.1 | UI Framework |
| [Vite](https://vitejs.dev/) | ^5.4.2 | Build tool & dev server |
| [React Router DOM](https://reactrouter.com/) | ^6.26.0 | Client-side routing |
| [TanStack React Query](https://tanstack.com/query) | ^5.51.0 | Server state management & caching |
| [Axios](https://axios-http.com/) | ^1.7.4 | HTTP client |
| [Tailwind CSS](https://tailwindcss.com/) | ^3.4.10 | Utility-first CSS framework |
| [Lucide React](https://lucide.dev/) | ^1.14.0 | Icon library |
| [React Hot Toast](https://react-hot-toast.com/) | ^2.6.0 | Notifikasi toast |

### Backend
| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| [Node.js](https://nodejs.org/) | ≥18.x | Runtime JavaScript |
| [Express.js](https://expressjs.com/) | ^4.21.0 | Web framework |
| [Supabase JS](https://supabase.com/docs/reference/javascript) | ^2.45.0 | Database client (PostgreSQL) |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | ^9.0.2 | Autentikasi JWT |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | ^2.4.3 | Hashing password |
| [multer](https://github.com/expressjs/multer) | ^1.4.5 | Upload file |
| [cors](https://github.com/expressjs/cors) | ^2.8.5 | Cross-Origin Resource Sharing |
| [dotenv](https://github.com/motdotla/dotenv) | ^16.4.5 | Environment variables |
| [nodemon](https://nodemon.io/) | ^3.1.4 | Auto-restart dev server |

### Database & Infrastructure
| Teknologi | Kegunaan |
|-----------|----------|
| [Supabase](https://supabase.com/) | Backend-as-a-Service (PostgreSQL hosted) |
| [PostgreSQL](https://www.postgresql.org/) | Relational database |

### Dev Tools
| Teknologi | Kegunaan |
|-----------|----------|
| [concurrently](https://github.com/open-cli-tools/concurrently) | Menjalankan frontend & backend sekaligus |

---

## 🗄️ Skema Database

### ERD Ringkas

```
users ──< folders (dibuat_oleh)
users ──< files   (diunggah_oleh)
users ──< activity_logs (user_id)
folders ──< folders (parent_id, self-referential)
folders ──< files (folder_id)
files ──< activity_logs (file_id)
```

### Tabel: `users`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | UUID (PK) | Primary key, auto-generate |
| `nama` | VARCHAR(150) | Nama lengkap pengguna |
| `email` | VARCHAR(255) UNIQUE | Email untuk login |
| `password_hash` | VARCHAR(255) | Password yang sudah di-hash (bcrypt) |
| `role` | ENUM (`pegawai`, `admin`) | Peran pengguna |
| `status` | BOOLEAN | `TRUE` = aktif/approved, `FALSE` = pending |
| `created_at` | TIMESTAMP | Waktu registrasi |
| `updated_at` | TIMESTAMP | Waktu update terakhir |

### Tabel: `folders`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | UUID (PK) | Primary key |
| `nama` | VARCHAR(255) | Nama folder |
| `parent_id` | UUID (FK → folders) | Folder induk (NULL = root) |
| `dibuat_oleh` | UUID (FK → users) | Pembuat folder |
| `dibuat_pada` | TIMESTAMP | Waktu pembuatan |
| `diperbarui_pada` | TIMESTAMP | Waktu update terakhir |

### Tabel: `files`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | UUID (PK) | Primary key |
| `nama_file` | VARCHAR(255) | Nama file di storage |
| `nama_asli` | VARCHAR(255) | Nama file asli saat upload |
| `tipe_mime` | VARCHAR(100) | Tipe MIME file |
| `ukuran_bytes` | BIGINT | Ukuran file dalam bytes |
| `path_penyimpanan` | VARCHAR(500) | Path penyimpanan file |
| `folder_id` | UUID (FK → folders) | Folder tempat file berada |
| `diunggah_oleh` | UUID (FK → users) | Pengunggah file |
| `diunggah_pada` | TIMESTAMP | Waktu upload |
| `dihapus_pada` | TIMESTAMP | Soft delete timestamp (NULL = aktif) |

### Tabel: `activity_logs`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | UUID (PK) | Primary key |
| `user_id` | UUID (FK → users) | Pengguna yang melakukan aksi |
| `aksi` | ENUM | Jenis aksi (lihat daftar di bawah) |
| `file_id` | UUID (FK → files) | File terkait (nullable) |
| `keterangan` | TEXT | Deskripsi detail aksi |
| `ip_address` | VARCHAR(45) | Alamat IP pengguna |
| `terjadi_pada` | TIMESTAMP | Waktu kejadian |

**Enum `aksi`:**
`login`, `logout`, `upload_file`, `download_file`, `hapus_file`, `cari_file`, `buat_folder`, `hapus_folder`, `edit_profil`, `tambah_pegawai`, `nonaktifkan_pegawai`

---

## 📂 Struktur Proyek

```
earsip/
├── backend/                  # Express.js API
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js   # Konfigurasi Supabase client
│   │   ├── controllers/      # Logic bisnis tiap endpoint
│   │   │   ├── authController.js
│   │   │   ├── adminController.js
│   │   │   ├── folderController.js
│   │   │   ├── fileController.js
│   │   │   └── statsController.js
│   │   ├── middleware/
│   │   │   ├── auth.js       # JWT authentication guard
│   │   │   └── roleGuard.js  # Role-based access control
│   │   ├── routes/           # Definisi endpoint API
│   │   └── app.js            # Entry point Express
│   ├── .env                  # Environment variables (tidak di-commit)
│   └── package.json
│
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js      # Axios instance & interceptor
│   │   ├── components/       # Komponen reusable
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── FolderCard.jsx
│   │   │   └── FileCard.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Global auth state
│   │   ├── pages/            # Halaman aplikasi
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── FolderPage.jsx
│   │   │   ├── SearchPage.jsx
│   │   │   ├── ManagePegawaiPage.jsx
│   │   │   └── ActivityLogPage.jsx
│   │   ├── App.jsx           # Router utama
│   │   └── index.css         # Global styles & Tailwind
│   ├── .env                  # Variabel frontend (tidak di-commit)
│   └── package.json
│
├── database/
│   ├── database.sql          # Script DDL (buat semua tabel)
│   └── createAdmin.sql       # Script insert akun admin pertama
│
├── .gitignore
├── package.json              # Root script (menjalankan keduanya)
└── README.md
```

---

## ⚙️ Cara Menjalankan Proyek

### Prasyarat
- **Node.js** versi 18 atau lebih baru → [Download](https://nodejs.org/)
- **Akun Supabase** (gratis) → [supabase.com](https://supabase.com/)
- **Git** → [Download](https://git-scm.com/)

---

### 1. Clone Repository

```bash
git clone https://github.com/Muhzakk1/website-E_Arsip.git
cd website-E_Arsip
```

---

### 2. Setup Database di Supabase

1. Buat project baru di [supabase.com](https://supabase.com/)
2. Buka **SQL Editor** di dashboard Supabase
3. Jalankan script berikut secara berurutan:

**Langkah 2a — Buat semua tabel:**
```sql
-- Salin isi file: database/database.sql
```

**Langkah 2b — Buat akun admin pertama:**
```sql
-- Salin isi file: database/createAdmin.sql
```

> Login default admin: **Email:** `admin@dinas.go.id` | **Password:** `admin123`

---

### 3. Konfigurasi Environment Variables

#### Backend (`backend/.env`)
```env
PORT=5000
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...   # Service Role Key (BUKAN anon key!)
JWT_SECRET=isi_random_string_minimal_32_karakter
JWT_EXPIRES_IN=8h
FRONTEND_URL=http://localhost:5173
```

Cara mendapat nilai Supabase:
- Buka **Supabase → Settings → API**
- **Project URL** → `SUPABASE_URL`
- **service_role** secret → `SUPABASE_SERVICE_KEY`

> ⚠️ **Pastikan menggunakan `service_role` key**, bukan `anon` key!

Cara generate `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

### 4. Install Dependensi

```bash
# Di root folder (menginstall concurrently)
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

---

### 5. Jalankan Aplikasi

```bash
# Di root folder — menjalankan backend & frontend sekaligus
npm run dev
```

Setelah berhasil:
- **Frontend** → http://localhost:5173
- **Backend API** → http://localhost:5000
- **Health check** → http://localhost:5000/api/health

---

### Troubleshooting

#### Port sudah digunakan (EADDRINUSE)
Jalankan perintah berikut di PowerShell untuk mematikan proses yang menggunakan port 5000 dan 5173:
```powershell
@(5000, 5173) | ForEach-Object {
  Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess |
  ForEach-Object { Stop-Process -Id $_ -Force }
}
```

#### Login gagal / 401 Unauthorized
- Pastikan `SUPABASE_SERVICE_KEY` adalah **service_role** key (bukan `anon` key)
- Pastikan tabel sudah dibuat dengan benar di Supabase
- Jalankan `createAdmin.sql` untuk membuat akun admin

---

## 🔐 API Endpoints

### Autentikasi (`/api/auth`)
| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| POST | `/api/auth/register` | Public | Daftar akun baru |
| POST | `/api/auth/login` | Public | Login & dapat token JWT |
| GET | `/api/auth/me` | Auth | Info user yang sedang login |
| POST | `/api/auth/logout` | Auth | Logout (log aktivitas) |

### Folder (`/api/folders`)
| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| GET | `/api/folders` | Auth | Semua folder |
| GET | `/api/folders/:id` | Auth | Detail folder & isinya |
| POST | `/api/folders` | Auth | Buat folder baru |
| DELETE | `/api/folders/:id` | Admin | Hapus folder |

### File (`/api/files`)
| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| POST | `/api/files/upload` | Auth | Upload file ke folder |
| DELETE | `/api/files/:id` | Auth | Hapus file (soft delete) |
| GET | `/api/files/search` | Auth | Cari file |

### Admin (`/api/admin`)
| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| GET | `/api/admin/users` | Admin | Semua pegawai aktif |
| GET | `/api/admin/users/pending` | Admin | Pendaftaran menunggu |
| POST | `/api/admin/users` | Admin | Tambah pegawai baru |
| PATCH | `/api/admin/users/:id/approve` | Admin | Setujui pendaftaran |
| PATCH | `/api/admin/users/:id/status` | Admin | Toggle aktif/nonaktif |
| PUT | `/api/admin/users/:id` | Admin | Edit data pegawai |
| DELETE | `/api/admin/users/:id` | Admin | Hapus akun pegawai |
| GET | `/api/admin/logs` | Admin | Log aktivitas sistem |

---

## 🎨 Palet Warna

| Nama | Hex | Penggunaan |
|------|-----|------------|
| Primary Blue | `#297BBF` | Sidebar, tombol utama, ikon, link aktif |
| Accent Yellow | `#FBD206` | Badge Admin, highlight, kartu aksen |
| Black | `#000000` | Teks utama, heading |
| White | `#FFFFFF` | Background, card, container |

---

## 👥 Peran Pengguna

| Peran | Hak Akses |
|-------|-----------|
| **Admin** | Kelola pegawai, lihat log aktivitas, semua fitur pegawai |
| **Pegawai** | Upload/download file, buat folder, cari dokumen |

> Akun baru yang mendaftar melalui halaman Register memiliki status **pending** dan harus disetujui oleh Admin sebelum bisa login.

---

## 📄 Lisensi

Proyek ini dikembangkan untuk keperluan internal **Dinas Pendidikan Kota Medan**.
