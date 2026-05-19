const supabase = require('../config/supabase');

/**
 * Register user baru (status = 'pending', menunggu persetujuan admin)
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { nama, email, password } = req.body;

    if (!nama || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter.' });
    }

    // Register via Supabase Auth
    // Untuk pendaftaran baru, kita gunakan Admin API agar Supabase tidak otomatis mengirim email verifikasi
    // Email verifikasi HANYA akan dikirim setelah Admin menyetujui akun ini.
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: false, // Jangan kirim email / langsung konfirmasi
      user_metadata: { full_name: nama.trim() }
    });

    if (authError) {
      console.error('Supabase Auth error:', authError);
      return res.status(400).json({ success: false, message: authError.message });
    }

    // Coba insert ke public.users (Profile)
    if (authData.user) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          nama: nama.trim(),
          email: email.toLowerCase().trim(),
          role: 'pegawai',
          status: 'pending',
          email_verified: false
        });

      if (insertError) {
        console.error('Insert public.users error:', insertError);
        // Abaikan jika misal sudah ada trigger DB yang meng-handle
      }

      // KIRM WEB PUSH NOTIFICATION KE ADMIN
      try {
        const webpush = require('web-push');
        webpush.setVapidDetails(
          process.env.VAPID_SUBJECT || 'mailto:admin@dinas.go.id',
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY
        );

        // Ambil semua subscription dari database (biasanya milik admin)
        const { data: subs, error: subsError } = await supabase.from('push_subscriptions').select('*');
        
        if (!subsError && subs && subs.length > 0) {
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
          const payload = JSON.stringify({
            title: 'Pendaftaran Pegawai Baru',
            body: `${nama.trim()} telah mendaftar dan menunggu persetujuan Anda.`,
            url: `${frontendUrl}/dashboard`
          });

          const sendPromises = subs.map(async (sub) => {
            try {
              const pushSubscription = {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth }
              };
              await webpush.sendNotification(pushSubscription, payload);
            } catch (err) {
              if (err.statusCode === 404 || err.statusCode === 410) {
                // Subscription is no longer valid, delete it
                await supabase.from('push_subscriptions').delete().eq('id', sub.id);
              } else {
                console.error('Error sending push notification:', err);
              }
            }
          });
          
          await Promise.all(sendPromises);
        }
      } catch (pushErr) {
        console.error('Failed to process push notifications:', pushErr);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Pendaftaran berhasil. Akun Anda sedang menunggu persetujuan dari admin.',
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
    }

    // 1. Cek status di tabel users public
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, nama, email, role, status, email_verified')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (profileError || !userProfile) {
      console.log('Login failed: Profile not found or error', profileError);
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }

    if (userProfile.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda sedang menunggu persetujuan admin. Silakan hubungi administrator.',
        code: 'PENDING',
      });
    }

    if (userProfile.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda telah dinonaktifkan. Hubungi administrator.',
        code: 'INACTIVE',
      });
    }

    // 2. Verifikasi password menggunakan instance Supabase terisolasi 
    // Mencegah "state pollution" pada Node.js singleton jika ada multiple request
    const { createClient } = require('@supabase/supabase-js');
    const authClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (authError || !authData.session) {
      console.log('Login failed: Supabase Auth error', authError);
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }

    // email_verified tidak lagi digunakan sebagai syarat login — persetujuan admin sudah cukup

    // Catat activity log
    await supabase.from('activity_logs').insert({
      user_id: userProfile.id,
      aksi: 'login',
      keterangan: `${userProfile.nama} berhasil login`,
      ip_address: req.ip,
    });

    return res.status(200).json({
      success: true,
      data: {
        token: authData.session.access_token,
        session: authData.session,
        user: { 
          id: userProfile.id, 
          nama: userProfile.nama, 
          email: userProfile.email, 
          role: userProfile.role 
        },
      },
      message: 'Login berhasil.',
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * Get current user info
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    return res.status(200).json({ success: true, data: req.user });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    await supabase.from('activity_logs').insert({
      user_id: req.user.id,
      aksi: 'logout',
      keterangan: `${req.user.nama} logout`,
      ip_address: req.ip,
    });
    
    // Kita juga bisa pass access token dan memanggil auth.signOut() 
    // jika kita menyimpan instance supabase untuk masing-masing request
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await supabase.auth.admin?.signOut(token).catch(() => {});
    }

    return res.status(200).json({ success: true, message: 'Logout berhasil.' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * Forgot Password
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email wajib diisi.' });

    const redirectUrl = process.env.FRONTEND_URL 
      ? `${process.env.FRONTEND_URL}/reset-password`
      : 'http://localhost:5173/reset-password';

    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('Forgot password error:', error);
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(200).json({ success: true, message: 'Jika email terdaftar, instruksi reset akan dikirim.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * Reset Password
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { new_password } = req.body;
    
    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter.' });
    }

    // Catatan: frontend harus mengirim access token dari hash URL
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Token reset tidak ditemukan atau kadaluarsa.' });

    // Set session di supabase client secara temporary
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
       return res.status(401).json({ success: false, message: 'Sesi reset password tidak valid.' });
    }

    // Menggunakan API admin untuk update password (butuh service role)
    // Jika auth anon key, update password harus di frontend: await supabase.auth.updateUser({ password })
    // Kita akan kembalikan error dan meminta frontend melakukannya, atau kita asumsikan backend ini dipanggil
    // menggunakan token user, tapi supabase-js di backend bersifat global singleton. 
    // Jadi lebih aman ini di-handle 100% oleh frontend. Kita simpan endpoint ini sebagai API passthrough.
    return res.status(400).json({ 
      success: false, 
      message: 'Untuk keamanan, reset password harus dilakukan langsung melalui client-side Supabase Auth.' 
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

module.exports = { register, login, getMe, logout, forgotPassword, resetPassword };
