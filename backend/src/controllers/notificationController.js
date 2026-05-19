const supabase = require('../config/supabase');

const subscribe = async (req, res) => {
  try {
    const subscription = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, message: 'Data subscription tidak valid.' });
    }

    const { endpoint, keys } = subscription;
    if (!keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ success: false, message: 'Keys subscription tidak lengkap.' });
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: req.user.id,
        endpoint: endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth
      },
      { onConflict: 'user_id, endpoint' }
    );

    if (error) {
      console.error('Error saving subscription:', error);
      return res.status(500).json({ success: false, message: 'Gagal menyimpan subscription.' });
    }

    return res.status(200).json({ success: true, message: 'Berhasil berlangganan notifikasi.' });
  } catch (error) {
    console.error('Subscribe error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server.' });
  }
};

const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ success: false, message: 'Endpoint tidak valid.' });
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', req.user.id)
      .eq('endpoint', endpoint);

    if (error) {
      return res.status(500).json({ success: false, message: 'Gagal menghapus subscription.' });
    }

    return res.status(200).json({ success: true, message: 'Berhasil berhenti berlangganan.' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server.' });
  }
};

module.exports = { subscribe, unsubscribe };
