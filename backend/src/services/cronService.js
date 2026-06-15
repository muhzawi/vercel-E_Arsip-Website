const cron = require('node-cron');
const supabase = require('../config/supabase');

// Jadwal cron berjalan setiap hari pada jam 00:00 (tengah malam)
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('[Cron Job] Memulai penghapusan otomatis histori log aktivitas...');

    // Tentukan batasan waktu (hapus log yang lebih lama dari 24 jam)
    const batasWaktu = new Date();
    batasWaktu.setDate(batasWaktu.getDate() - 1); // 24 jam yang lalu

    const { error, count } = await supabase
      .from('activity_logs')
      .delete({ count: 'exact' })
      .lt('terjadi_pada', batasWaktu.toISOString());

    if (error) {
      console.error('[Cron Job] Gagal menghapus log aktivitas:', error.message);
      return;
    }

    console.log(`[Cron Job] Sukses: Menghapus log aktivitas yang lebih lama dari 24 jam. (${count || 0} baris dihapus)`);
  } catch (err) {
    console.error('[Cron Job] Terjadi kesalahan saat pembersihan log aktivitas:', err.message);
  }
});

console.log('Cron service initialized: Logs akan dibersihkan otomatis setiap 24 jam (pukul 00:00).');
