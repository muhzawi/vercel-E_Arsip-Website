const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

router.get('/clear-logs', async (req, res) => {
  // Verifikasi Vercel Cron Secret untuk memastikan hanya Vercel yang bisa menjalankan ini
  const authHeader = req.headers.authorization;
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('Unauthorized cron invocation attempted');
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    // Tentukan batasan waktu (hapus log yang lebih lama dari 24 jam)
    // Jika Anda ingin menghapus SEMUA log (tanpa sisa), Anda bisa mengganti query di bawah
    const batasWaktu = new Date();
    batasWaktu.setDate(batasWaktu.getDate() - 1); // 24 jam yang lalu

    const { error, count } = await supabase
      .from('activity_logs')
      .delete({ count: 'exact' })
      .lt('terjadi_pada', batasWaktu.toISOString());

    if (error) {
      console.error('Gagal menghapus log aktivitas:', error);
      return res.status(500).json({ success: false, message: 'Gagal menghapus log aktivitas', error: error.message });
    }

    console.log(`Cron Job Sukses: Menghapus log aktivitas yang lebih lama dari 24 jam. (${count || 0} baris dihapus)`);
    return res.status(200).json({ success: true, message: 'Pembersihan log aktivitas berhasil', deletedCount: count || 0 });
  } catch (err) {
    console.error('Terjadi kesalahan saat pembersihan log aktivitas:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
  }
});

module.exports = router;
