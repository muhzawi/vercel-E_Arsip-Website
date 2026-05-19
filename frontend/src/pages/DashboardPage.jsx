import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import FolderCard from '../components/FolderCard';
import Modal from '../components/Modal';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Folder, FileText, CalendarDays } from 'lucide-react';
import supabase from '../config/supabase';

export default function DashboardPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [renameData, setRenameData] = useState(null);
  const [newName, setNewName] = useState('');

  const { data: foldersData, isLoading: foldersLoading } = useQuery({
    queryKey: ['folders'],
    queryFn: () => api.get('/folders').then(r => r.data.data),
  });

  const { data: statsData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/stats').then(r => r.data.data),
  });

  useEffect(() => {
    if (user?.role !== 'admin') return;

    // Listen to new users registration for real-time notification
    const channel = supabase.channel('dashboard-admin-notifs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'users' },
        (payload) => {
          if (payload.new && payload.new.status === 'pending') {
            const userName = payload.new.nama || 'Seseorang';
            toast.success(`Pendaftar Baru: ${userName} menunggu persetujuan Anda!`, {
              duration: 5000,
              icon: '👤',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createMut = useMutation({
    mutationFn: (nama) => api.post('/folders', { nama }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setShowModal(false);
      setFolderName('');
      toast.success(res.data.message || 'Folder berhasil dibuat.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal membuat folder.'),
  });

  const deleteFolderMut = useMutation({
    mutationFn: (id) => api.delete(`/folders/${id}`),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success(res.data.message || 'Folder berhasil dihapus.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menghapus folder.'),
  });

  const renameMut = useMutation({
    mutationFn: ({ id, nama }) => api.put(`/folders/${id}/rename`, { nama }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      setRenameData(null);
      setNewName('');
      toast.success(res.data.message || 'Nama folder berhasil diubah.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal mengubah nama folder.'),
  });

  const handleCreate = (e) => { e.preventDefault(); if (folderName.trim()) createMut.mutate(folderName.trim()); };
  
  const handleDeleteClick = (folder) => {
    if (window.confirm(`Hapus folder "${folder.nama}"? Pastikan folder kosong sebelum dihapus.`)) {
      deleteFolderMut.mutate(folder.id);
    }
  };

  const handleRenameClick = (folder) => {
    setRenameData(folder);
    setNewName(folder.nama);
  };

  const submitRename = (e) => {
    e.preventDefault();
    if (newName.trim() && renameData) {
      renameMut.mutate({ id: renameData.id, nama: newName.trim() });
    }
  };

  const folders = foldersData || [];
  const rootFolders = folders.filter(f => !f.parent_id);

  return (
    <Layout>
      <div className="animate-fadeIn max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[18px] font-[600] text-[#1a1a1a]">Selamat datang, {user?.nama}!</h1>
          <p className="text-[12px] text-[#666666] mt-[2px]">Dinas Pendidikan — Sistem E-Arsip</p>
        </div>

        {/* 3 Kartu statistik */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

          {/* Kartu 1 — Total File */}
          <div className="bg-white border border-[#E0E0E0] rounded-lg p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="w-12 h-12 bg-[#EBF4FC] rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText size={20} style={{ color: '#297BBF' }} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-black leading-none">
                {statsData?.totalFiles ?? '—'}
              </div>
              <div className="text-xs uppercase tracking-widest text-[#666666] mt-1">
                Total File
              </div>
            </div>
          </div>

          {/* Kartu 2 — Total Folder */}
          <div className="bg-white border border-[#E0E0E0] rounded-lg p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="w-12 h-12 bg-[#EBF4FC] rounded-lg flex items-center justify-center flex-shrink-0">
              <Folder size={20} style={{ color: '#297BBF' }} />
            </div>
            <div>
              <div className="text-2xl font-semibold text-black leading-none">
                {statsData?.totalFolders ?? '—'}
              </div>
              <div className="text-xs uppercase tracking-widest text-[#666666] mt-1">
                Total Folder
              </div>
            </div>
          </div>

          {/* Kartu 3 — File Bulan Ini (Yellow Accent) */}
          <div className="bg-[#FBD206] rounded-lg p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,0,0,0.08)' }}>
              <CalendarDays size={20} color="#000000" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-black leading-none">
                {statsData?.filesThisMonth ?? '—'}
              </div>
              <div className="text-xs uppercase tracking-widest text-black/60 mt-1">
                File Bulan Ini
              </div>
            </div>
          </div>

        </div>

        {/* Section folder */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-[600] text-[#1a1a1a]">Folder Arsip</h2>
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5 text-[13px]">
              <Plus size={15} />
              Buat Folder
            </button>
          </div>

          {foldersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white border-[0.5px] border-[#E0E0E0] rounded-[8px] p-[14px] h-[100px] skeleton" />
              ))}
            </div>
          ) : rootFolders.length === 0 ? (
            <div className="bg-[#ffffff] text-center border-[0.5px] border-[#E0E0E0] rounded-[8px] py-[48px] px-[24px]">
              <div className="flex items-center justify-center mx-auto mb-3 w-[48px] h-[48px] bg-[#F4F4F5] rounded-[8px]">
                <Folder size={24} color="#E0E0E0" />
              </div>
              <h3 className="font-[500] text-[14px] text-[#1a1a1a]">Belum ada folder</h3>
              <p className="text-[12px] text-[#666666] mt-1">Buat folder pertama untuk mulai mengarsipkan dokumen.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {rootFolders.map((f, index) => (
                <FolderCard 
                  key={f.id} 
                  folder={f} 
                  index={index} 
                  currentUser={user}
                  onRename={handleRenameClick}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modal Buat Folder */}
        <Modal isOpen={showModal} onClose={() => { setShowModal(false); setFolderName(''); }} title="Buat Folder Baru">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block font-[500] text-[12px] text-[#333333] mb-1">Nama Folder</label>
              <input
                id="folder-name-input"
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="input-field"
                placeholder="Contoh: Surat Masuk 2026"
                autoFocus
                required
              />
            </div>
            {createMut.isError && <p className="text-sm text-red-500">{createMut.error?.response?.data?.message || 'Gagal membuat folder.'}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setShowModal(false); setFolderName(''); }} className="btn-secondary">Batal</button>
              <button type="submit" disabled={createMut.isPending} className="btn-primary flex items-center gap-2">
                {createMut.isPending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Buat Folder
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal Ubah Nama Folder */}
        <Modal isOpen={!!renameData} onClose={() => setRenameData(null)} title="Ubah Nama Folder">
          <form onSubmit={submitRename} className="space-y-4">
            <div>
              <label className="block font-[500] text-[12px] text-[#333333] mb-1">Nama Folder Baru</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="input-field"
                placeholder="Masukkan nama baru"
                autoFocus
                required
              />
            </div>
            {renameMut.isError && <p className="text-sm text-red-500">{renameMut.error?.response?.data?.message || 'Gagal mengubah nama folder.'}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setRenameData(null)} className="btn-secondary">Batal</button>
              <button type="submit" disabled={renameMut.isPending} className="btn-primary flex items-center gap-2">
                {renameMut.isPending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Simpan Perubahan
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
