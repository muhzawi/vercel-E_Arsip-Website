import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Search, Activity, Users, LogOut, X } from 'lucide-react';

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.nama
    ? user.nama.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const menuItems = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { to: '/cari', label: 'Cari Dokumen', icon: <Search size={16} /> },
  ];

  const adminMenuItems = [
    { to: '/log-aktivitas', label: 'Log Aktivitas', icon: <Activity size={16} /> },
    { to: '/pegawai', label: 'Kelola Pegawai', icon: <Users size={16} /> },
  ];

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2.5 py-2 px-2.5 rounded-[6px] text-[13px] font-medium transition-all duration-300 ${
      isActive
        ? 'bg-[#1a6aad] text-white shadow-sm'
        : 'text-white/85 hover:bg-[#1a6aad] hover:text-white'
    }`;

  return (
    <aside className="h-screen flex flex-col flex-shrink-0 w-[220px] bg-[#297BBF] shadow-xl md:shadow-none">
      {/* Header — Logo */}
      <div className="px-4 py-4 border-b border-[#ffffff22] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center flex-shrink-0">
            <img
              src="/logo-medan.png"
              alt="Logo Medan"
              className="w-[32px] h-auto"
            />
          </div>
          <div>
            <h1 className="text-white font-[600] text-[14px] leading-none mb-[2px]">E-Arsip</h1>
            <p className="text-white/50 font-normal text-[10px] leading-none">Dinas Pendidikan</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-white/70 hover:text-white p-1 rounded-md">
            <X size={20} />
          </button>
        )}
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-[#ffffff22]">
        <div className="flex items-center gap-2.5">
          <div className="rounded-full flex items-center justify-center flex-shrink-0 w-[36px] h-[36px] bg-white text-[#297BBF] font-[600] text-[14px] shadow-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0 flex flex-col items-start">
            <p className="text-white font-[500] text-[12px] truncate w-full leading-tight mb-1">{user?.nama}</p>
            {user?.role === 'admin' ? (
              <span className="inline-block bg-[#FBD206] text-[#000000] text-[10px] font-[600] px-2 py-[2px] rounded-[4px] leading-none">
                Admin
              </span>
            ) : (
              <span className="inline-block bg-[#ffffff22] text-white text-[10px] font-[500] px-2 py-[2px] rounded-[4px] border border-[#ffffff33] leading-none">
                Pegawai
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {menuItems.map(item => (
          <NavLink key={item.to} to={item.to} className={linkClass} onClick={onClose}>
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-white' : 'text-white/70'}>{item.icon}</span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <div className="mt-4">
            <p className="text-white/40 text-[10px] uppercase tracking-wider px-2.5 mb-1.5">Admin</p>
            {adminMenuItems.map(item => (
              <NavLink key={item.to} to={item.to} className={linkClass} onClick={onClose}>
                {({ isActive }) => (
                  <>
                    <span className={isActive ? 'text-white' : 'text-white/70'}>{item.icon}</span>
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 pt-3 border-t border-[#ffffff22]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full py-2 px-2.5 rounded-[6px] text-[13px] font-medium text-white/60 hover:bg-[#1a6aad] hover:text-white transition-all duration-300"
        >
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </aside>
  );
}
