import { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FB] relative">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out md:flex md:flex-shrink-0`}>
         <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-[#E0E0E0] shadow-sm z-30">
          <div className="flex items-center gap-2">
            <img src="/logo-medan.png" alt="Logo" className="w-[28px] h-auto" />
            <span className="font-semibold text-[14px] text-[#297BBF]">E-Arsip</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1 rounded-md text-gray-500 hover:bg-gray-100"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
