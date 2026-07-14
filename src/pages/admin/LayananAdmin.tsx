import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/db';
import { doc, getDoc, setDoc } from '../../lib/db';
import { toast } from 'sonner';
import RichTextEditor from '../../components/RichTextEditor';
import { 
  Plus, Trash2, Edit2, GraduationCap, BookOpen, Building2, Book, 
  User, Image as ImageIcon, Briefcase, FileText, Loader2, Save, X, Award, Upload
} from 'lucide-react';

// Default values for fallbacks
const defaultLayananData: Record<string, any> = {
  "pendidikan-madrasah": { title: "Pendidikan Madrasah", tugasFungsi: "Data belum tersedia", kasiName: "", kasiPhoto: "", staf: [], syarat: "" },
  "bimas-islam": { title: "Bimbingan Masyarakat Islam", tugasFungsi: "Data belum tersedia", kasiName: "", kasiPhoto: "", staf: [], syarat: "" },
  "pondok-pesantren": { title: "Pendidikan Diniyah & Pondok Pesantren", tugasFungsi: "Data belum tersedia", kasiName: "", kasiPhoto: "", staf: [], syarat: "" },
  "sertifikasi-halal": { title: "Layanan Sertifikasi Halal", tugasFungsi: "Data belum tersedia", kasiName: "", kasiPhoto: "", staf: [], syarat: "" },
  "urusan-agama-islam": { title: "Urusan Agama Islam", tugasFungsi: "Data belum tersedia", kasiName: "", kasiPhoto: "", staf: [], syarat: "" },
  "pendidikan-agama-islam": { title: "Pendidikan Agama Islam", tugasFungsi: "Data belum tersedia", kasiName: "", kasiPhoto: "", staf: [], syarat: "" }
};

interface StafItem {
  id: string;
  name: string;
  role: string;
  photo: string;
}

