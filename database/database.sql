CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE role_enum AS ENUM ('pegawai', 'admin');
CREATE TYPE aksi_enum AS ENUM (
  'login','logout','upload_file','download_file',
  'hapus_file','cari_file','buat_folder','hapus_folder',
  'edit_profil','tambah_pegawai','nonaktifkan_pegawai'
);

CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama           VARCHAR(150) NOT NULL,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  role           role_enum NOT NULL DEFAULT 'pegawai',
  status         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE folders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama            VARCHAR(255) NOT NULL,
  parent_id       UUID REFERENCES folders(id) ON DELETE CASCADE,
  dibuat_oleh     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  dibuat_pada     TIMESTAMP NOT NULL DEFAULT NOW(),
  diperbarui_pada TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE files (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_file        VARCHAR(255) NOT NULL,
  nama_asli        VARCHAR(255) NOT NULL,
  tipe_mime        VARCHAR(100) NOT NULL,
  ukuran_bytes     BIGINT NOT NULL,
  path_penyimpanan VARCHAR(500) NOT NULL,
  folder_id        UUID NOT NULL REFERENCES folders(id) ON DELETE RESTRICT,
  diunggah_oleh    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  diunggah_pada    TIMESTAMP NOT NULL DEFAULT NOW(),
  dihapus_pada     TIMESTAMP DEFAULT NULL
);

CREATE TABLE activity_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  aksi         aksi_enum NOT NULL,
  file_id      UUID REFERENCES files(id) ON DELETE SET NULL,
  keterangan   TEXT,
  ip_address   VARCHAR(45),
  terjadi_pada TIMESTAMP NOT NULL DEFAULT NOW()
);