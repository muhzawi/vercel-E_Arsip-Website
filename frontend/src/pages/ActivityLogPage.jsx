import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import api from '../api/axios';

const AKSI_BADGES = {
  upload_file: { label: 'Upload', bg: 'bg-[#DCFCE7]', color: 'text-[#166534]' },
  download_file: { label: 'Download', bg: 'bg-[#DBEAFE]', color: 'text-[#1e40af]' },
  hapus_file: { label: 'Hapus File', bg: 'bg-[#FEE2E2]', color: 'text-[#991b1b]' },
  cari_file: { label: 'Cari', bg: 'bg-[#FEF9C3]', color: 'text-[#854d0e]' },
  login: { label: 'Login', bg: 'bg-[#F3F4F6]', color: 'text-[#374151]' },
  logout: { label: 'Logout', bg: 'bg-[#F3F4F6]', color: 'text-[#374151]' },
  buat_folder: { label: 'Buat Folder', bg: 'bg-[#EDE9FE]', color: 'text-[#5b21b6]' },
  hapus_folder: { label: 'Hapus Folder', bg: 'bg-[#FEE2E2]', color: 'text-[#991b1b]' },
  tambah_pegawai: { label: 'Tambah Pegawai', bg: 'bg-[#FFEDD5]', color: 'text-[#9a3412]' },
  nonaktifkan_pegawai: { label: 'Status Pegawai', bg: 'bg-[#FEE2E2]', color: 'text-[#991b1b]' },
};

const AKSI_OPTIONS = ['login', 'logout', 'upload_file', 'download_file', 'hapus_file', 'cari_file', 'buat_folder', 'hapus_folder', 'tambah_pegawai', 'nonaktifkan_pegawai'];

export default function ActivityLogPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ aksi: '', dari: '', sampai: '' });

  const buildParams = () => {
    const p = { page, limit: 20 };
    if (filters.aksi) p.aksi = filters.aksi;
    if (filters.dari) p.dari = filters.dari;
    if (filters.sampai) p.sampai = filters.sampai;
    return new URLSearchParams(p).toString();
  };

  const { data, isLoading } = useQuery({
    queryKey: ['logs', page, filters],
    queryFn: () => api.get(`/admin/logs?${buildParams()}`).then(r => r.data.data),
  });


  return (
    <Layout>
      <div className="animate-fadeIn p-[24px]">
        <div className="mb-[16px]">
          <h1 className="font-[600] text-[18px] text-[#1a1a1a]">Log Aktivitas</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-[8px] bg-[#ffffff] mb-[16px] border-[0.5px] border-[#E0E0E0] rounded-[8px] px-[14px] py-[12px]">
          <div>
            <select value={filters.aksi} onChange={(e) => { setFilters(f => ({ ...f, aksi: e.target.value })); setPage(1); }} className="input-field text-[13px] py-2 min-w-[170px]">
              <option value="">Semua Aksi</option>
              {AKSI_OPTIONS.map(a => <option key={a} value={a}>{AKSI_BADGES[a]?.label || a}</option>)}
            </select>
          </div>
          <div>
            <input type="date" value={filters.dari} onChange={(e) => { setFilters(f => ({ ...f, dari: e.target.value })); setPage(1); }} className="input-field text-[13px] py-2" />
          </div>
          <div>
            <input type="date" value={filters.sampai} onChange={(e) => { setFilters(f => ({ ...f, sampai: e.target.value })); setPage(1); }} className="input-field text-[13px] py-2" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#ffffff] overflow-hidden border-[0.5px] border-[#E0E0E0] rounded-[8px]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F4F4F5]">
                  <th className="text-left font-[500] uppercase tracking-[0.05em] text-[11px] text-[#666666] px-[14px] py-[10px]">No</th>
                  <th className="text-left font-[500] uppercase tracking-[0.05em] text-[11px] text-[#666666] px-[14px] py-[10px]">Waktu</th>
                  <th className="text-left font-[500] uppercase tracking-[0.05em] text-[11px] text-[#666666] px-[14px] py-[10px]">Nama Pegawai</th>
                  <th className="text-left font-[500] uppercase tracking-[0.05em] text-[11px] text-[#666666] px-[14px] py-[10px]">Aksi</th>
                  <th className="text-left font-[500] uppercase tracking-[0.05em] text-[11px] text-[#666666] px-[14px] py-[10px]">Keterangan</th>
                  <th className="text-left font-[500] uppercase tracking-[0.05em] text-[11px] text-[#666666] px-[14px] py-[10px]">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b-[0.5px] border-[#E0E0E0]">
                      {[...Array(6)].map((_, j) => <td key={j} className="px-[14px] py-[10px]"><div className="h-4 rounded animate-pulse-soft bg-[#F4F4F5]" /></td>)}
                    </tr>
                  ))
                ) : data?.logs?.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-[48px] px-[14px] text-[#666666] text-[13px]">Belum ada log aktivitas.</td></tr>
                ) : (
                  data?.logs?.map((log, i) => {
                    const badge = AKSI_BADGES[log.aksi] || { label: log.aksi, bg: 'bg-[#F3F4F6]', color: 'text-[#374151]' };
                    return (
                      <tr key={log.id} className="transition-colors duration-150 hover:bg-[#F8F9FB] border-b-[0.5px] border-[#E0E0E0]">
                        <td className="px-[14px] py-[10px] text-[13px] text-[#666666]">{(page - 1) * 20 + i + 1}</td>
                        <td className="whitespace-nowrap px-[14px] py-[10px] text-[13px] text-[#1a1a1a]">
                          {new Date(log.terjadi_pada).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="font-[500] px-[14px] py-[10px] text-[13px] text-[#1a1a1a]">{log.user?.nama || '—'}</td>
                        <td className="px-[14px] py-[10px]">
                          <span className={`inline-flex items-center font-[500] text-[11px] px-[8px] py-[2px] rounded-[20px] ${badge.bg} ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="max-w-xs truncate px-[14px] py-[10px] text-[13px] text-[#666666]">{log.keterangan || '—'}</td>
                        <td className="font-mono px-[14px] py-[10px] text-[11px] text-[#666666]">{log.ip_address || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 py-3 border-t-[0.5px] border-[#E0E0E0]">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="text-[12px] font-[500] py-[6px] px-[12px] rounded-[6px] transition-all disabled:opacity-40 text-[#666666]">← Prev</button>
              {[...Array(Math.min(data.totalPages, 5))].map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-[32px] h-[32px] rounded-[6px] text-[12px] font-[500] transition-all ${
                      page === p ? 'bg-[#297BBF] text-[#ffffff]' : 'bg-transparent text-[#666666]'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages} className="text-[12px] font-[500] py-[6px] px-[12px] rounded-[6px] transition-all disabled:opacity-40 text-[#666666]">Next →</button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
