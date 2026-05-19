const supabase = require('../config/supabase');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan. Silakan login terlebih dahulu.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Validasi token via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authData.user) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid atau sudah kadaluarsa.',
      });
    }

    // Query user profile dari database untuk mendapatkan role dan status
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('id, nama, email, role, status, email_verified, created_at')
      .eq('id', authData.user.id)
      .single();

    if (error || !userProfile) {
      return res.status(401).json({
        success: false,
        message: 'User tidak ditemukan di sistem.',
      });
    }

    if (userProfile.status !== 'approved') {
      const msg = userProfile.status === 'pending'
        ? 'Akun Anda sedang menunggu persetujuan admin.'
        : 'Akun Anda telah dinonaktifkan. Hubungi administrator.';
      return res.status(403).json({ success: false, message: msg });
    }

    req.user = userProfile;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};

module.exports = auth;
