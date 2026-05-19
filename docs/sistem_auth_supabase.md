# Sistem Registrasi, Verifikasi Email, dan Lupa Password Menggunakan Supabase

## Pendahuluan

Dokumen ini menjelaskan implementasi sistem:

- Registrasi user
- Approval admin
- Verifikasi email menggunakan Supabase
- Sistem lupa password (forgot password)
- Validasi format email fleksibel

Sistem ini cocok digunakan untuk:

- aplikasi mobile
- website modern
- prototype
- MVP startup
- production system

---

# 1. Tujuan Sistem

Tujuan utama sistem:

1. Memastikan email user valid
2. Mengurangi akun palsu
3. Mengontrol pendaftaran user melalui approval admin
4. Menyediakan fitur reset password yang aman
5. Mendukung berbagai domain email

Contoh domain yang didukung:

- gmail.com
- yahoo.co.id
- kampus.ac.id
- startup.id
- dan domain lainnya

---

# 2. Flow Registrasi User

## Alur Sistem

```text
User Register
↓
Data disimpan ke database
↓
Status akun = pending
↓
Admin mengecek data user
↓
Admin approve user
↓
Supabase mengirim email verifikasi
↓
User klik link verifikasi
↓
Email verified
↓
Akun aktif dan bisa login
```

---

# 3. Struktur Database

## Tabel users_profile

```sql
CREATE TABLE users_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'user',
    status TEXT DEFAULT 'pending',
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

# 4. Status User

| Status | Keterangan |
|---|---|
| pending | Menunggu persetujuan admin |
| approved | Disetujui admin |
| rejected | Ditolak admin |
| active | Email sudah diverifikasi |

---

# 5. Validasi Format Email Fleksibel

## Regex Validasi Email

```regex
^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$
```

## Contoh Email Valid

```text
user@gmail.com
admin@yahoo.co.id
mahasiswa@kampus.ac.id
support@startup.id
```

## Contoh Email Tidak Valid

```text
usergmail.com
@gmail.com
user@
```

---

# 6. Registrasi User Menggunakan Supabase

## Contoh Register

```javascript
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password
});
```

---

# 7. Menyimpan Status Pending

```javascript
await supabase.from('users_profile').insert({
  id: data.user.id,
  full_name: fullName,
  email: email,
  status: 'pending',
  email_verified: false
});
```

---

# 8. Login Sebelum Approval

## Logika Sistem

```javascript
IF status !== 'approved'
{
   tampilkan:
   "Akun anda belum disetujui admin"
}
```

---

# 9. Admin Approve User

## Contoh Approval

```javascript
await supabase
  .from('users_profile')
  .update({
    status: 'approved'
  })
  .eq('id', userId);
```

---

# 10. Mengirim Email Verifikasi

## Menggunakan Supabase Resend

```javascript
await supabase.auth.resend({
  type: 'signup',
  email: email
});
```

---

# 11. Flow Verifikasi Email

```text
Email diterima
↓
Klik tombol verifikasi
↓
Supabase memvalidasi token
↓
Email verified
```

---

# 12. Update Status Setelah Verifikasi

```javascript
await supabase
  .from('users_profile')
  .update({
    email_verified: true,
    status: 'active'
  })
  .eq('id', userId);
```

---

# 13. Login Hanya Untuk User Active

## Logika Login

```javascript
IF status !== 'active'
{
   tampilkan:
   "Silakan verifikasi email terlebih dahulu"
}
ELSE
{
   login berhasil
}
```

---

# 14. Sistem Lupa Password

## Tujuan

Memberikan cara aman untuk reset password user.

---

# 15. Flow Forgot Password

```text
User klik lupa password
↓
Input email
↓
Supabase kirim link reset password
↓
User klik link
↓
User memasukkan password baru
↓
Password berhasil diperbarui
```

---

# 16. Validasi Email Sebelum Reset

```javascript
IF email tidak ditemukan
{
   tampilkan:
   "Jika email terdaftar, link reset akan dikirim"
}
```

Tujuan:
- mencegah email enumeration
- meningkatkan keamanan sistem

---

# 17. Mengirim Link Reset Password

```javascript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://yourapp.com/reset-password'
});
```

---

# 18. Update Password Baru

```javascript
const { error } = await supabase.auth.updateUser({
  password: newPassword
});
```

---

# 19. Validasi Password

## Rekomendasi

Password minimal:

- 8 karakter
- kombinasi huruf dan angka

## Regex Password

```regex
^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$
```

---

# 20. Keamanan Sistem

## Yang Wajib Dilakukan

### Gunakan HTTPS

### Jangan Simpan Password Plaintext

Supabase otomatis melakukan hashing password.

### Gunakan Email Verification

Untuk mengurangi akun palsu.

### Gunakan Expired Token

Supabase otomatis mengatur token expiration.

---

# 21. Flow Lengkap Sistem

```text
Register
↓
Pending Approval
↓
Admin Approve
↓
Supabase Kirim Email Verifikasi
↓
User Verifikasi Email
↓
Akun Active
↓
Login

--------------------------------

Lupa Password
↓
Input Email
↓
Supabase Kirim Link Reset
↓
User Reset Password
↓
Login Kembali
```

---

# 22. Rekomendasi Tambahan

## Tambahkan:

- Rate Limiting
- Cooldown Email
- Audit Log
- Session Timeout
- Row Level Security (RLS)

---

# 23. Teknologi yang Digunakan

| Teknologi | Fungsi |
|---|---|
| Supabase Auth | Authentication |
| Supabase Database | Database |
| Email Verification | Validasi email |
| Reset Password | Pemulihan akun |
| RLS | Keamanan database |

---

# 24. Kesimpulan

Sistem ini memiliki beberapa lapisan keamanan:

- Approval admin
- Verifikasi email
- Secure forgot password
- Password hashing otomatis
- Validasi status akun

Sehingga cocok digunakan untuk:

- aplikasi mobile
- website modern
- MVP startup
- prototype
- production system
