import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import FolderPage from './pages/FolderPage';
import SearchPage from './pages/SearchPage';
import ActivityLogPage from './pages/ActivityLogPage';
import ManagePegawaiPage from './pages/ManagePegawaiPage';

import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { fontFamily: 'inherit', fontSize: '14px', borderRadius: '12px', padding: '12px 16px' },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/folder/:id" element={<ProtectedRoute><FolderPage /></ProtectedRoute>} />
          <Route path="/cari" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          <Route path="/log-aktivitas" element={<ProtectedRoute requiredRole="admin"><ActivityLogPage /></ProtectedRoute>} />
          <Route path="/pegawai" element={<ProtectedRoute requiredRole="admin"><ManagePegawaiPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
