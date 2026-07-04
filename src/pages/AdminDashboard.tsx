import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, logout, isEmailAllowed } from '../lib/firebase';
import { toast } from 'sonner';
import { LayoutDashboard, FileText, Calendar, Image as ImageIcon, Video, LogOut, Menu, X, ArrowLeft, Navigation, Users, Briefcase } from 'lucide-react';
import PengumumanAdmin from './admin/PengumumanAdmin';
import BeritaAdmin from './admin/BeritaAdmin';
import AgendaAdmin from './admin/AgendaAdmin';
import FotoAdmin from './admin/FotoAdmin';
import VideoAdmin from './admin/VideoAdmin';
import WordPressImporter from './admin/WordPressImporter';
import NavigationAdmin from './admin/NavigationAdmin';
import UserAdmin from './admin/UserAdmin';
import LayananAdmin from './admin/LayananAdmin';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        toast.error('Anda harus login terlebih dahulu.');
        navigate('/login');
      } else if (user.email) {
        try {
          const allowed = await isEmailAllowed(user.email);
          if (allowed) {
            setLoading(false);
          } else {
            toast.error('Email Anda tidak terdaftar sebagai Admin. Akses ditolak.');
            await logout();
            navigate('/login');
          }
        } catch (error) {
          console.error("Auth check error:", error);
          toast.error('Gagal memverifikasi izin login.');
          await logout();
          navigate('/login');
        }
      } else {
        toast.error('Email tidak valid.');
        await logout();
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Berhasil logout');
      navigate('/');
    } catch (error) {
      toast.error('Gagal logout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-sm font-medium text-gray-500">Memverifikasi Hak Akses...</div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Navigasi', path: '/admin/navigasi', icon: Navigation },
    { name: 'User Admin', path: '/admin/users', icon: Users },
    { name: 'Layanan Utama', path: '/admin/layanan', icon: Briefcase },
    { name: 'Pengumuman', path: '/admin/pengumuman', icon: FileText },
    { name: 'Agenda', path: '/admin/agenda', icon: Calendar },
    { name: 'Berita', path: '/admin/berita', icon: FileText },
    { name: 'Foto', path: '/admin/foto', icon: ImageIcon },
    { name: 'Video', path: '/admin/video', icon: Video },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-green-900 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-green-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-green-900 font-bold">K</div>
            <span className="font-bold">Admin Panel</span>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-green-100 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${location.pathname === item.path ? 'bg-green-800 text-white border-l-4 border-amber-400' : 'text-green-100 hover:bg-green-800 hover:text-white'}`}
                >
                  <item.icon size={18} />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="absolute bottom-0 w-full p-4 border-t border-green-800">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-green-100 hover:bg-green-800 hover:text-white rounded-lg transition-colors mb-2">
            <ArrowLeft size={18} />
            Kembali ke Web
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-sm font-medium text-red-200 hover:bg-red-900 hover:text-white rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar for mobile */}
        <div className="md:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="font-bold text-gray-800">Admin Panel</div>
          <button onClick={() => setMobileMenuOpen(true)} className="text-gray-500 hover:text-gray-900">
            <Menu size={24} />
          </button>
        </div>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/navigasi" element={<NavigationAdmin />} />
            <Route path="/pengumuman" element={<PengumumanAdmin />} />
            <Route path="/agenda" element={<AgendaAdmin />} />
            <Route path="/berita" element={<BeritaAdmin />} />
            <Route path="/berita/import" element={<WordPressImporter />} />
            <Route path="/foto" element={<FotoAdmin />} />
            <Route path="/video" element={<VideoAdmin />} />
            <Route path="/users" element={<UserAdmin />} />
            <Route path="/layanan" element={<LayananAdmin />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function DashboardHome() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm font-medium mb-1">Total Pengumuman</div>
          <div className="text-3xl font-bold text-gray-900">12</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm font-medium mb-1">Total Agenda</div>
          <div className="text-3xl font-bold text-gray-900">5</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm font-medium mb-1">Total Berita</div>
          <div className="text-3xl font-bold text-gray-900">24</div>
        </div>
      </div>
    </div>
  );
}
