import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Archive, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login gagal. Periksa email dan password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#297BBF]">
      <div className="w-full animate-scaleIn max-w-[420px]">
        {/* Card */}
        <div className="bg-[#ffffff] shadow-xl rounded-[8px] p-[40px]">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mx-auto mb-3">
              <img 
                src="/logo-medan.png" 
                alt="Logo Medan" 
                className="w-[64px] h-auto" 
              />
            </div>
            <h1 className="font-[600] text-[22px] text-[#1a1a1a]">E-Arsip</h1>
            <p className="text-[13px] text-[#666666] mt-[2px]">Dinas Pendidikan</p>
            <p className="text-[11px] text-[#999999] mt-[4px]">Sistem Pengarsipan Dokumen Digital</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 mb-4 animate-fadeIn bg-[#FEE2E2] border-l-[3px] border-[#ef4444] text-[#991b1b] px-[12px] py-[10px] rounded-[4px] text-[12px]">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-[500] mb-1 text-[12px] text-[#333333]">Email</label>
              <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="contoh@email.com"
                className="input-field" />
            </div>
            <div>
              <label className="block font-[500] mb-1 text-[12px] text-[#333333]">Password</label>
              <div className="relative">
                <input id="login-password" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"
                  className="input-field pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#333333] transition-colors p-1">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button id="login-submit" type="submit" disabled={loading}
              className="w-full text-[#ffffff] font-[500] flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed bg-[#297BBF] hover:bg-[#1a6aad] p-[11px] rounded-[6px] text-[14px] shadow-sm"
            >
              {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col items-center gap-3">
            <Link to="/forgot-password" className="text-[12px] text-[#297BBF] hover:underline">Lupa Password?</Link>
            <p className="text-center text-[13px] text-[#666666]">
              Belum punya akun?{' '}
              <Link to="/register" className="font-[500] text-[#297BBF] hover:text-[#1a6aad] hover:underline transition-colors duration-300">Daftar di sini</Link>
            </p>
            <p className="text-[10px] text-[#999999] uppercase tracking-wider font-medium">
              © 2026 Dinas Pendidikan Kota Medan
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
