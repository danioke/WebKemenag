import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, logout, isEmailAllowed } from '../lib/firebase';
import { toast } from 'sonner';
import { LayoutDashboard, FileText, Calendar, Image as ImageIcon, Video, LogOut, Menu, X, ArrowLeft, Navigation, Users, Briefcase, ChevronDown, User, Save } from 'lucide-react';
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

  const [profileName, setProfileName] = useState(() => localStorage.getItem('admin_profile_name') || 'Administrator');
  const [profileEmail, setProfileEmail] = useState(() => localStorage.getItem('admin_profile_email') || 'anisreza498@gmail.com');
  const [profilePhoto, setProfilePhoto] = useState(() => localStorage.getItem('admin_profile_photo') || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const [editName, setEditName] = useState(profileName);
  const [editEmail, setEditEmail] = useState(profileEmail);
  const [editPhoto, setEditPhoto] = useState(profilePhoto);

  useEffect(() => {
    // Check if there's a bypass admin session
    const isMock = localStorage.getItem('mock_admin_session') === 'true';
    if (isMock) {
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      // Re-check bypass in case it was set during onAuthStateChanged flow
      if (localStorage.getItem('mock_admin_session') === 'true') {
        setLoading(false);
        return;
      }
      if (!user) {
        toast.error('Anda harus login terlebih dahulu.');
        navigate('/hmsoke');
      } else if (user.email) {
        try {
          const allowed = await isEmailAllowed(user.email);
          if (allowed) {
            setLoading(false);
          } else {
            toast.error('Email Anda tidak terdaftar sebagai Admin. Akses ditolak.');
            await logout();
            navigate('/hmsoke');
          }
        } catch (error) {
          console.error("Auth check error:", error);
          toast.error('Gagal memverifikasi izin login.');
          await logout();
          navigate('/hmsoke');
        }
      } else {
        toast.error('Email tidak valid.');
        await logout();
        navigate('/hmsoke');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('mock_admin_session');
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
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row relative">
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
        {/* Bypass Mode Warning */}
        {localStorage.getItem('mock_admin_session') === 'true' && (
          <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium z-50">
            ⚠️ Anda sedang menggunakan Mode Akses Instan (Bypass). Data mungkin kosong karena tidak terhubung ke database. Silakan Logout dan gunakan Login Google untuk akses penuh.
          </div>
        )}
        
        {/* Unified Topbar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-8 shrink-0 relative z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-gray-500 hover:text-gray-900 transition-colors">
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold text-gray-800 hidden md:block">
              {navItems.find(item => location.pathname === item.path)?.name || 'Dashboard'}
            </h1>
            <div className="font-bold text-gray-800 md:hidden">Admin Panel</div>
          </div>

          <div className="flex items-center gap-3">
            {/* Kembali ke Web */}
            <a 
              href="/" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-green-50 hover:bg-green-100 text-green-800 hover:text-green-900 font-bold rounded-xl transition-all text-xs md:text-sm shadow-sm border border-green-100"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Kembali ke Web</span>
              <span className="sm:hidden">Web</span>
            </a>

            {/* User Profile Dropdown Trigger */}
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 bg-gray-100 shrink-0">
                  <img 
                    src={profilePhoto} 
                    alt={profileName} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150';
                    }}
                  />
                </div>
                <ChevronDown size={14} className={`text-gray-500 transition-transform hidden md:block ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Box */}
              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl py-3 z-50 text-left">
                    <div className="px-4 py-2 border-b border-gray-100/50 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                        <img 
                          src={profilePhoto} 
                          alt={profileName} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150';
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm truncate">{profileName}</h4>
                        <p className="text-xs text-gray-500 truncate">{profileEmail}</p>
                      </div>
                    </div>
                    
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => {
                          setEditName(profileName);
                          setEditEmail(profileEmail);
                          setEditPhoto(profilePhoto);
                          setIsEditProfileOpen(true);
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-800 rounded-lg transition-colors text-left font-medium cursor-pointer"
                      >
                        <User size={16} className="text-gray-400" />
                        Edit Profil
                      </button>
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left font-medium cursor-pointer"
                      >
                        <LogOut size={16} className="text-red-400" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

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

      {/* Edit Profile Modal (CRUD Profil) */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="bg-green-800 text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Edit Profil Pengguna</h3>
                <p className="text-xs text-green-200 mt-0.5">Ubah foto profil, nama, dan email administrator.</p>
              </div>
              <button 
                onClick={() => setIsEditProfileOpen(false)} 
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!editName.trim()) {
                toast.error("Nama tidak boleh kosong!");
                return;
              }
              if (!editEmail.trim()) {
                toast.error("Email tidak boleh kosong!");
                return;
              }
              setProfileName(editName.trim());
              setProfileEmail(editEmail.trim());
              setProfilePhoto(editPhoto.trim());
              localStorage.setItem('admin_profile_name', editName.trim());
              localStorage.setItem('admin_profile_email', editEmail.trim());
              localStorage.setItem('admin_profile_photo', editPhoto.trim());
              toast.success("Profil administrator berhasil diperbarui!");
              setIsEditProfileOpen(false);
            }} className="p-6 space-y-4">
              
              {/* Photo Preview & URL input */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-green-700 shadow-md">
                  <img 
                    src={editPhoto} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150';
                    }}
                  />
                </div>
                <div className="w-full">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Foto Profil (URL)</label>
                  <input
                    type="url"
                    value={editPhoto}
                    onChange={(e) => setEditPhoto(e.target.value)}
                    placeholder="https://images.unsplash.com/... atau link foto"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nama Administrator"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all"
                />
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Alamat Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="admin@email.com"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl text-sm transition-all cursor-pointer"
                >
                  <Save size={16} />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
