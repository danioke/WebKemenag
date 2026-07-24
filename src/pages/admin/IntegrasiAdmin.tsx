import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  query, 
  orderBy 
} from '../../lib/db';
import { db } from '../../lib/db';
import { toast } from 'sonner';
import { showAlert, showToast } from '../../lib/swal';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Search, 
  Filter, 
  Globe, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Upload, 
  Image as ImageIcon, 
  RefreshCw, 
  Eye, 
  Sparkles, 
  Link2, 
  LayoutGrid, 
  List,
  Layers,
  ArrowUpDown,
  ShieldCheck,
  Server
} from 'lucide-react';
import MediaPickerModal from '../../components/MediaPickerModal';

export interface IntegrasiItem {
  id: string;
  name: string;
  desc: string;
  url: string;
  color: string;
  logo: string;
  logoImage?: string;
  category: string;
  status: 'active' | 'inactive';
  order: number;
  openInNewTab: boolean;
  createdAt?: any;
  updatedAt?: any;
}

const PRESET_COLORS = [
  { name: 'Blue', value: 'bg-blue-600', preview: '#2563eb' },
  { name: 'Emerald', value: 'bg-emerald-600', preview: '#059669' },
  { name: 'Orange', value: 'bg-orange-500', preview: '#f97316' },
  { name: 'Indigo', value: 'bg-indigo-600', preview: '#4f46e5' },
  { name: 'Teal', value: 'bg-teal-600', preview: '#0d9488' },
  { name: 'Green', value: 'bg-green-700', preview: '#15803d' },
  { name: 'Rose', value: 'bg-rose-600', preview: '#e11d48' },
  { name: 'Purple', value: 'bg-purple-600', preview: '#9333ea' },
  { name: 'Amber', value: 'bg-amber-600', preview: '#d97706' },
  { name: 'Cyan', value: 'bg-cyan-600', preview: '#0891b2' },
  { name: 'Slate', value: 'bg-slate-700', preview: '#334155' },
];

const CATEGORIES = [
  'Keagamaan',
  'Kepegawaian',
  'Pendidikan',
  'Pelayanan Nikah',
  'Jaminan Halal',
  'Keuangan & BMN',
  'Umum'
];

const DEFAULT_INTEGRASI: Omit<IntegrasiItem, 'id'>[] = [
  { name: "Pusaka", desc: "Super App Kemenag RI", color: "bg-blue-600", logo: "P", url: "https://pusaka.kemenag.go.id", category: "Keagamaan", status: "active", order: 1, openInNewTab: true },
  { name: "SIMPEG 5", desc: "Sistem Informasi Kepegawaian", color: "bg-emerald-600", logo: "S", url: "https://simpeg.kemenag.go.id", category: "Kepegawaian", status: "active", order: 2, openInNewTab: true },
  { name: "EMIS 4.0", desc: "Data Pokok Pendidikan Islam", color: "bg-orange-500", logo: "E", url: "https://emis.kemenag.go.id", category: "Pendidikan", status: "active", order: 3, openInNewTab: true },
  { name: "SIAGA", desc: "Sistem Informasi & Administrasi Guru Agama", color: "bg-indigo-600", logo: "S", url: "https://siagagtk.com", category: "Pendidikan", status: "active", order: 4, openInNewTab: true },
  { name: "Simkah Gen 4", desc: "Sistem Informasi Manajemen Nikah", color: "bg-teal-600", logo: "S", url: "https://simkah.kemenag.go.id", category: "Pelayanan Nikah", status: "active", order: 5, openInNewTab: true },
  { name: "Sihalal", desc: "Sistem Informasi Halal (BPJPH)", color: "bg-green-700", logo: "S", url: "https://ptts.halal.go.id", category: "Jaminan Halal", status: "active", order: 6, openInNewTab: true },
  { name: "Simpatika", desc: "Sistem Informasi Pendidik & Tenaga Kependidikan", color: "bg-rose-600", logo: "S", url: "https://simpatika.kemenag.go.id", category: "Pendidikan", status: "active", order: 7, openInNewTab: true },
  { name: "E-Literasi (ELIT)", desc: "Sistem Informasi Perpustakaan & E-Literasi", color: "bg-purple-600", logo: "E", url: "https://kemenag.go.id", category: "Umum", status: "active", order: 8, openInNewTab: true },
];

