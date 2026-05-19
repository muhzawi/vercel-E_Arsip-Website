import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    // Parse access_token dari fragment URL (karena Supabase GoTrue mengirimkannya di hash)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    
    if (accessToken) {
      setToken(accessToken);
    } else {
      setError('Token reset password tidak ditemukan di URL. Silakan minta tautan reset yang baru dari halaman Lupa Password.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Token tidak tersedia. Silakan gunakan link terbaru dari email Anda.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', 
        { new_password: password }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message + ' Mengalihkan ke halaman login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengubah password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#297BBF]">
      <div className="w-full animate-scaleIn max-w-[420px]">
        <div className="bg-[#ffffff] shadow-xl rounded-[8px] p-[40px]">
          <div className="text-center mb-6">
            <h1 className="font-[600] text-[22px] text-[#1a1a1a]">Buat Password Baru</h1>
            <p className="text-[13px] text-[#666666] mt-[4px]">Masukkan password baru untuk akun Anda</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 mb-4 animate-fadeIn bg-[#FEE2E2] border-l-[3px] border-[#ef4444] text-[#991b1b] px-[12px] py-[10px] rounded-[4px] text-[12px]">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {message && (
            <div className="flex items-center gap-2 mb-4 animate-fadeIn bg-[#ecfdf5] border-l-[3px] border-[#10b981] text-[#065f46] px-[12px] py-[10px] rounded-[4px] text-[12px]">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-[500] mb-1 text-[12px] text-[#333333]">Password Baru</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" className="input-field pr-10" disabled={!token} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#333333] transition-colors p-1" disabled={!token}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-[11px] text-[#999999] mt-1">Minimal 6 karakter.</p>
            </div>
            
            <button type="submit" disabled={loading || !token}
              className="w-full text-[#ffffff] font-[500] flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed bg-[#297BBF] hover:bg-[#1a6aad] p-[11px] rounded-[6px] text-[14px] shadow-sm"
            >
              {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Memproses...' : 'Simpan Password Baru'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <Link to="/login" className="text-[13px] font-[500] text-[#297BBF] hover:text-[#1a6aad] hover:underline transition-colors duration-300">
              Batal dan Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