export default function LayananAdmin() {
  const [activeTab, setActiveTab] = useState('pendidikan-madrasah');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states for selected service
  const [title, setTitle] = useState('');
  const [tugasFungsi, setTugasFungsi] = useState('');
  const [kasiName, setKasiName] = useState('');
  const [kasiPhoto, setKasiPhoto] = useState('');
  const [staf, setStaf] = useState<StafItem[]>([]);
  const [syarat, setSyarat] = useState('');

  // Staf Modal state for adding/editing a staff member
  const [isStafModalOpen, setIsStafModalOpen] = useState(false);
  const [editingStaf, setEditingStaf] = useState<StafItem | null>(null);
  const [stafFormData, setStafFormData] = useState({
    name: '',
    role: '',
    photo: ''
  });
  
  const [uploadingKasi, setUploadingKasi] = useState(false);
  const [uploadingStaf, setUploadingStaf] = useState(false);

  const handleUploadKasi = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB");
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'foto_pejabat');
    
    setUploadingKasi(true);
    toast.info('Mengunggah foto pejabat...');
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        setKasiPhoto(data.url);
        toast.success('Foto pejabat berhasil diunggah');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Gagal mengunggah foto');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat mengunggah');
    } finally {
      setUploadingKasi(false);
      e.target.value = '';
    }
  };

  const handleUploadStaf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB");
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'foto_staf');
    
    setUploadingStaf(true);
    toast.info('Mengunggah foto staf...');
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        setStafFormData(prev => ({ ...prev, photo: data.url }));
        toast.success('Foto staf berhasil diunggah');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Gagal mengunggah foto');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat mengunggah');
    } finally {
      setUploadingStaf(false);
      e.target.value = '';
    }
  };

  const loadLayananData = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'layanan_data', activeTab);
      const docSnap = await getDoc(docRef);

      const fallback = defaultLayananData[activeTab];
      if (docSnap.exists()) {
        const fetched = docSnap.data();
        setTitle(fetched.title || fallback.title);
        setTugasFungsi(fetched.tugasFungsi !== undefined ? fetched.tugasFungsi : fallback.tugasFungsi);
        setKasiName(fetched.kasiName !== undefined ? fetched.kasiName : fallback.kasiName);
        setKasiPhoto(fetched.kasiPhoto !== undefined ? fetched.kasiPhoto : fallback.kasiPhoto);
        setStaf(fetched.staf !== undefined ? fetched.staf : fallback.staf || []);
        setSyarat(fetched.syarat !== undefined ? fetched.syarat : fallback.syarat || '');
      } else {
        setTitle(fallback.title);
        setTugasFungsi(fallback.tugasFungsi || '');
        setKasiName(fallback.kasiName || '');
        setKasiPhoto(fallback.kasiPhoto || '');
        setStaf(fallback.staf || []);
        setSyarat(fallback.syarat || '');
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      toast.error("Gagal mengambil data layanan dari database, menggunakan data bawaan");
      const fallback = defaultLayananData[activeTab];
      setTitle(fallback.title);
      setTugasFungsi(fallback.tugasFungsi || '');
      setKasiName(fallback.kasiName || '');
      setKasiPhoto(fallback.kasiPhoto || '');
      setStaf(fallback.staf || []);
      setSyarat(fallback.syarat || '');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLayananData();
  }, [activeTab]);

  const handleSave = async () => {
    if (!auth.currentUser && localStorage.getItem('mock_admin_session') !== 'true') {
      toast.error('Anda sedang menggunakan Mode Akses Instan. Login untuk menyimpan perubahan.');
      return;
    }
    
    setSaving(true);
    try {
      const docRef = doc(db, 'layanan_data', activeTab);
      await setDoc(docRef, {
        id: activeTab,
        title,
        tugasFungsi,
        kasiName,
        kasiPhoto,
        staf,
        syarat,
        updatedAt: new Date()
      }, { merge: true });

      toast.success('Data layanan berhasil diperbarui!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan data ke database');
    } finally {
      setSaving(false);
    }
  };

  // Staff Management functions
  const handleOpenAddStaf = () => {
    setEditingStaf(null);
    setStafFormData({ name: '', role: '', photo: '' });
    setIsStafModalOpen(true);
  };

  const handleOpenEditStaf = (item: StafItem) => {
    setEditingStaf(item);
    setStafFormData({
      name: item.name,
      role: item.role,
      photo: item.photo
    });
    setIsStafModalOpen(true);
  };

  const handleSaveStaf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stafFormData.name.trim()) {
      toast.error("Nama staf wajib diisi");
      return;
    }

    if (editingStaf) {
      // Edit existing
      setStaf(prev => prev.map(s => s.id === editingStaf.id ? { ...s, ...stafFormData } : s));
      toast.success("Biodata staf diperbarui");
    } else {
      // Add new
      const newStaf: StafItem = {
        id: Date.now().toString(),
        name: stafFormData.name.trim(),
        role: stafFormData.role.trim() || 'Staf Pelaksana',
        photo: stafFormData.photo.trim() || 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&q=80&w=250'
      };
      setStaf(prev => [...prev, newStaf]);
      toast.success("Staf baru ditambahkan");
    }
    setIsStafModalOpen(false);
  };

  const handleDeleteStaf = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus staf ini?")) {
      setStaf(prev => prev.filter(s => s.id !== id));
      toast.success("Staf terhapus dari daftar (klik 'Simpan Perubahan' untuk menerapkan)");
    }
  };

  const tabs = [
    { id: 'pendidikan-madrasah', name: 'Pendidikan Madrasah', icon: GraduationCap },
    { id: 'bimas-islam', name: 'Bimas Islam', icon: BookOpen },
    { id: 'pondok-pesantren', name: 'Pondok Pesantren', icon: Building2 },
    { id: 'sertifikasi-halal', name: 'Sertifikasi Halal', icon: Book },
    { id: 'urusan-agama-islam', name: 'Urusan Agama Islam', icon: Heart },
    { id: 'pendidikan-agama-islam', name: 'Pendidikan Agama Islam (PAIS)', icon: Award }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-green-700" />
            Integrasi Layanan Utama
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Ubah tugas pokok, kepala seksi, syarat, dan tim staf pelaksana untuk setiap bidang layanan utama.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading || saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95"
        >
          {saving ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Save size={16} />
          )}
          Simpan Semua Perubahan
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-2">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-green-700 text-green-700 bg-green-50/50 rounded-t-xl'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TabIcon size={16} />
              {tab.name}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
          <Loader2 className="animate-spin text-green-700" size={28} />
          <span>Memuat formulir layanan...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Title / Judul Bidang */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Nama Bidang Layanan (Header)
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              />
            </div>

            {/* Custom inputs depending on type */}
            {activeTab === 'sertifikasi-halal' ? (
              /* If Sertifikasi Halal, edit Syarat/Alur */
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Deskripsi Lengkap, Alur & Syarat Sertifikasi Halal
                  </label>
                  <span className="text-[10px] text-green-700 font-bold bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                    Mendukung HTML & Formatter
                  </span>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden" style={{ minHeight: '450px' }}>
                  <RichTextEditor value={syarat} onChange={setSyarat} />
                </div>
              </div>
            ) : (
              /* If Madrasah, Bimas, or Pesantren: edit Tugas & Fungsi */
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Tugas Pokok & Fungsi (HTML Editor)
                  </label>
                  <span className="text-[10px] text-green-700 font-bold bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                    Mendukung HTML & Formatter
                  </span>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden" style={{ minHeight: '400px' }}>
                  <RichTextEditor value={tugasFungsi} onChange={setTugasFungsi} />
                </div>
              </div>
            )}

            {/* List of Staff: Only for Madrasah, Bimas, and Pesantren */}
            {activeTab !== 'sertifikasi-halal' && (
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Daftar Staf Pelaksana
                    </label>
                    <p className="text-[10px] text-gray-400 mt-0.5">Kelola tim staf pelaksana yang akan tampil pada carousel foto staf.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddStaf}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-lg text-xs font-bold transition-all"
                  >
                    <Plus size={14} />
                    Tambah Staf
                  </button>
                </div>

                {staf.length === 0 ? (
                  <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
                    Belum ada staf yang terdaftar. Klik "Tambah Staf" untuk mendaftarkan biodata staf baru.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {staf.map((item, idx) => (
                      <div 
                        key={item.id || idx}
                        className="p-3 border border-gray-100 bg-gray-50/50 rounded-xl flex items-center justify-between gap-3 hover:bg-white transition-all hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-200 bg-gray-100">
                            <img 
                              src={item.photo} 
                              alt={item.name} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80&w=250';
                              }}
                            />
                          </div>
                          <div>
                            <h5 className="font-bold text-gray-900 text-xs line-clamp-1">{item.name}</h5>
                            <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{item.role}</p>
                          </div>
                        </div>

                        <div className="flex shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditStaf(item)}
                            className="p-1 hover:bg-gray-100 text-gray-500 hover:text-green-700 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStaf(item.id)}
                            className="p-1 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Kepala Seksi (Kasi) - Skip for Sertifikasi Halal */}
          <div className="space-y-6">
            {activeTab !== 'sertifikasi-halal' ? (
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2">
                  Profil Kepala Seksi (Kasi)
                </label>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                      <User size={12} /> Nama Lengkap Kasi
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: H. Syamsul, S.Ag."
                      value={kasiName}
                      onChange={(e) => setKasiName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                        <ImageIcon size={12} /> URL Foto Kepala Seksi / Pejabat
                      </label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={kasiPhoto}
                        onChange={(e) => setKasiPhoto(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                        &nbsp;
                      </label>
                      <label className={`flex items-center justify-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${uploadingKasi ? 'opacity-70 pointer-events-none' : ''}`}>
                        {uploadingKasi ? (
                           <div className="w-3.5 h-3.5 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                           <Upload size={14} />
                        )}
                        <span>Upload Foto</span>
                        <input
                           type="file"
                           accept="image/*"
                           className="hidden"
                           onChange={handleUploadKasi}
                           disabled={uploadingKasi}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/50 flex flex-col items-center text-center">
                    <p className="text-[10px] text-gray-400 mb-2">Pratinjau Foto Kasi</p>
                    <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-white">
                      <img 
                        src={kasiPhoto} 
                        alt="Kasi" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80&w=300';
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 space-y-2">
                <Book size={24} className="text-amber-700" />
                <h5 className="font-bold text-xs">Informasi Sertifikasi Halal:</h5>
                <p className="text-[11px] text-amber-800 leading-normal">
                  Sertifikasi Halal dikoordinasikan langsung di bawah Badan Penyelenggara Jaminan Produk Halal (BPJPH) Kemenag RI. Detail Kasi tidak dimunculkan karena program ini melayani secara terpadu melalui satgas PTSP.
                </p>
              </div>
            )}

            {/* Quick Helper Panel */}
            <div className="bg-gray-50 border border-gray-200/50 rounded-2xl p-5 space-y-3">
              <h5 className="font-bold text-xs text-gray-700">Petunjuk Editor:</h5>
              <ul className="list-disc pl-4 text-[10px] text-gray-500 space-y-1.5 leading-relaxed">
                <li>Gunakan editor teks TinyMCE di sebelah kiri untuk memformat teks list, cetak tebal (bold), ataupun link pendaftaran.</li>
                <li>Setelah mengubah nama seksi, tugas, kasi, maupun tim staf, pastikan mengklik tombol <strong className="text-green-700">"Simpan Semua Perubahan"</strong> di pojok kanan atas.</li>
                <li>Gunakan tautan gambar yang bersumber dari media repository atau tautan Unsplash beresolusi tinggi.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Staff Add/Edit Modal */}
      {isStafModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                {editingStaf ? 'Edit Biodata Staf' : 'Tambah Staf Baru'}
              </h3>
              <button
                onClick={() => setIsStafModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveStaf} className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <User size={12} /> Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Akhmad Fauzi, S.Kom."
                  value={stafFormData.name}
                  onChange={(e) => setStafFormData({ ...stafFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Briefcase size={12} /> Peran / Jabatan Pelaksana
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pengelola SIMPATIKA"
                  value={stafFormData.role}
                  onChange={(e) => setStafFormData({ ...stafFormData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <ImageIcon size={12} /> URL Foto Staf
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={stafFormData.photo}
                    onChange={(e) => setStafFormData({ ...stafFormData, photo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  />
                  <p className="text-[9px] text-gray-400 mt-0.5">Biarkan kosong untuk foto default.</p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                    &nbsp;
                  </label>
                  <label className={`flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${uploadingStaf ? 'opacity-70 pointer-events-none' : ''}`}>
                    {uploadingStaf ? (
                       <div className="w-3.5 h-3.5 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                       <Upload size={14} />
                    )}
                    <span>Upload</span>
                    <input
                       type="file"
                       accept="image/*"
                       className="hidden"
                       onChange={handleUploadStaf}
                       disabled={uploadingStaf}
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsStafModalOpen(false)}
                  className="px-3.5 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-green-700 text-white rounded-lg text-xs font-bold hover:bg-green-800 transition-all active:scale-95"
                >
                  Simpan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
