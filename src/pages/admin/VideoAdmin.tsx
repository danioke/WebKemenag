import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, query } from '../../lib/db';
import { db } from '../../lib/db';
import { toast } from 'sonner';
import { showAlert, showToast } from '../../lib/swal';
import { Plus, Edit, Trash2, X, Video, Settings2, RefreshCw, Smartphone, Globe, Youtube, Key } from 'lucide-react';
import { getYouTubeThumbnail } from '../../lib/helpers';
import ReactPlayer from 'react-player';
const Player = ReactPlayer as any;

interface VideoData {
  id: string;
  title: string;
  thumbnail?: string;
  duration?: string;
  videoUrl: string;
}

export default function VideoAdmin() {
  const [data, setData] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'api'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Video Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: '', title: '', videoUrl: '', duration: '' });

  // API settings state
  const [apiSettings, setApiSettings] = useState({
    id: '',
    youtubeApiKey: '',
    youtubeChannelId: '',
    tiktokClientKey: '',
    facebookAccessToken: '',
    facebookPageId: ''
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoData));
      setData(docs);
      setCurrentPage(1); // reset to first page on fetch
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengambil data video');
    } finally {
      setLoading(false);
    }
  };

  const fetchApiSettings = async () => {
    try {
      const snap = await getDocs(collection(db, 'video_api_settings'));
      if (snap.docs.length > 0) {
        const d = snap.docs[0];
        setApiSettings({ id: d.id, ...d.data() } as any);
      }
    } catch (err) {
      console.error("Gagal memuat pengaturan API:", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchApiSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.videoUrl) {
      toast.error('Judul dan URL Video wajib diisi');
      return;
    }
    
    try {
      if (isEditing) {
        const docRef = doc(db, 'videos', formData.id);
        await updateDoc(docRef, {
          title: formData.title,
          videoUrl: formData.videoUrl,
          thumbnail: getYouTubeThumbnail(formData.videoUrl),
          duration: formData.duration || '',
        });
        toast.success('Video berhasil diperbarui');
      } else {
        await addDoc(collection(db, 'videos'), {
          title: formData.title,
          videoUrl: formData.videoUrl,
          thumbnail: getYouTubeThumbnail(formData.videoUrl),
          duration: formData.duration || '',
          createdAt: serverTimestamp()
        });
        toast.success('Video berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat menyimpan data');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      if (apiSettings.id) {
        await updateDoc(doc(db, 'video_api_settings', apiSettings.id), {
          youtubeApiKey: apiSettings.youtubeApiKey,
          youtubeChannelId: apiSettings.youtubeChannelId,
          tiktokClientKey: apiSettings.tiktokClientKey,
          facebookAccessToken: apiSettings.facebookAccessToken,
          facebookPageId: apiSettings.facebookPageId
        });
      } else {
        const ref = await addDoc(collection(db, 'video_api_settings'), {
          youtubeApiKey: apiSettings.youtubeApiKey,
          youtubeChannelId: apiSettings.youtubeChannelId,
          tiktokClientKey: apiSettings.tiktokClientKey,
          facebookAccessToken: apiSettings.facebookAccessToken,
          facebookPageId: apiSettings.facebookPageId
        });
        setApiSettings(prev => ({ ...prev, id: ref.id }));
      }
      toast.success('Pengaturan API Media Sosial berhasil disimpan!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan pengaturan API');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSyncVideos = async () => {
    setIsSyncing(true);
    setSyncLogs(['Menghubungkan ke server...', 'Memuat kredensial API...']);
    toast.info('Memulai sinkronisasi video otomatis dari API...');
    
    try {
      const res = await fetch('/api/videos/auto-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        const result = await res.json();
        setSyncLogs(result.logs || []);
        if (result.fetchedCount > 0) {
          toast.success(`Sinkronisasi Berhasil! Mengimpor ${result.fetchedCount} video baru.`);
          fetchData();
        } else {
          toast.success('Sinkronisasi selesai. Seluruh video media sosial Anda sudah mutakhir.');
        }
      } else {
        toast.error('Gagal menjalankan sinkronisasi video otomatis.');
        setSyncLogs(['Koneksi API Gagal. Periksa kembali API settings Anda.']);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Kesalahan koneksi sinkronisasi');
      setSyncLogs([`Kesalahan jaringan: ${err.message}`]);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEdit = (item: VideoData) => {
    setFormData({
      id: item.id,
      title: item.title,
      videoUrl: item.videoUrl || '',
      duration: item.duration || '',
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showAlert.confirm(
      'Hapus Video?',
      'Apakah Anda yakin ingin menghapus galeri video ini?'
    );
    if (confirmed) {
      try {
        await deleteDoc(doc(db, 'videos', id));
        showToast.success('Video berhasil dihapus');
        fetchData();
      } catch (error) {
        console.error(error);
        showAlert.error('Gagal', 'Gagal menghapus video');
      }
    }
  };

  const openAddModal = () => {
    setFormData({ id: '', title: '', videoUrl: '', duration: '' });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const renderPreview = (url: string) => {
    if (!url) return null;
    
    // Google Drive
    const gDriveMatch = url.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]{25,})/);
    if (gDriveMatch && gDriveMatch[1]) {
      return (
        <iframe 
          src={`https://drive.google.com/file/d/${gDriveMatch[1]}/preview`} 
          className="w-full h-full border-0 pointer-events-none" 
          allowFullScreen
        />
      );
    }

    // TikTok
    if (url.includes('tiktok.com')) {
      const videoIdMatch = url.match(/\/video\/(\d+)/);
      if (videoIdMatch && videoIdMatch[1]) {
        return (
          <iframe 
            src={`https://www.tiktok.com/embed/v2/${videoIdMatch[1]}`} 
            className="w-full h-full border-0 pointer-events-none" 
            allowFullScreen
          />
        );
      }
      return <div className="p-4 text-center text-sm text-gray-500 bg-black/80 w-full h-full flex items-center justify-center">Gunakan link TikTok lengkap.</div>;
    }

    // Facebook
    if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.gg')) {
      const embedSrc = url.includes('facebook.com/plugins/video.php')
        ? url
        : `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=false`;
      return (
        <iframe 
          src={embedSrc}
          className="w-full h-full border-0 pointer-events-none"
          allowFullScreen
        />
      );
    }

    return (
      <div className="w-full h-full pointer-events-none bg-black">
        <Player 
          url={url} 
          width="100%" 
          height="100%" 
          controls={false}
          light={false}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Galeri Video Media Sosial</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ubah layout menjadi Carousel di beranda, sinkronisasi otomatis menggunakan API, atau tambahkan link video secara manual.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'list' ? 'bg-white text-green-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Video size={14} /> Daftar Video
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'api' ? 'bg-white text-green-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Settings2 size={14} /> Integrasi & API Settings
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <>
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-gray-800 text-sm">Semua Video Aktif ({data.length})</h2>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <Plus size={14} /> Tambah Video Manual
            </button>
          </div>

          {loading ? (
            <div className="text-gray-400 py-10 text-center text-sm">Memuat video...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.length === 0 ? (
                  <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    Belum ada data video. Silakan tambahkan manual atau lakukan Ambil Otomatis di tab API Settings.
                  </div>
                ) : (
                  data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group flex flex-col h-full">
                      <div className="aspect-video bg-black relative overflow-hidden flex items-center justify-center shrink-0">
                        {renderPreview(item.videoUrl || '')}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                          <button onClick={() => handleEdit(item)} className="p-2 bg-white text-blue-600 rounded-full hover:bg-blue-50 transition-colors cursor-pointer">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50 transition-colors cursor-pointer">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="p-4 flex-grow flex flex-col justify-between">
                        <h3 className="font-bold text-gray-900 line-clamp-2 text-sm leading-snug">{item.title}</h3>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono truncate max-w-[200px]" title={item.videoUrl}>
                            {item.videoUrl}
                          </span>
                          {item.duration && (
                            <span className="text-[10px] font-bold text-gray-400">{item.duration}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination Controls */}
              {Math.ceil(data.length / itemsPerPage) > 1 && (
                <div className="mt-8 flex justify-center items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sebelumnya
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.ceil(data.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors ${
                          currentPage === page 
                            ? 'bg-green-700 text-white shadow-sm' 
                            : 'border border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(data.length / itemsPerPage), prev + 1))}
                    disabled={currentPage === Math.ceil(data.length / itemsPerPage)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Berikutnya
                  </button>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2 space-y-6">
            <div>
              <h2 className="font-bold text-gray-800 text-lg">Koneksi API Platform Sosial Media</h2>
              <p className="text-xs text-gray-500 mt-1">
                Masukkan pengaturan API agar video yang Anda unggah di YouTube, TikTok, dan Facebook otomatis disinkronkan ke website ini.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              {/* YouTube Credentials */}
              <div className="border border-gray-100 rounded-xl p-4 space-y-4 bg-gray-50/50">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <Youtube className="text-red-600" size={16} />
                  YouTube Channel Sync
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">YouTube API Key</label>
                    <input
                      type="password"
                      value={apiSettings.youtubeApiKey}
                      onChange={(e) => setApiSettings({ ...apiSettings, youtubeApiKey: e.target.value })}
                      placeholder="AIzaSy..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Channel ID</label>
                    <input
                      type="text"
                      value={apiSettings.youtubeChannelId}
                      onChange={(e) => setApiSettings({ ...apiSettings, youtubeChannelId: e.target.value })}
                      placeholder="UC..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* TikTok Credentials */}
              <div className="border border-gray-100 rounded-xl p-4 space-y-4 bg-gray-50/50">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <Smartphone className="text-pink-600" size={16} />
                  TikTok Business API
                </h3>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">TikTok Client Key / Access Token</label>
                  <input
                    type="password"
                    value={apiSettings.tiktokClientKey}
                    onChange={(e) => setApiSettings({ ...apiSettings, tiktokClientKey: e.target.value })}
                    placeholder="Masukkan token akses developer TikTok..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                  />
                </div>
              </div>

              {/* Facebook Page Credentials */}
              <div className="border border-gray-100 rounded-xl p-4 space-y-4 bg-gray-50/50">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <Globe className="text-blue-600" size={16} />
                  Facebook Page Sync
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Page ID</label>
                    <input
                      type="text"
                      value={apiSettings.facebookPageId}
                      onChange={(e) => setApiSettings({ ...apiSettings, facebookPageId: e.target.value })}
                      placeholder="ID Halaman Facebook Anda..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Page Access Token</label>
                    <input
                      type="password"
                      value={apiSettings.facebookAccessToken}
                      onChange={(e) => setApiSettings({ ...apiSettings, facebookAccessToken: e.target.value })}
                      placeholder="EAA..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl text-sm transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSavingSettings ? 'Menyimpan...' : 'Simpan Kredensial API'}
                </button>
              </div>
            </form>
          </div>

          {/* Sync Trigger Action and Logs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between h-fit gap-6">
            <div className="space-y-4">
              <h2 className="font-bold text-gray-800 text-base">Sinkronisasi Otomatis</h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                Tarik video Youtube dan Facebook secara langsung tanpa menyalin dan menempelkan tautan secara manual.
              </p>
              
              <button
                onClick={handleSyncVideos}
                disabled={isSyncing}
                className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    Menarik Video Medsos...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Ambil Video Otomatis
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wider">Log Penarikan Terakhir</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-xl font-mono text-[11px] h-[180px] overflow-y-auto space-y-1.5 scrollbar-thin">
                {syncLogs.length === 0 ? (
                  <span className="text-gray-500 italic">Siap menjalankan sinkronisasi.</span>
                ) : (
                  syncLogs.map((log, index) => (
                    <div key={index} className="leading-normal">
                      <span className="text-amber-400 font-bold">&gt;</span> {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add / Edit Video Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative flex flex-col">
            <div className="bg-green-800 text-white p-5 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg">{isEditing ? 'Edit Tautan Video' : 'Tambah Video Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Judul Video</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Pembinaan ASN Humas Kemenag OKI"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Tautan Video Media Sosial (URL)</label>
                <input
                  type="text"
                  required
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://www.tiktok.com/@humas_oki/video/... atau YouTube"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all"
                />
                <p className="text-[10px] text-gray-400 mt-1">Mendukung tautan resmi TikTok, Facebook, YouTube, atau Google Drive.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Durasi Video (Opsional)</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="Contoh: 02:45"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 focus:bg-white transition-all"
                />
              </div>

              {/* Hidden Player to Auto Fetch Duration */}
              <div className="hidden">
                {formData.videoUrl && !formData.videoUrl.includes('tiktok.com') && (
                  <Player 
                    url={formData.videoUrl} 
                    playing={true} muted={true}
                    onDuration={(dur: number) => {
                      const mins = Math.floor(dur / 60);
                      const secs = Math.floor(dur % 60);
                      const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                      if (formatted !== formData.duration) {
                        setFormData(prev => ({ ...prev, duration: formatted }));
                      }
                    }}
                    width="0"
                    height="0"
                  />
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Simpan Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