export default function IntegrasiAdmin() {
  const [data, setData] = useState<IntegrasiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const [formData, setFormData] = useState<Partial<IntegrasiItem>>({
    name: '',
    desc: '',
    url: '',
    color: 'bg-blue-600',
    logo: 'A',
    logoImage: '',
    category: 'Keagamaan',
    status: 'active',
    order: 1,
    openInNewTab: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'integrasi_sistem'), orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      let items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as IntegrasiItem[];

      // Auto seed default data if empty
      if (items.length === 0) {
        console.log("Seeding default integrasi_sistem data...");
        for (const defaultItem of DEFAULT_INTEGRASI) {
          await addDoc(collection(db, 'integrasi_sistem'), {
            ...defaultItem,
            createdAt: serverTimestamp()
          });
        }
        // Re-fetch after seeding
        const snapshotAfterSeed = await getDocs(q);
        items = snapshotAfterSeed.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as IntegrasiItem[];
      }

      setData(items);
    } catch (error) {
      console.error("Error fetching integrasi_sistem:", error);
      toast.error('Gagal memuat data integrasi sistem');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setFormData({
      name: '',
      desc: '',
      url: 'https://',
      color: 'bg-blue-600',
      logo: 'A',
      logoImage: '',
      category: 'Keagamaan',
      status: 'active',
      order: data.length + 1,
      openInNewTab: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: IntegrasiItem) => {
    setIsEditing(true);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      toast.error('Nama aplikasi harus diisi!');
      return;
    }
    if (!formData.url?.trim() || formData.url === 'https://') {
      toast.error('URL aplikasi tidak boleh kosong!');
      return;
    }

    try {
      const itemLogo = formData.logo?.trim() || formData.name.charAt(0).toUpperCase() || 'A';

      const payload = {
        name: formData.name.trim(),
        desc: formData.desc?.trim() || '',
        url: formData.url.trim(),
        color: formData.color || 'bg-blue-600',
        logo: itemLogo,
        logoImage: formData.logoImage || '',
        category: formData.category || 'Umum',
        status: formData.status || 'active',
        order: Number(formData.order) || 1,
        openInNewTab: formData.openInNewTab ?? true,
        updatedAt: serverTimestamp()
      };

      if (isEditing && formData.id) {
        await updateDoc(doc(db, 'integrasi_sistem', formData.id), payload);
        toast.success('Data sistem terintegrasi berhasil diperbarui');
      } else {
        await addDoc(collection(db, 'integrasi_sistem'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        toast.success('Sistem terintegrasi baru berhasil ditambahkan');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error saving integrasi item:", error);
      toast.error('Gagal menyimpan data integrasi sistem: ' + (error?.message || 'Error server'));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await showAlert.confirm(
      'Hapus Aplikasi Terintegrasi?',
      `Apakah Anda yakin ingin menghapus "${name}" dari daftar integrasi sistem?`
    );

    if (confirmed) {
      try {
        await deleteDoc(doc(db, 'integrasi_sistem', id));
        showToast.success(`"${name}" berhasil dihapus`);
        fetchData();
      } catch (error) {
        showAlert.error('Gagal Hapus', 'Terjadi kesalahan saat menghapus data.');
      }
    }
  };

  const handleToggleStatus = async (item: IntegrasiItem) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    try {
      await updateDoc(doc(db, 'integrasi_sistem', item.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      toast.success(`Status ${item.name} diubah menjadi ${newStatus === 'active' ? 'Aktif' : 'Nonaktif'}`);
      fetchData();
    } catch (error) {
      toast.error('Gagal memperbarui status');
    }
  };

  const handleResetDefaults = async () => {
    const confirmed = await showAlert.confirm(
      'Reset ke Data Default?',
      'Tindakan ini akan mengembalikan daftar aplikasi ke 8 aplikasi standar Kemenag RI (Pusaka, SIMPEG, EMIS, SIAGA, Simkah, Sihalal, Simpatika, Elit).'
    );

    if (confirmed) {
      try {
        setLoading(true);
        // Delete all current docs
        const q = query(collection(db, 'integrasi_sistem'));
        const snapshot = await getDocs(q);
        for (const document of snapshot.docs) {
          await deleteDoc(doc(db, 'integrasi_sistem', document.id));
        }

        // Add defaults
        for (const defaultItem of DEFAULT_INTEGRASI) {
          await addDoc(collection(db, 'integrasi_sistem'), {
            ...defaultItem,
            createdAt: serverTimestamp()
          });
        }

        toast.success('Daftar aplikasi berhasil direset ke standar default!');
        fetchData();
      } catch (error) {
        toast.error('Gagal mereset data default');
      } finally {
        setLoading(false);
      }
    }
  };

  // Filtered items
  const filteredData = data.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.desc.toLowerCase().includes(search.toLowerCase()) ||
      item.url.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalCount = data.length;
  const activeCount = data.filter(i => i.status === 'active').length;
  const inactiveCount = data.filter(i => i.status === 'inactive').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-800 via-green-900 to-emerald-950 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-10 pointer-events-none">
          <Server size={220} />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-green-200 mb-3 border border-white/20">
            <Globe size={14} className="text-amber-400" />
            Integrasi Sistem & Layanan Aplikasi
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Kelola Layanan Aplikasi Terintegrasi
          </h1>
          <p className="text-green-100/90 text-sm md:text-base mt-2 leading-relaxed">
            Atur dan kelola tautan sistem aplikasi external Kemenag OKI (Pusaka, SIMPEG, EMIS, Simkah, Sihalal, dll) yang ditampilkan di slider carousel halaman utama website.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-green-950 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer text-sm"
            >
              <Plus size={18} />
              Tambah Aplikasi Baru
            </button>

            <button
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl border border-white/20 backdrop-blur-md transition-all cursor-pointer text-sm"
              title="Kembalikan daftar ke data default Kemenag"
            >
              <RefreshCw size={16} />
              Reset Default
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Aplikasi</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
            <Layers size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status Aktif</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nonaktif</p>
            <h3 className="text-2xl font-bold text-gray-400 mt-1">{inactiveCount}</h3>
          </div>
          <div className="w-12 h-12 bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center font-bold">
            <XCircle size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori</p>
            <h3 className="text-2xl font-bold text-green-700 mt-1">{CATEGORIES.length}</h3>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-700 rounded-xl flex items-center justify-center font-bold">
            <Globe size={22} />
          </div>
        </div>
      </div>

      {/* Control Toolbar (Search, Filters, View Mode) */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama, deskripsi, atau URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs">
            <Filter size={14} className="text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-gray-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-gray-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif Dipublikasi</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>

          {/* View Switcher */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 ml-auto md:ml-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-green-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
              title="Tampilan Tabel Detail"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-green-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
              title="Tampilan Grid Card Preview"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700 mx-auto"></div>
          <p className="text-gray-500 text-sm mt-4 font-medium">Memuat data integrasi sistem...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Tidak ada aplikasi yang ditemukan</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
            {search || selectedCategory !== 'all' || selectedStatus !== 'all'
              ? 'Tidak ada aplikasi yang sesuai dengan filter pencarian Anda.'
              : 'Belum ada data aplikasi terintegrasi. Klik tombol di bawah untuk menambah.'}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-xl shadow transition-all cursor-pointer"
          >
            <Plus size={16} />
            Tambah Aplikasi
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-center w-12">Urutan</th>
                  <th className="py-3.5 px-4">Aplikasi & Logo</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Tautan URL</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right pr-6">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition-colors group">
                    <td className="py-4 px-4 text-center font-bold text-gray-600 text-xs">
                      <span className="w-7 h-7 rounded-lg bg-gray-100 inline-flex items-center justify-center border border-gray-200">
                        {item.order}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {item.logoImage ? (
                          <div className="w-11 h-11 rounded-xl overflow-hidden border border-gray-200 shadow-sm shrink-0 bg-white">
                            <img 
                              src={item.logoImage} 
                              alt={item.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div className={`w-11 h-11 ${item.color || 'bg-green-700'} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0`}>
                            {item.logo || item.name.charAt(0)}
                          </div>
                        )}

                        <div>
                          <h4 className="font-bold text-gray-900 group-hover:text-green-800 transition-colors">
                            {item.name}
                          </h4>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5 max-w-xs">
                            {item.desc || 'Tidak ada deskripsi'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                        {item.category || 'Umum'}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline max-w-xs truncate"
                      >
                        <Link2 size={13} className="shrink-0" />
                        <span className="truncate">{item.url}</span>
                        <ExternalLink size={12} className="shrink-0 opacity-60" />
                      </a>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                          item.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                        }`}
                        title="Klik untuk mengubah status"
                      >
                        {item.status === 'active' ? (
                          <>
                            <CheckCircle2 size={12} />
                            Aktif
                          </>
                        ) : (
                          <>
                            <XCircle size={12} />
                            Nonaktif
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-4 px-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Aplikasi"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Aplikasi"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARD PREVIEW VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredData.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl p-5 border transition-all relative flex flex-col justify-between group ${
                item.status === 'active'
                  ? 'border-gray-200 hover:shadow-lg hover:-translate-y-1'
                  : 'border-gray-200 bg-gray-50/60 opacity-60'
              }`}
            >
              {/* Top Badge & Status Toggle */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                  #{item.order} • {item.category}
                </span>

                <button
                  onClick={() => handleToggleStatus(item)}
                  className={`p-1 rounded-full transition-colors cursor-pointer ${
                    item.status === 'active' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-200'
                  }`}
                  title={item.status === 'active' ? 'Status: Aktif' : 'Status: Nonaktif'}
                >
                  {item.status === 'active' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                </button>
              </div>

              {/* Logo & Info */}
              <div className="flex flex-col items-center text-center my-2">
                {item.logoImage ? (
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-200 shadow-sm mb-3 bg-white p-1">
                    <img src={item.logoImage} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                  </div>
                ) : (
                  <div className={`w-16 h-16 ${item.color || 'bg-blue-600'} rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-3 shadow-md group-hover:scale-105 transition-transform`}>
                    {item.logo || item.name.charAt(0)}
                  </div>
                )}

                <h4 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors text-base">
                  {item.name}
                </h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                  {item.desc || 'Tidak ada deskripsi'}
                </p>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between text-xs">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-green-700 hover:text-green-900 hover:underline"
                >
                  Buka Link <ExternalLink size={12} />
                </a>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-xl overflow-hidden my-8">
            <div className="bg-green-800 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">
                  {isEditing ? 'Edit Aplikasi Terintegrasi' : 'Tambah Aplikasi Terintegrasi'}
                </h3>
                <p className="text-xs text-green-200 mt-0.5">
                  Isi data aplikasi external yang akan ditampilkan pada slider carousel.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Nama Aplikasi */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Nama Aplikasi / Sistem <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PUSAKA, SIMPEG 5, EMIS 4.0"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white font-medium"
                />
              </div>

              {/* Deskripsi Singkat */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Deskripsi Singkat / Subtitle
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Super App Kementerian Agama RI"
                  value={formData.desc || ''}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                />
              </div>

              {/* URL Aplikasi */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Tautan URL Aplikasi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="url"
                    required
                    placeholder="https://pusaka.kemenag.go.id"
                    value={formData.url || ''}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* Row: Kategori & Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Kategori Sistem
                  </label>
                  <select
                    value={formData.category || 'Umum'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white font-medium cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Urutan Tampilan
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.order || 1}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white font-bold"
                  />
                </div>
              </div>

              {/* Logo Style Section */}
              <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 space-y-4">
                <h4 className="font-bold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-500" /> Style Logo & Warna Badge
                </h4>

                {/* Preset Color Picker */}
                <div>
                  <label className="block text-xs text-gray-600 mb-2">Pilih Warna Background Card / Accent</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((col) => (
                      <button
                        type="button"
                        key={col.value}
                        onClick={() => setFormData({ ...formData, color: col.value })}
                        className={`w-8 h-8 rounded-xl transition-all cursor-pointer border-2 flex items-center justify-center text-white text-xs font-bold ${
                          formData.color === col.value ? 'border-green-800 scale-110 shadow-md ring-2 ring-green-600/30' : 'border-transparent opacity-80 hover:opacity-100'
                        } ${col.value}`}
                        title={col.name}
                      >
                        {formData.color === col.value && '✓'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo Letter vs Logo Image */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Singkatan / Inisial Huruf Logo</label>
                    <input
                      type="text"
                      maxLength={3}
                      placeholder="P"
                      value={formData.logo || ''}
                      onChange={(e) => setFormData({ ...formData, logo: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold text-center tracking-widest focus:ring-2 focus:ring-green-600"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Ditampilkan bila tidak menggunakan gambar logo.</p>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">URL Gambar Logo (Opsional)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://.../logo.png"
                        value={formData.logoImage || ''}
                        onChange={(e) => setFormData({ ...formData, logoImage: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-green-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowMediaPicker(true)}
                        className="px-3 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-medium shrink-0 flex items-center gap-1 cursor-pointer shadow-sm"
                        title="Pilih dari Galeri Media"
                      >
                        <ImageIcon size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Card Preview Box */}
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-2">Pratinjau Tampilan Card:</span>
                  <div className="flex items-center justify-center p-4 bg-gray-100 rounded-xl border border-dashed border-gray-300">
                    <div className="flex flex-col items-center justify-center w-56 p-5 bg-white rounded-2xl shadow-sm border border-gray-200">
                      {formData.logoImage ? (
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-gray-200 shadow-sm mb-3 bg-white p-1">
                          <img src={formData.logoImage} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                        </div>
                      ) : (
                        <div className={`w-14 h-14 ${formData.color || 'bg-blue-600'} rounded-2xl flex items-center justify-center text-white font-bold text-xl mb-3 shadow-sm`}>
                          {formData.logo || (formData.name ? formData.name.charAt(0).toUpperCase() : 'A')}
                        </div>
                      )}
                      <h4 className="font-bold text-gray-900 text-sm text-center">{formData.name || 'Nama Aplikasi'}</h4>
                      <p className="text-xs text-gray-500 mt-1 text-center line-clamp-1">{formData.desc || 'Deskripsi singkat'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Tab Option */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.status === 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                  />
                  Publikasikan (Status Aktif)
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.openInNewTab ?? true}
                    onChange={(e) => setFormData({ ...formData, openInNewTab: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                  />
                  Buka Link di Tab Baru
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-sm shadow-md transition-colors cursor-pointer"
                >
                  {isEditing ? 'Simpan Perubahan' : 'Tambah Aplikasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <MediaPickerModal
          onSelect={(url) => {
            setFormData({ ...formData, logoImage: url });
            setShowMediaPicker(false);
            toast.success('Logo dari galeri berhasil dipilih');
          }}
          onClose={() => setShowMediaPicker(false)}
        />
      )}
    </div>
  );
}
