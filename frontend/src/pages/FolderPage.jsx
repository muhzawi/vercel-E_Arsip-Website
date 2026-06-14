import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import FolderCard from '../components/FolderCard';
import FileCard from '../components/FileCard';
import Modal from '../components/Modal';
import api from '../api/axios';
import toast from 'react-hot-toast';
import supabase from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { FolderOpen, ChevronRight, Plus, Upload, File, Edit, Trash2 } from 'lucide-react';

export default function FolderPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const qc = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [showSubfolder, setShowSubfolder] = useState(false);
  const [subName, setSubName] = useState('');
  const [file, setFile] = useState(null);
  const [renameData, setRenameData] = useState(null);
  const [newName, setNewName] = useState('');

  const { data, isLoading, error: fetchError } = useQuery({
    queryKey: ['folder', id],
    queryFn: () => api.get(`/folders/${id}`).then(r => r.data.data),
  });

  const uploadMut = useMutation({
    mutationFn: async (fileToUpload) => {
      // 1. Get signed upload URL from backend
      const urlRes = await api.post('/files/upload-url', {
        folder_id: id,
        nama_asli: fileToUpload.name,
        tipe_mime: fileToUpload.type,
        ukuran_bytes: fileToUpload.size
      });

      const { signedUrl, token, path, nama_file } = urlRes.data.data;

      // 2. Upload to Supabase Storage directly using the signed URL token
      const { error: uploadError } = await supabase.storage
        .from('arsip-dokumen')
        .uploadToSignedUrl(path, token, fileToUpload, {
          upsert: false
        });

      if (uploadError) {
        throw new Error(uploadError.message || 'Gagal mengunggah file ke storage.');
      }

      // 3. Send metadata to backend to save to database
      const metadata = {
        folder_id: id,
        path_penyimpanan: path,
        nama_file: nama_file,
        nama_asli: fileToUpload.name,
        tipe_mime: fileToUpload.type,
        ukuran_bytes: fileToUpload.size
      };

      const res = await api.post('/files/upload', metadata);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folder', id] });
      setShowUpload(false);
      setFile(null);
      toast.success('File berhasil diunggah.');
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Gagal mengunggah file.'),
  });

  const subfolderMut = useMutation({
    mutationFn: (nama) => api.post('/folders', { nama, parent_id: id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folder', id] });
      setShowSubfolder(false);
      setSubName('');
      toast.success('Subfolder berhasil dibuat.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal membuat subfolder.'),
  });

  const deleteMut = useMutation({
    mutationFn: (fileId) => api.delete(`/files/${fileId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folder', id] });
      toast.success('File berhasil dihapus.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menghapus file.'),
  });

  const deleteFolderMut = useMutation({
    mutationFn: (folderId) => api.delete(`/folders/${folderId}`),
    onSuccess: (res, variables) => {
      qc.invalidateQueries({ queryKey: ['folder', id] });
      toast.success(res.data.message || 'Folder berhasil dihapus.');
      if (variables === id) {
        window.location.href = '/dashboard';
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menghapus folder.'),
  });

  const renameMut = useMutation({
    mutationFn: ({ folderId, nama }) => api.put(`/folders/${folderId}/rename`, { nama }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['folder', id] });
      setRenameData(null);
      setNewName('');
      toast.success(res.data.message || 'Nama folder berhasil diubah.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal mengubah nama folder.'),
  });

  const handleUpload = (e) => {
    e.preventDefault();
    if (!file) return;
    uploadMut.mutate(file);
  };

  const handleDeleteFile = (f) => {
    if (window.confirm(`Hapus file "${f.nama_asli}"?`)) deleteMut.mutate(f.id);
  };

  const handleDeleteFolderClick = (f) => {
    if (window.confirm(`Hapus folder "${f.nama}"? Pastikan folder kosong sebelum dihapus.`)) {
      deleteFolderMut.mutate(f.id);
    }
  };

  const handleRenameFolderClick = (f) => {
    setRenameData(f);
    setNewName(f.nama);
  };

  const submitRename = (e) => {
    e.preventDefault();
    if (newName.trim() && renameData) {
      renameMut.mutate({ folderId: renameData.id, nama: newName.trim() });
    }
  };

  if (isLoading) return (
    <Layout>
      <div className="animate-pulse-soft space-y-4">
        <div className="h-5 bg-[#F4F4F5] rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="bg-[#ffffff] border-[0.5px] border-[#E0E0E0] rounded-[8px] p-[14px] h-[80px]" />)}
        </div>
      </div>
    </Layout>
  );

  if (fetchError) return (
    <Layout>
      <div className="bg-[#ffffff] text-center border-[0.5px] border-[#E0E0E0] rounded-[8px] py-[48px] px-[24px]">
        <p className="font-[500] text-[#ef4444]">Folder tidak ditemukan.</p>
        <Link to="/dashboard" className="text-[13px] mt-2 inline-block text-[#297BBF] hover:underline">← Kembali ke Dashboard</Link>
      </div>
    </Layout>
  );

  const isCurrentFolderAuthorized = data && (user?.role === 'admin' || user?.id === data.dibuat_oleh);

  return (
    <Layout>
      <div className="animate-fadeIn">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 mb-5 text-[13px] text-[#666666]">
          <Link to="/dashboard" className="text-[#297BBF] hover:underline">Dashboard</Link>
          <ChevronRight size={14} color="#E0E0E0" />
          <span className="font-[500] text-[#1a1a1a]">{data.nama}</span>
        </nav>

        {/* Folder Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center flex-shrink-0 w-[40px] h-[40px] bg-[#EBF4FC] rounded-[8px]">
              <FolderOpen size={22} color="#297BBF" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-[600] text-[18px] text-[#1a1a1a] truncate">{data.nama}</h1>
              <p className="text-[12px] text-[#666666] truncate">Dibuat oleh {data.pembuat?.nama}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
            {isCurrentFolderAuthorized && (
              <>
                <button onClick={() => handleRenameFolderClick(data)} className="btn-secondary flex-1 sm:flex-none justify-center flex items-center gap-1.5 text-[13px] px-3 border-[#297BBF] text-[#297BBF] hover:bg-[#EBF4FC]" title="Ubah Nama">
                  <Edit size={14} />
                </button>
                <button onClick={() => handleDeleteFolderClick(data)} className="btn-secondary text-red-500 border-red-200 hover:bg-red-50 flex-1 sm:flex-none justify-center flex items-center gap-1.5 text-[13px] px-3" title="Hapus Folder">
                  <Trash2 size={14} />
                </button>
              </>
            )}
            <button onClick={() => setShowSubfolder(true)} className="btn-secondary flex-1 sm:flex-none justify-center flex items-center gap-1.5 text-[13px]">
              <Plus size={14} />
              Subfolder
            </button>
            <button onClick={() => setShowUpload(true)} className="btn-primary flex-1 sm:flex-none justify-center flex items-center gap-1.5 text-[13px]">
              <Upload size={14} />
              Unggah File
            </button>
          </div>
        </div>

        {/* Subfolders */}
        {data.subfolders?.length > 0 && (
          <div className="mb-6">
            <h2 className="uppercase tracking-[0.05em] font-[600] mb-3 text-[11px] text-[#666666]">Subfolder</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.subfolders.map((f, i) => (
                <FolderCard 
                  key={f.id} 
                  folder={f} 
                  index={i} 
                  currentUser={user}
                  onRename={handleRenameFolderClick}
                  onDelete={handleDeleteFolderClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* Files */}
        <div>
          <h2 className="uppercase tracking-[0.05em] font-[600] mb-3 text-[11px] text-[#666666]">File ({data.files?.length || 0})</h2>
          {!data.files?.length ? (
            <div className="bg-[#ffffff] text-center border-[0.5px] border-[#E0E0E0] rounded-[8px] py-[40px] px-[24px]">
              <div className="flex items-center justify-center mx-auto mb-3 w-[44px] h-[44px] bg-[#F4F4F5] rounded-[8px]">
                <File size={22} color="#E0E0E0" />
              </div>
              <p className="text-[13px] text-[#666666]">Belum ada file. Klik "Unggah File" untuk memulai.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.files.map(f => <FileCard key={f.id} file={f} onDelete={handleDeleteFile} />)}
            </div>
          )}
        </div>

        {/* Upload Modal */}
        <Modal isOpen={showUpload} onClose={() => { setShowUpload(false); setFile(null); }} title="Unggah File">
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block font-[500] mb-2 text-[12px] text-[#333333]">Pilih File</label>
              <div className="border-2 border-dashed border-[#E0E0E0] rounded-[8px] p-6 text-center transition-colors">
                <input type="file" accept="application/pdf" onChange={(e) => {
                  const selectedFile = e.target.files[0];
                  if (selectedFile) {
                    if (selectedFile.type !== 'application/pdf') {
                      toast.error('Hanya file PDF yang diizinkan.');
                      e.target.value = '';
                      setFile(null);
                      return;
                    }
                    if (selectedFile.size > 10 * 1024 * 1024) {
                      toast.error('Ukuran file maksimal 10 MB.');
                      e.target.value = '';
                      setFile(null);
                      return;
                    }
                    setFile(selectedFile);
                  } else {
                    setFile(null);
                  }
                }} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium" style={{ '--tw-file-bg': '#EBF4FC', '--tw-file-text': '#297BBF' }} />
                <p className="mt-3 text-[11px] text-[#888888]">Hanya mendukung file format PDF dengan ukuran maksimal 10 MB</p>
              </div>
              {file && <p className="text-[12px] mt-2 text-[#666666]">📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
            </div>
            {uploadMut.isError && <p className="text-[14px] text-[#ef4444]">{uploadMut.error?.response?.data?.message || 'Gagal mengunggah.'}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setShowUpload(false); setFile(null); }} className="btn-secondary text-[13px]">Batal</button>
              <button type="submit" disabled={!file || uploadMut.isPending} className="btn-primary text-[13px] flex items-center gap-2">
                {uploadMut.isPending && <div className="w-4 h-4 border-2 border-[#ffffff4d] border-t-white rounded-full animate-spin" />}
                Unggah
              </button>
            </div>
          </form>
        </Modal>

        {/* Subfolder Modal */}
        <Modal isOpen={showSubfolder} onClose={() => { setShowSubfolder(false); setSubName(''); }} title="Buat Subfolder">
          <form onSubmit={(e) => { e.preventDefault(); if (subName.trim()) subfolderMut.mutate(subName.trim()); }} className="space-y-4">
            <div>
              <label className="block font-[500] mb-1 text-[12px] text-[#333333]">Nama Subfolder</label>
              <input type="text" value={subName} onChange={(e) => setSubName(e.target.value)} className="input-field" placeholder="Nama subfolder" autoFocus required />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setShowSubfolder(false); setSubName(''); }} className="btn-secondary text-[13px]">Batal</button>
              <button type="submit" disabled={subfolderMut.isPending} className="btn-primary text-[13px]">Buat</button>
            </div>
          </form>
        </Modal>

        {/* Rename Modal */}
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
              <button type="button" onClick={() => setRenameData(null)} className="btn-secondary text-[13px]">Batal</button>
              <button type="submit" disabled={renameMut.isPending} className="btn-primary text-[13px] flex items-center gap-2">
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
