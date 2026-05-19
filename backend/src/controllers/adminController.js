const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

/**
 * GET /api/admin/users
 * Ambil semua user yang sudah approved atau inactive (bukan pending)
 */
const getAllUsers = async (req, res) => {
  try {
    // TEXT schema: 'approved', 'inactive', 'pending'
    const { data, error } = await supabase
      .from('users')
      .select('id, nama, email, role, status, email_verified, created_at, updated_at')
      .neq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ success: false, message: 'Gagal mengambil data user.' });

    return res.status(200).json({ success: true, data: data || [] });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * GET /api/admin/users/pending
 * Ambil semua user yang menunggu persetujuan
 */
const getPendingUsers = async (req, res) => {
  try {
    // TEXT schema
    const { data, error } = await supabase
      .from('users')
      .select('id, nama, email, role, status, email_verified, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ success: false, message: 'Gagal mengambil data pending user.' });

    return res.status(200).json({ success: true, data: data || [] });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * PATCH /api/admin/users/:id/approve
 * Setujui user pending → ubah status menjadi 'approved'
 */
const approveUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error: findErr } = await supabase
      .from('users')
      .select('id, nama, email, status')
      .eq('id', id)
      .single();

    if (findErr || !user) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    // TEXT schema
    if (user.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'User ini bukan dalam status pending.' });
    }

    const { error: updateErr } = await supabase
      .from('users')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', id);

    // Kirim email verifikasi via Supabase Auth
    const redirectUrl = process.env.FRONTEND_URL 
      ? `${process.env.FRONTEND_URL}/verify`
      : 'http://localhost:5173/verify';

    await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: { emailRedirectTo: redirectUrl }
    });

    if (updateErr) return res.status(500).json({ success: false, message: 'Gagal menyetujui user.' });

    await supabase.from('activity_logs').insert({
      user_id: req.user.id,
      aksi: 'tambah_pegawai',
      keterangan: `Menyetujui pendaftaran pegawai ${user.nama} (${user.email})`,
      ip_address: req.ip,
    });

    return res.status(200).json({ success: true, message: `Akun ${user.nama} berhasil disetujui.` });
  } catch (e) {
    console.error('approveUser error:', e);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * POST /api/admin/users
 * Buat user baru langsung (oleh admin), langsung approved
 */
const createUser = async (req, res) => {
  try {
    const { nama, email, password, role } = req.body;
    if (!nama || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi.' });
    }

    const { data: existing } = await supabase.from('users').select('id').eq('email', email.toLowerCase().trim()).single();
    if (existing) return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });

    // Untuk createUser oleh admin, kita gunakan Supabase Auth juga
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: { data: { full_name: nama.trim() } }
    });

    if (authError) return res.status(400).json({ success: false, message: authError.message });

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ 
        id: authData.user.id,
        nama: nama.trim(), 
        email: email.toLowerCase().trim(), 
        role: role || 'pegawai', 
        status: 'approved',
        email_verified: false
      })
      .select('id, nama, email, role, status, created_at')
      .single();

    if (error) return res.status(500).json({ success: false, message: 'Gagal membuat user.' });

    await supabase.from('activity_logs').insert({
      user_id: req.user.id,
      aksi: 'tambah_pegawai',
      keterangan: `Menambahkan pegawai ${nama.trim()} (${email})`,
      ip_address: req.ip,
    });

    return res.status(201).json({ success: true, data: newUser, message: 'Pegawai berhasil ditambahkan. Email verifikasi telah dikirim.' });
  } catch (e) {
    console.error('createUser error:', e);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * PATCH /api/admin/users/:id/status
 * Toggle status approved ↔ inactive
 */
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Anda tidak dapat mengubah status akun sendiri.' });
    }

    const { data: user, error } = await supabase.from('users').select('id, nama, status').eq('id', id).single();
    if (error || !user) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    // TEXT schema: toggle 'approved' ↔ 'inactive'
    const newStatusStr = user.status === 'approved' ? 'inactive' : 'approved';

    const { error: ue } = await supabase
      .from('users')
      .update({ status: newStatusStr, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (ue) return res.status(500).json({ success: false, message: 'Gagal mengubah status.' });

    await supabase.from('activity_logs').insert({
      user_id: req.user.id,
      aksi: 'nonaktifkan_pegawai',
      keterangan: `${newStatusBool ? 'Mengaktifkan' : 'Menonaktifkan'} akun ${user.nama}`,
      ip_address: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `Akun ${user.nama} berhasil diubah menjadi ${newStatusStr}.`,
      data: { id, status: newStatusStr },
    });
  } catch (e) {
    console.error('toggleUserStatus error:', e);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * GET /api/admin/logs
 */
const getActivityLogs = async (req, res) => {
  try {
    const { user_id, aksi, dari, sampai, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('activity_logs')
      .select('*, user:users!user_id(id,nama,email), file:files!file_id(id,nama_asli)', { count: 'exact' });

    if (user_id) query = query.eq('user_id', user_id);
    if (aksi) query = query.eq('aksi', aksi);
    if (dari) query = query.gte('terjadi_pada', dari);
    if (sampai) query = query.lte('terjadi_pada', sampai);

    query = query.order('terjadi_pada', { ascending: false }).range(offset, offset + limitNum - 1);

    const { data: logs, error, count } = await query;
    if (error) return res.status(500).json({ success: false, message: 'Gagal mengambil log aktivitas.' });

    const total = count || 0;
    return res.status(200).json({
      success: true,
      data: { logs, total, page: pageNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (e) {
    console.error('getActivityLogs error:', e);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * PUT /api/admin/users/:id
 * Edit data user (nama, email, role, password opsional)
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, email, password, role } = req.body;

    if (id === req.user.id && role && role !== req.user.role) {
      return res.status(400).json({ success: false, message: 'Anda tidak dapat mengubah role akun sendiri.' });
    }

    const { data: user, error: findErr } = await supabase.from('users').select('id, nama, email, role').eq('id', id).single();
    if (findErr || !user) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    // Cek duplikat email jika email diubah
    if (email && email.toLowerCase().trim() !== user.email) {
      const { data: existing } = await supabase.from('users').select('id').eq('email', email.toLowerCase().trim()).single();
      if (existing) return res.status(409).json({ success: false, message: 'Email sudah digunakan oleh user lain.' });
    }

    const updates = { updated_at: new Date().toISOString() };
    if (nama) updates.nama = nama.trim();
    if (email) updates.email = email.toLowerCase().trim();
    if (role) updates.role = role;
    // Update password via admin auth api
    if (password) {
      if (password.length < 6) return res.status(400).json({ success: false, message: 'Password minimal 6 karakter.' });
      
      const { error: authUpdateErr } = await supabase.auth.admin.updateUserById(id, { password });
      if (authUpdateErr) return res.status(500).json({ success: false, message: 'Gagal mengupdate password.' });
    }

    const { data: updated, error: updateErr } = await supabase.from('users').update(updates).eq('id', id).select('id, nama, email, role, status, created_at').single();
    if (updateErr) return res.status(500).json({ success: false, message: 'Gagal mengupdate data user.' });

    await supabase.from('activity_logs').insert({
      user_id: req.user.id,
      aksi: 'edit_profil',
      keterangan: `Mengedit data pegawai ${user.nama}`,
      ip_address: req.ip,
    });

    return res.status(200).json({ success: true, data: updated, message: `Data ${updated.nama} berhasil diperbarui.` });
  } catch (e) {
    console.error('updateUser error:', e);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Hapus user permanen (tidak bisa hapus diri sendiri atau user yang punya file/folder)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Anda tidak dapat menghapus akun sendiri.' });
    }

    const { data: user, error: findErr } = await supabase.from('users').select('id, nama, email, role').eq('id', id).single();
    if (findErr || !user) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    // Cek apakah user punya file yang masih aktif
    const { count: fileCount } = await supabase.from('files').select('id', { count: 'exact', head: true }).eq('diunggah_oleh', id).is('dihapus_pada', null);
    if (fileCount > 0) {
      return res.status(400).json({ success: false, message: `Tidak bisa menghapus ${user.nama} karena masih memiliki ${fileCount} file aktif.` });
    }

    // Hapus activity logs dulu (foreign key constraint)
    await supabase.from('activity_logs').delete().eq('user_id', id);

    // Hapus dari public.users (Jika ada trigger akan dihapus dari auth.users, tapi untuk amannya hapus auth.users)
    const { error: deleteAuthErr } = await supabase.auth.admin.deleteUser(id);
    if (deleteAuthErr) {
       console.error('deleteAuthErr', deleteAuthErr);
       // continue to try deleting public profile if auth user deletion fails (it cascades usually)
    }

    const { error: deleteErr } = await supabase.from('users').delete().eq('id', id);
    if (deleteErr) return res.status(500).json({ success: false, message: 'Gagal menghapus user.' });

    await supabase.from('activity_logs').insert({
      user_id: req.user.id,
      aksi: 'nonaktifkan_pegawai',
      keterangan: `Menghapus akun pegawai ${user.nama} (${user.email})`,
      ip_address: req.ip,
    });

    return res.status(200).json({ success: true, message: `Akun ${user.nama} berhasil dihapus.` });
  } catch (e) {
    console.error('deleteUser error:', e);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

module.exports = { getAllUsers, getPendingUsers, approveUser, createUser, updateUser, deleteUser, toggleUserStatus, getActivityLogs };
