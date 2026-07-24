import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  auth,
  logout,
  isEmailAllowed,
  db,
  collection,
  getDocs,
  updateDoc,
  doc,
} from "../lib/db";
import { toast } from "sonner";
import { showAlert, showToast } from "../lib/swal";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Image as ImageIcon,
  Video,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  Navigation,
  Users,
  Briefcase,
  ChevronDown,
  ChevronRight,
  User,
  Save,
  Folder,
  Settings,
  Mail,
  ShieldCheck,
  Eye,
  Database,
  Activity,
  Globe,
  Printer,
  RotateCcw,
  Search,
  Filter,
  Clock,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  Server,
  BarChart3,
  RefreshCw,
  Trash2,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import PengumumanAdmin from "./admin/PengumumanAdmin";
import BeritaAdmin from "./admin/BeritaAdmin";
import AgendaAdmin from "./admin/AgendaAdmin";
import FotoAdmin from "./admin/FotoAdmin";
import BannerAdmin from "./admin/BannerAdmin";
import InfografisAdmin from "./admin/InfografisAdmin";
import VideoAdmin from "./admin/VideoAdmin";
import WordPressImporter from "./admin/WordPressImporter";
import NavigationAdmin from "./admin/NavigationAdmin";
import UserAdmin from "./admin/UserAdmin";
import ProfilAdmin from "./admin/ProfilAdmin";
import LayananAdmin from "./admin/LayananAdmin";
import KategoriAdmin from "./admin/KategoriAdmin";
import LaporanAdmin from "./admin/LaporanAdmin";
import MediaAdmin from "./admin/MediaAdmin";
import SettingsAdmin from "./admin/SettingsAdmin";
import SubscribersAdmin from "./admin/SubscribersAdmin";
import TwoFactorAdmin from "./admin/TwoFactorAdmin";
import { useSettingsStore } from "../store/useSettingsStore";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [profileName, setProfileName] = useState(
    () => localStorage.getItem("admin_profile_name") || "Administrator",
  );
  const [profileEmail, setProfileEmail] = useState(
    () =>
      localStorage.getItem("admin_profile_email") || "anisreza498@gmail.com",
  );
  const [profilePhoto, setProfilePhoto] = useState(
    () =>
      localStorage.getItem("admin_profile_photo") ||
      "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80&w=150",
  );
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const [editName, setEditName] = useState(profileName);
  const [editEmail, setEditEmail] = useState(profileEmail);
  const [editPhoto, setEditPhoto] = useState(profilePhoto);
  const [editPassword, setEditPassword] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isBeritaOpen, setIsBeritaOpen] = useState(true);

  const handleProfileImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    setIsUploadingPhoto(true);
    toast.info("Mengunggah foto profil...");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (res.ok) {
        const result = await res.json();
        setEditPhoto(result.url);
        toast.success("Foto profil berhasil diunggah");
      } else {
        toast.error("Gagal mengunggah foto profil");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat mengunggah");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  useEffect(() => {
    // Check if there's a bypass admin session
    const isMock = localStorage.getItem("mock_admin_session") === "true";
    if (isMock) {
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      // Re-check bypass in case it was set during onAuthStateChanged flow
      if (localStorage.getItem("mock_admin_session") === "true") {
        setLoading(false);
        return;
      }
      if (!user) {
        navigate("/404", { replace: true });
      } else if (user.email) {
        try {
          const allowed = await isEmailAllowed(user.email);
          if (allowed) {
            setLoading(false);
          } else {
            toast.error(
              "Email Anda tidak terdaftar sebagai Admin. Akses ditolak.",
            );
            await logout();
            navigate("/hmsoke");
          }
        } catch (error) {
          console.error("Auth check error:", error);
          toast.error("Gagal memverifikasi izin login.");
          await logout();
          navigate("/hmsoke");
        }
      } else {
        toast.error("Email tidak valid.");
        await logout();
        navigate("/hmsoke");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("mock_admin_session");
      await logout();
      toast.success("Berhasil logout");
      navigate("/");
    } catch (error) {
      toast.error("Gagal logout");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>

        <div className="text-sm font-medium text-gray-500">
          Memverifikasi Hak Akses...
        </div>
      </div>
    );
  }

  const navItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Profil Kantor", path: "/admin/profil", icon: Users },
    { name: "Media", path: "/admin/media", icon: Folder },
    { name: "Navigasi", path: "/admin/navigasi", icon: Navigation },
    { name: "User Admin", path: "/admin/users", icon: Users },
    { name: "Layanan Utama", path: "/admin/layanan", icon: Briefcase },
    { name: "Pengumuman", path: "/admin/pengumuman", icon: FileText },
    { name: "Agenda", path: "/admin/agenda", icon: Calendar },
    {
      name: "Berita",
      icon: FileText,
      subItems: [
        { name: "Daftar Berita", path: "/admin/berita" },
        { name: "Kategori", path: "/admin/kategori" },
        { name: "Foto", path: "/admin/foto" },
        { name: "Video", path: "/admin/video" },
        { name: "Infografis", path: "/admin/infografis" },
        { name: "Banner", path: "/admin/banner" },
      ],
    },
    { name: "Laporan", path: "/admin/laporan", icon: FileText },
    { name: "Keamanan 2FA", path: "/admin/2fa", icon: ShieldCheck },
    { name: "Pelanggan Buletin", path: "/admin/subscribers", icon: Mail },
    { name: "Pengaturan", path: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row relative">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-green-900 text-white transform transition-transform duration-300 ease-in-out md:fixed md:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} overflow-y-auto`}
      >
        <div className="flex items-center justify-between p-4 border-b border-green-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-green-900 font-bold">
              K
            </div>

            <span className="font-bold">Admin Panel</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-green-100 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                {item.subItems ? (
                  <div>
                    <button
                      onClick={() => setIsBeritaOpen(!isBeritaOpen)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${location.pathname.includes("/admin/berita") || location.pathname.includes("/admin/foto") || location.pathname.includes("/admin/video") || location.pathname.includes("/admin/kategori") || location.pathname.includes("/admin/banner") || location.pathname.includes("/admin/infografis") ? "bg-green-800 text-white border-l-4 border-amber-400" : "text-green-100 hover:bg-green-800 hover:text-white"}`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={18} />
                        {item.name}
                      </div>

                      {isBeritaOpen ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>
                    {isBeritaOpen && (
                      <ul className="bg-green-950/50 py-2 space-y-1">
                        {item.subItems.map((subItem) => (
                          <li key={subItem.name}>
                            <Link
                              to={subItem.path}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center pl-11 pr-4 py-2 text-xs font-medium transition-colors ${location.pathname === subItem.path ? "text-amber-400" : "text-green-200 hover:text-white"}`}
                            >
                              {subItem.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${location.pathname === item.path ? "bg-green-800 text-white border-l-4 border-amber-400" : "text-green-100 hover:bg-green-800 hover:text-white"}`}
                  >
                    <item.icon size={18} />
                    {item.name}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:ml-64">
        {/* Unified Topbar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-8 shrink-0 fixed top-0 right-0 left-0 md:left-64 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-bold text-gray-800 hidden md:block">
              {navItems.find((item) => location.pathname === item.path)?.name ||
                "Dashboard"}
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
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&q=80&w=150";
                    }}
                  />
                </div>

                <ChevronDown
                  size={14}
                  className={`text-gray-500 transition-transform hidden md:block ${profileDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Profile Dropdown Box */}
              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileDropdownOpen(false)}
                  ></div>

                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl py-3 z-50 text-left">
                    <div className="px-4 py-2 border-b border-gray-100/50 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                        <img
                          src={profilePhoto}
                          alt={profileName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1564683214965-3619addd900d?auto=format&fit=crop&q=80&w=150";
                          }}
                        />
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm truncate">
                          {profileName}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">
                          {profileEmail}
                        </p>
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
        <main className="flex-1 overflow-y-auto pt-20 pb-4 px-4 md:pt-24 md:pb-8 md:px-8">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/media" element={<MediaAdmin />} />
            <Route path="/settings" element={<SettingsAdmin />} />
            <Route path="/navigasi" element={<NavigationAdmin />} />
            <Route path="/pengumuman" element={<PengumumanAdmin />} />
            <Route path="/agenda" element={<AgendaAdmin />} />
            <Route path="/berita" element={<BeritaAdmin />} />
            <Route path="/berita/import" element={<WordPressImporter />} />
            <Route path="/foto" element={<FotoAdmin />} />
            <Route path="/banner" element={<BannerAdmin />} />
            <Route path="/infografis" element={<InfografisAdmin />} />
            <Route path="/video" element={<VideoAdmin />} />
            <Route path="/profil" element={<ProfilAdmin />} />
            <Route path="/users" element={<UserAdmin />} />
            <Route path="/layanan" element={<LayananAdmin />} />
            <Route path="/kategori" element={<KategoriAdmin />} />
            <Route path="/laporan" element={<LaporanAdmin />} />
            <Route path="/2fa" element={<TwoFactorAdmin />} />
            <Route path="/subscribers" element={<SubscribersAdmin />} />
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
                <p className="text-xs text-green-200 mt-0.5">
                  Ubah foto profil, nama, dan email administrator.
                </p>
              </div>

              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editName.trim()) {
                  toast.error("Nama tidak boleh kosong!");
                  return;
                }
                if (!editEmail.trim()) {
                  toast.error("Email tidak boleh kosong!");
                  return;
                }

                if (editPassword) {
                  try {
                    const snap = await getDocs(collection(db, "allowed_users"));
                    let userDoc = null;
                    snap.forEach((d) => {
                      if (
                        d.data().email?.toLowerCase() ===
                        profileEmail.toLowerCase()
                      ) {
                        userDoc = { id: d.id, ...d.data() };
                      }
                    });
                    if (userDoc) {
                      await updateDoc(doc(db, "allowed_users", userDoc.id), {
                        name: editName.trim(),
                        email: editEmail.trim(),
                        password: editPassword,
                      });
                      toast.success("Password dan profil berhasil diubah!");
                    } else {
                      toast.warning(
                        "Profil diubah, namun akun Anda tidak ditemukan di Manajemen User.",
                      );
                    }
                  } catch (err) {
                    console.error(err);
                    toast.error("Gagal mengubah data di database.");
                  }
                }

                setProfileName(editName.trim());
                setProfileEmail(editEmail.trim());
                setProfilePhoto(editPhoto.trim());
                setEditPassword("");
                localStorage.setItem("admin_profile_name", editName.trim());
                localStorage.setItem("admin_profile_email", editEmail.trim());
                localStorage.setItem("admin_profile_photo", editPhoto.trim());
                toast.success("Profil administrator berhasil diperbarui!");
                setIsEditProfileOpen(false);
              }}
              className="p-6 space-y-4"
            >
              {/* Photo Preview & URL input */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-green-700 shadow-md relative group cursor-pointer">
                  <img
                    src={editPhoto}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1604085572504-a392ddf0d86a?auto=format&fit=crop&q=80&w=150";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-[10px] font-bold uppercase tracking-wider">
                      Ubah
                    </span>
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleProfileImageUpload}
                    disabled={isUploadingPhoto}
                  />
                </div>

                <div className="w-full">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Foto Profil (URL)
                  </label>
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
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Nama Lengkap
                </label>
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
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Alamat Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="admin@email.com"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all"
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Ubah Password
                </label>
                <input
                  type="password"
                  value={editPassword}
                  autoComplete="new-password"
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Biarkan kosong jika tidak ingin diubah"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Hanya berlaku untuk akun di Manajemen User.
                </p>
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
  const { logoKemenagUrl, logoUrl, fetchSettings } = useSettingsStore();
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pingMs, setPingMs] = useState<number | null>(null);

  // Stats for counter cards
  const [visitorStats, setVisitorStats] = useState<any>({
    news: { count: 0, totalViews: 0 },
    photos: { count: 0, totalViews: 0 },
    agendas: { count: 0, totalViews: 0 },
    infografis: { count: 0, totalViews: 0 },
    videos: { count: 0, totalViews: 0 },
    halaman: { count: 0, totalViews: 0 },
    totalVisitorLogs: 0,
    uniqueIps: 0,
    recentLogs: []
  });

  // Filters & Visitor Logs
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [contentTypeFilter, setContentTypeFilter] = useState<string>("semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [visitorLogs, setVisitorLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [isResettingLogs, setIsResettingLogs] = useState<boolean>(false);

  const fetchDbStatus = () => {
    setIsRefreshing(true);
    const startPing = Date.now();
    fetch("/api/db-status?t=" + Date.now())
      .then((res) => res.json())
      .then((data) => {
        setPingMs(Date.now() - startPing);
        setDbStatus(data);
        setIsRefreshing(false);
      })
      .catch((err) => {
        console.error("Error fetching db status:", err);
        setIsRefreshing(false);
      });
  };

  const handleSyncMongo = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/db/sync-to-mongodb", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Migrasi ke MongoDB berhasil!");
        fetchVisitorStats();
      } else {
        toast.error(data.error || "Gagal migrasi data ke MongoDB.");
      }
    } catch (err: any) {
      toast.error("Gagal melakukan koneksi migrasi.");
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchVisitorStats = async () => {
    try {
      const res = await fetch("/api/visitor/stats?t=" + Date.now());
      if (res.ok) {
        const data = await res.json();
        setVisitorStats(data);
      }
    } catch (err) {
      console.error("Error fetching visitor stats:", err);
    }
  };

  const fetchFilteredVisitorLogs = async () => {
    setIsLoadingLogs(true);
    try {
      let url = `/api/visitor/logs?t=${Date.now()}&limit=500`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (contentTypeFilter && contentTypeFilter !== "semua") url += `&contentType=${contentTypeFilter}`;

      const res = await fetch(url);
      if (res.ok) {
        const logs = await res.json();
        setVisitorLogs(logs);
      }
    } catch (err) {
      console.error("Error fetching visitor logs:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleResetVisitorLogs = async () => {
    const confirmed = await showAlert.confirm(
      "Reset Rekam Pengunjung?",
      "Apakah Anda yakin ingin menghapus seluruh log data riwayat pengunjung? Tindakan ini tidak dapat dibatalkan."
    );
    if (!confirmed) return;

    setIsResettingLogs(true);
    try {
      const res = await fetch("/api/visitor/logs", { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        showAlert.success("Berhasil Reset", data.message || "Data rekam pengunjung berhasil dibersihkan!");
        setShowResetConfirmModal(false);
        fetchVisitorStats();
        fetchFilteredVisitorLogs();
      } else {
        showAlert.error("Gagal Reset", data.error || "Gagal mereset data pengunjung.");
      }
    } catch (err) {
      showAlert.error("Kesalahan Server", "Gagal koneksi ke server saat mereset data.");
    } finally {
      setIsResettingLogs(false);
    }
  };

  const handlePrintReport = () => {
    const printWindow = window.open("", "_blank", "width=900,height=800");
    if (!printWindow) {
      toast.error("Gagal membuka jendela cetak. Izinkan pop-up di browser Anda.");
      return;
    }

    const filteredLogsForPrint = visitorLogs.filter(l => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (l.title || "").toLowerCase().includes(q) ||
        (l.ip || "").toLowerCase().includes(q) ||
        (l.browserOs || "").toLowerCase().includes(q) ||
        (l.contentType || "").toLowerCase().includes(q)
      );
    });

    const periodeText = startDate || endDate
      ? `${startDate ? new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Awal'} s.d. ${endDate ? new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Sekarang'}`
      : 'Keseluruhan Data Terrekam';

    const logoSrc = logoKemenagUrl || logoUrl || 'https://kuatelukgelam.kemenagoki.id/assets/img/logo.png';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Laporan Rekam Pengunjung & Pembaca Konten - Kemenag OKI</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000; margin: 20px; line-height: 1.3; }
          .kop { display: flex; align-items: center; justify-content: center; gap: 15px; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 20px; text-align: center; }
          .kop-logo { width: 75px; height: 75px; object-fit: contain; shrink-0: 0; }
          .kop-text { flex: 1; text-align: center; }
          .kop-text h2 { margin: 0; font-size: 13pt; font-weight: bold; text-transform: uppercase; }
          .kop-text h3 { margin: 2px 0; font-size: 12pt; font-weight: bold; }
          .kop-text p { margin: 0; font-size: 9pt; font-style: italic; }
          .title { text-align: center; margin-bottom: 20px; }
          .title h4 { margin: 0; font-size: 12pt; font-weight: bold; text-transform: uppercase; text-decoration: underline; }
          .title p { margin: 4px 0 0 0; font-size: 10pt; font-style: italic; }
          .summary-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
          .summary-card { border: 1px solid #333; padding: 8px 12px; border-radius: 4px; flex: 1; min-width: 120px; text-align: center; font-size: 10pt; }
          .summary-card strong { display: block; font-size: 14pt; color: #000; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9pt; }
          table, th, td { border: 1px solid #333; }
          th { background-color: #f2f2f2; padding: 6px; font-weight: bold; text-align: center; }
          td { padding: 5px 8px; vertical-align: top; }
          .ttd-container { display: flex; justify-content: space-between; margin-top: 40px; page-break-inside: avoid; }
          .ttd-box { width: 220px; text-align: center; font-size: 10pt; }
          .ttd-space { height: 65px; }
          @media print {
            body { margin: 0; }
            @page { size: A4 portrait; margin: 1.5cm; }
          }
        </style>
      </head>
      <body>
        <div class="kop">
          ${logoSrc ? `<img src="${logoSrc}" class="kop-logo" alt="Logo Kemenag" />` : ''}
          <div class="kop-text">
            <h2>KEMENTERIAN AGAMA REPUBLIK INDONESIA</h2>
            <h3>KANTOR KEMENTERIAN AGAMA KABUPATEN OGAN KOMERING ILIR</h3>
            <p>Jl. Jalan Letnan Mukhtar Saleh No.087 Kayuagung 30611</p>
            <p>Website: https://kemenagoki.id | Email: humas@kemenagoki.id</p>
          </div>
        </div>

        <div class="title">
          <h4>LAPORAN REKAM JEJAK PENGUNJUNG & PEMBACA KONTEN WEBSITE</h4>
          <p>Periode Laporan: ${periodeText}</p>
        </div>

        <div class="summary-grid">
          <div class="summary-card">Total Pembaca Berita<strong>${visitorStats.news?.totalViews || 0}x</strong></div>
          <div class="summary-card">Total Lihat Foto<strong>${visitorStats.photos?.totalViews || 0}x</strong></div>
          <div class="summary-card">Total Akses Agenda<strong>${visitorStats.agendas?.totalViews || 0}x</strong></div>
          <div class="summary-card">Total Infografis<strong>${visitorStats.infografis?.totalViews || 0}x</strong></div>
          <div class="summary-card">Total Putar Video<strong>${visitorStats.videos?.totalViews || 0}x</strong></div>
          <div class="summary-card">Total Layanan<strong>${visitorStats.halaman?.totalViews || 0}x</strong></div>
        </div>

        <p style="font-size: 10pt; font-weight: bold; margin-bottom: 8px;">
          Rincian Aktivitas Pembukaan Konten Terakhir (${filteredLogsForPrint.length} Rekam Log Ditampilkan):
        </p>

        <table>
          <thead>
            <tr>
              <th width="4%">No</th>
              <th width="32%">Judul Postingan / Halaman</th>
              <th width="12%">Kategori</th>
              <th width="16%">Alamat IP</th>
              <th width="18%">Browser & OS</th>
              <th width="18%">Waktu Akses</th>
            </tr>
          </thead>
          <tbody>
            ${
              filteredLogsForPrint.length === 0
                ? `<tr><td colspan="6" style="text-align: center; padding: 15px; color: #666;">Belum ada rekam data pengunjung pada periode ini.</td></tr>`
                : filteredLogsForPrint.map((item, idx) => `
                  <tr>
                    <td style="text-align: center;">${idx + 1}</td>
                    <td><strong>${item.title || "Halaman Website"}</strong></td>
                    <td style="text-align: center;">${item.contentType || "Halaman"}</td>
                    <td style="text-align: center; font-family: monospace;">${item.ip || "127.0.0.1"}</td>
                    <td>${item.browserOs || item.browser || "Unknown"}</td>
                    <td style="text-align: center;">${new Date(item.timestamp).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })} WIB</td>
                  </tr>
                `).join("")
            }
          </tbody>
        </table>

        <div class="ttd-container">
          <div class="ttd-box">
            <p>Mengetahui,<br><strong>Kasubbag Tata Usaha</strong></p>
            <div class="ttd-space"></div>
            <p style="text-decoration: underline; font-weight: bold; margin-bottom: 0;">(............................................)</p>
            <p style="font-size: 8pt; margin-top: 2px;">NIP. ........................................</p>
          </div>
          <div class="ttd-box">
            <p>Kayuagung, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br><strong>Pengelola Tim Humas</strong></p>
            <div class="ttd-space"></div>
            <p style="text-decoration: underline; font-weight: bold; margin-bottom: 0;">(............................................)</p>
            <p style="font-size: 8pt; margin-top: 2px;">NIP. ........................................</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  useEffect(() => {
    fetchDbStatus();
    fetchVisitorStats();
    fetchFilteredVisitorLogs();
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchFilteredVisitorLogs();
  }, [startDate, endDate, contentTypeFilter]);

  const filteredLogs = visitorLogs.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (l.title || "").toLowerCase().includes(q) ||
      (l.ip || "").toLowerCase().includes(q) ||
      (l.browserOs || "").toLowerCase().includes(q) ||
      (l.contentType || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-gray-900">Dashboard Utama</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sistem Operasional
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Monitoring real-time status database, statistik pembaca konten, serta rekam log aktivitas pengunjung.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => {
              fetchDbStatus();
              fetchVisitorStats();
              fetchFilteredVisitorLogs();
              toast.success("Data dashboard diperbarui!");
            }}
            disabled={isRefreshing}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* CARD 1: Status Database & Kesehatan Website */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Database size={18} />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-wide text-white">Status Database & Kesehatan Sistem</h2>
              <p className="text-xs text-slate-400">Penyimpanan utama dan kualitas koneksi server</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            {pingMs !== null && (
              <span className="px-2.5 py-1 bg-slate-800 text-emerald-400 rounded-md border border-slate-700 flex items-center gap-1 font-mono">
                <Activity size={12} /> Ping: {pingMs} ms
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          {dbStatus && (
            <div>
              {dbStatus.useMySQL ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3">
                    <div className="p-2.5 bg-emerald-500 text-white rounded-lg shadow-sm">
                      <Server size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Database Aktif</span>
                      <p className="text-sm font-extrabold text-emerald-950 mt-0.5">MySQL Hostinger (cPanel)</p>
                      <span className="inline-block mt-1 text-xs text-emerald-700 font-mono">Host: {dbStatus.mysqlHost || 'Terhubung'}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-green-50/80 border border-green-200 flex items-start gap-3">
                    <div className="p-2.5 bg-green-600 text-white rounded-lg shadow-sm">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-green-700 uppercase tracking-wider block">Status Koneksi</span>
                      <p className="text-sm font-extrabold text-green-950 mt-0.5 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                        Terhubung & Normal
                      </p>
                      <span className="inline-block mt-1 text-xs text-green-700">Tabel Collections Terverifikasi</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <div className="p-2.5 bg-slate-700 text-white rounded-lg shadow-sm">
                      <Activity size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Kesehatan Website</span>
                      <p className="text-sm font-extrabold text-slate-900 mt-0.5">100% Online</p>
                      <span className="inline-block mt-1 text-xs text-slate-500">API Endpoint Berjalan Stabil</span>
                    </div>
                  </div>
                </div>
              ) : dbStatus.useMongoDB ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 flex items-start gap-3">
                    <div className="p-2.5 bg-blue-600 text-white rounded-lg shadow-sm">
                      <Database size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">Database Aktif</span>
                      <p className="text-sm font-extrabold text-blue-950 mt-0.5">MongoDB Atlas Cloud</p>
                      <span className="inline-block mt-1 text-xs text-blue-700 font-mono">DB: {dbStatus.databaseName}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-green-50/80 border border-green-200 flex items-start gap-3">
                    <div className="p-2.5 bg-green-600 text-white rounded-lg shadow-sm">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-green-700 uppercase tracking-wider block">Status Koneksi</span>
                      <p className="text-sm font-extrabold text-green-950 mt-0.5 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                        Terhubung & Normal
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-800 block">Migrasi Data</span>
                      <p className="text-xs text-amber-700">Pindahkan data lokal ke cloud</p>
                    </div>
                    <button
                      onClick={handleSyncMongo}
                      disabled={isSyncing}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm"
                    >
                      {isSyncing ? "Memindahkan..." : "Migrasi Data"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0">
                      <AlertTriangle size={20} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm text-amber-950">
                        Status Database: Menggunakan Penyimpanan File Lokal Sementara (JSON)
                      </h3>
                      <p className="text-xs text-amber-800">
                        Server belum terhubung ke MySQL Hostinger. Tambahkan variabel <code>DB_HOST</code>, <code>DB_USER</code>, <code>DB_PASSWORD</code>, dan <code>DB_NAME</code> di file <code>.env</code> Anda.
                      </p>
                      {dbStatus.error && (
                        <p className="text-xs font-mono bg-white/80 p-2 rounded border border-amber-200 text-red-700 break-all mt-1">
                          Pesan Error: {dbStatus.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* COUNTER CARDS: 6 Cards showing Content Items & Total Reader Views */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <BarChart3 size={20} className="text-emerald-700" />
              Statistik Konten & Total Pembaca
            </h2>
            <p className="text-xs text-gray-500">Jumlah item konten publikasi beserta akumulasi pembaca/pengakses</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Berita Terkini */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-md relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-transform">
              <FileText size={100} />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
                    <FileText size={15} /> Berita Terkini
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                    Publikasi
                  </span>
                </div>
                <div className="text-3xl font-black">{visitorStats.news?.count || 0} <span className="text-xs font-semibold text-emerald-200">Artikel</span></div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs">
                <span className="text-emerald-100 flex items-center gap-1 font-semibold">
                  <Eye size={14} /> Total Dibaca
                </span>
                <span className="font-extrabold bg-white/20 px-2 py-0.5 rounded-md">
                  {(visitorStats.news?.totalViews || 0).toLocaleString('id-ID')}x
                </span>
              </div>
            </div>
          </div>

          {/* 2. Galeri Foto */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-5 rounded-2xl shadow-md relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-transform">
              <ImageIcon size={100} />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-100 flex items-center gap-1.5">
                    <ImageIcon size={15} /> Galeri Foto
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                    Dokumentasi
                  </span>
                </div>
                <div className="text-3xl font-black">{visitorStats.photos?.count || 0} <span className="text-xs font-semibold text-indigo-200">Album</span></div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs">
                <span className="text-indigo-100 flex items-center gap-1 font-semibold">
                  <Eye size={14} /> Total Dilihat
                </span>
                <span className="font-extrabold bg-white/20 px-2 py-0.5 rounded-md">
                  {(visitorStats.photos?.totalViews || 0).toLocaleString('id-ID')}x
                </span>
              </div>
            </div>
          </div>

          {/* 3. Agenda Kegiatan */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-5 rounded-2xl shadow-md relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-transform">
              <Calendar size={100} />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-100 flex items-center gap-1.5">
                    <Calendar size={15} /> Agenda Kegiatan
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                    Jadwal
                  </span>
                </div>
                <div className="text-3xl font-black">{visitorStats.agendas?.count || 0} <span className="text-xs font-semibold text-amber-200">Agenda</span></div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs">
                <span className="text-amber-100 flex items-center gap-1 font-semibold">
                  <Eye size={14} /> Total Diakses
                </span>
                <span className="font-extrabold bg-white/20 px-2 py-0.5 rounded-md">
                  {(visitorStats.agendas?.totalViews || 0).toLocaleString('id-ID')}x
                </span>
              </div>
            </div>
          </div>

          {/* 4. Infografis & Pengumuman */}
          <div className="bg-gradient-to-br from-purple-600 to-fuchsia-700 text-white p-5 rounded-2xl shadow-md relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-transform">
              <BarChart3 size={100} />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-100 flex items-center gap-1.5">
                    <BarChart3 size={15} /> Infografis & Pengumuman
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                    Informasi
                  </span>
                </div>
                <div className="text-3xl font-black">{visitorStats.infografis?.count || 0} <span className="text-xs font-semibold text-purple-200">Berkas</span></div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs">
                <span className="text-purple-100 flex items-center gap-1 font-semibold">
                  <Eye size={14} /> Total Dibaca
                </span>
                <span className="font-extrabold bg-white/20 px-2 py-0.5 rounded-md">
                  {(visitorStats.infografis?.totalViews || 0).toLocaleString('id-ID')}x
                </span>
              </div>
            </div>
          </div>

          {/* 5. Galeri Video */}
          <div className="bg-gradient-to-br from-rose-600 to-pink-700 text-white p-5 rounded-2xl shadow-md relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-transform">
              <Video size={100} />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-100 flex items-center gap-1.5">
                    <Video size={15} /> Galeri Video
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                    Multimedia
                  </span>
                </div>
                <div className="text-3xl font-black">{visitorStats.videos?.count || 0} <span className="text-xs font-semibold text-rose-200">Video</span></div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs">
                <span className="text-rose-100 flex items-center gap-1 font-semibold">
                  <Eye size={14} /> Total Diputar
                </span>
                <span className="font-extrabold bg-white/20 px-2 py-0.5 rounded-md">
                  {(visitorStats.videos?.totalViews || 0).toLocaleString('id-ID')}x
                </span>
              </div>
            </div>
          </div>

          {/* 6. Halaman & Link Layanan */}
          <div className="bg-gradient-to-br from-cyan-600 to-blue-700 text-white p-5 rounded-2xl shadow-md relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-transform">
              <Globe size={100} />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-100 flex items-center gap-1.5">
                    <Globe size={15} /> Halaman & Layanan
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                    Portal
                  </span>
                </div>
                <div className="text-3xl font-black">{visitorStats.halaman?.count || 0} <span className="text-xs font-semibold text-cyan-200">Layanan</span></div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs">
                <span className="text-cyan-100 flex items-center gap-1 font-semibold">
                  <Eye size={14} /> Total Dikunjungi
                </span>
                <span className="font-extrabold bg-white/20 px-2 py-0.5 rounded-md">
                  {(visitorStats.halaman?.totalViews || 0).toLocaleString('id-ID')}x
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: Rekam Pengunjung & Cetak Laporan */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <Users size={20} className="text-emerald-700" />
              Laporan & Rekam Jejak Pengunjung
            </h2>
            <p className="text-xs text-gray-500">
              Menampilkan riwayat pembaca postingan terakhir beserta alamat IP dan jenis browser pengunjung.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrintReport}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={15} /> Cetak Laporan Pengunjung
            </button>

            <button
              onClick={() => setShowResetConfirmModal(true)}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={15} /> Reset Data Pengunjung
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tanggal Selesai
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Kategori Konten
            </label>
            <select
              value={contentTypeFilter}
              onChange={(e) => setContentTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
            >
              <option value="semua">Semua Konten</option>
              <option value="Berita">Berita Terkini</option>
              <option value="Foto">Galeri Foto</option>
              <option value="Agenda">Agenda Kegiatan</option>
              <option value="Infografis">Infografis & Pengumuman</option>
              <option value="Video">Galeri Video</option>
              <option value="Halaman">Halaman & Layanan</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Cari Judul / IP / Browser
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Kata kunci..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Tabel Pengunjung Postingan Terakhir */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-gray-200">
                <th className="p-3 w-12 text-center">#</th>
                <th className="p-3">Judul Postingan / Halaman</th>
                <th className="p-3 w-32">Kategori</th>
                <th className="p-3 w-36">Alamat IP</th>
                <th className="p-3 w-48">Browser & OS</th>
                <th className="p-3 w-44 text-right">Waktu Diakses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800">
              {isLoadingLogs ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <div className="inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Memuat data pengunjung...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Belum ada rekam data pengunjung yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="p-3 font-semibold text-gray-900">
                      {item.title || "Halaman Utama Website"}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        item.contentType === 'Berita' ? 'bg-emerald-100 text-emerald-800' :
                        item.contentType === 'Foto' ? 'bg-blue-100 text-blue-800' :
                        item.contentType === 'Agenda' ? 'bg-amber-100 text-amber-800' :
                        item.contentType === 'Infografis' ? 'bg-purple-100 text-purple-800' :
                        item.contentType === 'Video' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {item.contentType || "Halaman"}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-700 flex items-center gap-1.5">
                      <Globe size={12} className="text-slate-400 shrink-0" />
                      {item.ip || "127.0.0.1"}
                    </td>
                    <td className="p-3 text-slate-600 flex items-center gap-1.5">
                      <Monitor size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate max-w-[180px]" title={item.userAgent}>
                        {item.browserOs || item.browser || "Browser Lain"}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-[11px] text-slate-500">
                      {new Date(item.timestamp).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      })} WIB
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
          <span>Menampilkan <strong>{filteredLogs.length}</strong> log akses pengunjung</span>
          <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            {visitorStats.uniqueIps || 0} Alamat IP Unik Terdeteksi
          </span>
        </div>
      </div>

      {/* RESET CONFIRMATION MODAL */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-rose-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={26} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-gray-900 text-lg">Reset Rekam Data Pengunjung?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Pembersihan log dilakukan untuk mengoptimalkan performa dan ruang penyimpanan server. Seluruh log riwayat akses pengunjung akan dikosongkan.
              </p>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold">⚠️ Catatan Penting:</p>
              <p>
                Penghapusan ini hanya membersihkan log lalu lintas pengunjung, dan <strong>tidak menghapus artikel berita, foto, agenda, atau berkas</strong> Anda.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleResetVisitorLogs}
                disabled={isResettingLogs}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isResettingLogs ? "Mereset..." : "Ya, Reset Log"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
