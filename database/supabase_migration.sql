-- Skrip Migrasi Supabase Auth
-- PENTING: Jalankan skrip ini di SQL Editor Supabase Anda!

BEGIN;

-- 1. Migrasi status boolean ke text
ALTER TABLE public.users ADD COLUMN new_status TEXT DEFAULT 'pending';
UPDATE public.users SET new_status = 'approved' WHERE status = true;
UPDATE public.users SET new_status = 'inactive' WHERE status = false;

-- 2. Tambah kolom email_verified
ALTER TABLE public.users ADD COLUMN email_verified BOOLEAN DEFAULT false;
-- Anggap pengguna lama yang sudah disetujui, emailnya otomatis terverifikasi agar bisa langsung login
UPDATE public.users SET email_verified = true WHERE new_status = 'approved';

-- 3. Hapus kolom status lama dan ganti dengan yang baru
ALTER TABLE public.users DROP COLUMN status;
ALTER TABLE public.users RENAME COLUMN new_status TO status;

-- 4. Pindahkan data pengguna ke auth.users bawaan Supabase
-- Pastikan ekstensi pgcrypto aktif (biasanya sudah aktif di Supabase)
-- Karena Supabase menggunakan bcrypt, kita coba pindahkan hash lama. 
-- Jika pengguna tetap gagal login (karena perbedaan salt cost/format), 
-- mereka dapat menggunakan fitur Lupa Password.
INSERT INTO auth.users (
  instance_id, 
  id, 
  aud, 
  role, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  created_at, 
  updated_at
)
SELECT 
  '00000000-0000-0000-0000-000000000000', 
  id, 
  'authenticated', 
  'authenticated', 
  email, 
  password_hash, 
  NOW(), -- otomatis terkonfirmasi untuk user lama
  created_at, 
  updated_at
FROM public.users;

-- 5. Tambahkan Foreign Key dari public.users(id) ke auth.users(id)
ALTER TABLE public.users 
  ADD CONSTRAINT users_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- 6. Hapus kolom password_hash di public.users karena sudah tidak digunakan
ALTER TABLE public.users DROP COLUMN password_hash;

COMMIT;
