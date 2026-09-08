const supabase = require('../config/supabase');

/**
 * Get dashboard stats
 * GET /api/stats
 */
const getDashboardStats = async (req, res) => {
  try {
    // Total folder
    const { count: totalFolders, error: errFolders } = await supabase
      .from('folders')
      .select('*', { count: 'exact', head: true });

    if (errFolders) throw errFolders;

    // Total file aktif
    const { count: totalFiles, error: errFiles } = await supabase
      .from('files')
      .select('*', { count: 'exact', head: true })
      .is('dihapus_pada', null);

    if (errFiles) throw errFiles;

    // File bulan ini
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: filesThisMonth, error: errMonth } = await supabase
      .from('files')
      .select('*', { count: 'exact', head: true })
      .is('dihapus_pada', null)
      .gte('diunggah_pada', startOfMonth.toISOString());

    if (errMonth) throw errMonth;

    // Ringkasan upload enam bulan terakhir untuk grafik dashboard.
    const chartStart = new Date(startOfMonth);
    chartStart.setMonth(chartStart.getMonth() - 5);
    const { data: recentFiles, error: errChart } = await supabase
      .from('files')
      .select('diunggah_pada')
      .is('dihapus_pada', null)
      .gte('diunggah_pada', chartStart.toISOString());

    if (errChart) throw errChart;

    const monthlyUploads = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(chartStart);
      date.setMonth(chartStart.getMonth() + index);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: date.toLocaleDateString('id-ID', { month: 'short' }),
        total: 0,
      };
    });

    const monthMap = new Map(monthlyUploads.map((month) => [month.key, month]));
    (recentFiles || []).forEach((file) => {
      const date = new Date(file.diunggah_pada);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const month = monthMap.get(key);
      if (month) month.total += 1;
    });

    return res.status(200).json({
      success: true,
      data: {
        totalFolders: totalFolders || 0,
        totalFiles: totalFiles || 0,
        filesThisMonth: filesThisMonth || 0,
        monthlyUploads,
      },
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil statistik dashboard.',
    });
  }
};

module.exports = { getDashboardStats };
