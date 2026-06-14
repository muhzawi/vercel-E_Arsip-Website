const { v4: uuidv4 } = require('uuid');
const path = require('path');
const supabase = require('../config/supabase');

// Step 1: Generate a signed URL for frontend to upload directly to Supabase
const getSignedUploadUrl = async (req, res) => {
  try {
    const { folder_id, nama_asli, tipe_mime, ukuran_bytes } = req.body;
    if (!folder_id || !nama_asli || !ukuran_bytes) {
      return res.status(400).json({ success: false, message: 'Data file tidak lengkap.' });
    }
    if (tipe_mime !== 'application/pdf') {
      return res.status(400).json({ success: false, message: 'Hanya file PDF yang diizinkan.' });
    }
    if (Number(ukuran_bytes) > 10 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'Ukuran file maksimal 10 MB.' });
    }

    const { data: folder, error: fe } = await supabase.from('folders').select('id, nama').eq('id', folder_id).single();
    if (fe || !folder) return res.status(404).json({ success: false, message: 'Folder tidak ditemukan.' });

    const ext = path.extname(nama_asli) || '.pdf';
    const uid = uuidv4();
    const storagePath = `${folder_id}/${uid}${ext}`;

    const { data: signedData, error: se } = await supabase.storage
      .from('arsip-dokumen')
      .createSignedUploadUrl(storagePath);

    if (se) return res.status(500).json({ success: false, message: 'Gagal membuat URL upload.' });

    return res.status(200).json({
      success: true,
      data: {
        signedUrl: signedData.signedUrl,
        token: signedData.token,
        path: storagePath,
        nama_file: `${uid}${ext}`,
      }
    });
  } catch (error) {
    console.error('getSignedUploadUrl error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

const saveFileMetadata = async (req, res) => {
  try {
    const { folder_id, path_penyimpanan, nama_file, nama_asli, tipe_mime, ukuran_bytes } = req.body;
    if (!folder_id || !path_penyimpanan || !nama_file || !nama_asli || !ukuran_bytes) {
      return res.status(400).json({ success: false, message: 'Metadata file tidak lengkap.' });
    }

    const { data: folder, error: fe } = await supabase.from('folders').select('id, nama').eq('id', folder_id).single();
    if (fe || !folder) return res.status(404).json({ success: false, message: 'Folder tidak ditemukan.' });

    const { data: newFile, error: de } = await supabase.from('files').insert({
      nama_file, nama_asli, tipe_mime, ukuran_bytes, path_penyimpanan, folder_id, diunggah_oleh: req.user.id,
    }).select('*, pengunggah:users!diunggah_oleh(id,nama,email)').single();
    
    if (de) return res.status(500).json({ success: false, message: 'Gagal menyimpan metadata.' });

    await supabase.from('activity_logs').insert({ user_id: req.user.id, aksi: 'upload_file', file_id: newFile.id, keterangan: `Upload file ${nama_asli} ke folder ${folder.nama}`, ip_address: req.ip });
    
    return res.status(201).json({ success: true, data: newFile, message: 'File berhasil diunggah.' });
  } catch (error) { 
    console.error('saveFileMetadata error:', error); 
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' }); 
  }
};

const downloadFile = async (req, res) => {
  try {
    const { data: file, error } = await supabase.from('files').select('*').eq('id', req.params.id).single();
    if (error || !file) return res.status(404).json({ success: false, message: 'File tidak ditemukan.' });
    if (file.dihapus_pada) return res.status(410).json({ success: false, message: 'File sudah dihapus.' });

    const { data: sd, error: se } = await supabase.storage.from('arsip-dokumen').createSignedUrl(file.path_penyimpanan, 60);
    if (se) return res.status(500).json({ success: false, message: 'Gagal membuat URL download.' });

    await supabase.from('activity_logs').insert({ user_id: req.user.id, aksi: 'download_file', file_id: file.id, keterangan: `Download file ${file.nama_asli}`, ip_address: req.ip });
    return res.status(200).json({ success: true, data: { url: sd.signedUrl, nama_asli: file.nama_asli, tipe_mime: file.tipe_mime } });
  } catch (error) { console.error('downloadFile error:', error); return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' }); }
};

const deleteFile = async (req, res) => {
  try {
    const { data: file, error } = await supabase.from('files').select('*').eq('id', req.params.id).single();
    if (error || !file) return res.status(404).json({ success: false, message: 'File tidak ditemukan.' });
    if (file.dihapus_pada) return res.status(410).json({ success: false, message: 'File sudah dihapus.' });
    if (req.user.role !== 'admin' && file.diunggah_oleh !== req.user.id) return res.status(403).json({ success: false, message: 'Tidak memiliki izin.' });

    const { error: ue } = await supabase.from('files').update({ dihapus_pada: new Date().toISOString() }).eq('id', req.params.id);
    if (ue) return res.status(500).json({ success: false, message: 'Gagal menghapus file.' });

    await supabase.from('activity_logs').insert({ user_id: req.user.id, aksi: 'hapus_file', file_id: file.id, keterangan: `Menghapus file ${file.nama_asli}`, ip_address: req.ip });
    return res.status(200).json({ success: true, message: 'File berhasil dihapus.' });
  } catch (error) { console.error('deleteFile error:', error); return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' }); }
};

const searchFiles = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) return res.status(200).json({ success: true, data: [] });

    const { data: files, error } = await supabase.from('files')
      .select('*, pengunggah:users!diunggah_oleh(id,nama,email), folder:folders!folder_id(id,nama)')
      .is('dihapus_pada', null).ilike('nama_asli', `%${q.trim()}%`).order('diunggah_pada', { ascending: false });
    if (error) return res.status(500).json({ success: false, message: 'Gagal mencari file.' });

    await supabase.from('activity_logs').insert({ user_id: req.user.id, aksi: 'cari_file', keterangan: `Mencari: ${q.trim()}`, ip_address: req.ip });
    return res.status(200).json({ success: true, data: files });
  } catch (error) { console.error('searchFiles error:', error); return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' }); }
};

module.exports = { getSignedUploadUrl, saveFileMetadata, downloadFile, deleteFile, searchFiles };
