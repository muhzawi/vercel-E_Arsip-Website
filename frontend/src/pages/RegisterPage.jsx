import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Archive, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ nama: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;
  if (success) {
    return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#297BBF]">
        <div className="w-full animate-scaleIn max-w-[420px]">
          <div className="bg-[#ffffff] shadow-xl text-center rounded-[8px] p-[40px]">
            <div className="inline-flex items-center justify-center rounded-full mx-auto mb-4 w-[56px] h-[56px] bg-[#DCFCE7]">
              <svg className="w-7 h-7 text-[#166534]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-[600] mb-3 text-[20px] text-[#1a1a1a]">Pendaftaran Berhasil!</h2>
            <p className="text-[13px] text-[#666666] leading-relaxed">
              Akun Anda telah berhasil didaftarkan. Silakan tunggu persetujuan dari <span className="font-[600] text-[#297BBF]">administrator</span>. Setelah disetujui, Anda akan menerima email verifikasi sebelum bisa login.
            </p>
            <Link to="/login" className="font-[500] text-[#297BBF] hover:text-[#1a6aad] hover:underline transition-colors duration-300">← Kembali ke halaman login</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', { nama: form.nama, email: form.email, password: form.password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Pendaftaran gagal. Coba lagi.');
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

          <h2 className="font-[600] mb-1 text-[17px] text-[#1a1a1a]">Daftar Akun</h2>
          <p className="mb-5 text-[12px] text-[#666666]">Isi form di bawah untuk mendaftar. Akun akan aktif setelah disetujui admin.</p>

          {error && (
            <div className="flex items-center gap-2 mb-4 animate-fadeIn bg-[#FEE2E2] border-l-[3px] border-[#ef4444] text-[#991b1b] px-[12px] py-[10px] rounded-[4px] text-[12px]">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-[500] mb-1 text-[12px] text-[#333333]">Nama Lengkap</label>
              <input id="register-nama" type="text" value={form.nama} onChange={(e) => setForm(f => ({ ...f, nama: e.target.value }))} required placeholder="Nama lengkap Anda"
                className="input-field" />
            </div>
            <div>
              <label className="block font-[500] mb-1 text-[12px] text-[#333333]">Email</label>
              <input id="register-email" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="nama@dinas.go.id"
                className="input-field" />
            </div>
            <div>
              <label className="block font-[500] mb-1 text-[12px] text-[#333333]">Password</label>
              <div className="relative">
                <input id="register-password" type={showPw ? 'text' : 'password'} value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} required placeholder="Minimal 6 karakter" minLength={6}
                  className="input-field pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#333333] transition-colors p-1">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block font-[500] mb-1 text-[12px] text-[#333333]">Konfirmasi Password</label>
              <input id="register-confirm-password" type="password" value={form.confirmPassword} onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))} required placeholder="Ulangi password"
                className="input-field" />
            </div>
            <button id="register-submit" type="submit" disabled={loading}
              className="w-full text-[#ffffff] font-[500] flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed bg-[#297BBF] hover:bg-[#1a6aad] p-[11px] rounded-[6px] text-[14px] shadow-sm"
            >
              {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col items-center gap-3">
            <p className="text-center text-[13px] text-[#666666]">
              Sudah punya akun?{' '}
              <Link to="/login" className="font-[500] text-[#297BBF] hover:text-[#1a6aad] hover:underline transition-colors duration-300">Masuk di sini</Link>
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
