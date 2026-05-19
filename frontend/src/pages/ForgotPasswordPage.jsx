import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim instruksi reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#297BBF]">
      <div className="w-full animate-scaleIn max-w-[420px]">
        <div className="bg-[#ffffff] shadow-xl rounded-[8px] p-[40px]">
          <div className="text-center mb-6">
            <h1 className="font-[600] text-[22px] text-[#1a1a1a]">Lupa Password</h1>
            <p className="text-[13px] text-[#666666] mt-[4px]">Masukkan email Anda untuk menerima instruksi reset password</p>
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
              <label className="block font-[500] mb-1 text-[12px] text-[#333333]">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="nama@dinas.go.id" className="input-field" />
            </div>
            
            <button type="submit" disabled={loading}
              className="w-full text-[#ffffff] font-[500] flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed bg-[#297BBF] hover:bg-[#1a6aad] p-[11px] rounded-[6px] text-[14px] shadow-sm"
            >
              {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Memproses...' : 'Kirim Instruksi Reset'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <Link to="/login" className="text-[13px] font-[500] text-[#297BBF] hover:text-[#1a6aad] hover:underline transition-colors duration-300">
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
