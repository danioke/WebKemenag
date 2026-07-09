import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, query } from '../../lib/firebase';
import { db } from '../../lib/firebase';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, X, Video } from 'lucide-react';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: '', title: '', videoUrl: '', duration: '' });

  const fetchData = async () => {
    try {
      const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoData));
      setData(docs);
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengambil data video');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
          duration: formData.duration || '',
        });
        toast.success('Video berhasil diperbarui');
      } else {
        await addDoc(collection(db, 'videos'), {
          title: formData.title,
          videoUrl: formData.videoUrl,
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
    if (window.confirm('Apakah Anda yakin ingin menghapus video ini?')) {
      try {
        await deleteDoc(doc(db, 'videos', id));
        toast.success('Video berhasil dihapus');
        fetchData();
      } catch (error) {
        console.error(error);
        toast.error('Gagal menghapus video');
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
      return <div className="p-4 text-center text-sm text-gray-500 bg-black/80 w-full h-full flex items-center justify-center">Gunakan link TikTok lengkap (berisi /video/ID).</div>;
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

  if (loading) return <div className="text-gray-500">Memuat data...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Galeri Video Medsos</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Tambah Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.length === 0 ? (
          <div className="col-span-full py-10 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
            Belum ada data video.
          </div>
        ) : (
          data.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
              <div className="aspect-[9/16] max-h-[400px] bg-black relative overflow-hidden flex items-center justify-center">
                {renderPreview(item.videoUrl || item.thumbnail || '')}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-10">
                  <button onClick={() => handleEdit(item)} className="p-2 bg-white text-blue-600 rounded-full hover:bg-blue-50 transition-colors pointer-events-auto">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50 transition-colors pointer-events-auto">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="p-4 border-t border-gray-100">
                <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm">{item.title}</h3>
                <p className="text-xs text-gray-500 mt-1 truncate">{item.videoUrl}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-bold text-gray-900">{isEditing ? 'Edit Video' : 'Tambah Video'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <form id="video-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Judul Video</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Contoh: Kegiatan Hari Santri 2024"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tautan Video Medsos</label>
                  <div className="flex items-center gap-2 relative">
                    <div className="absolute left-3 text-gray-400">
                      <Video size={16} />
                    </div>
                    <input
                      type="url"
                      required
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      placeholder="https://www.tiktok.com/@user/video/... atau YouTube"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Masukkan link video YouTube, TikTok, Facebook, dll.</p>
                </div>

                <div className="hidden">
                  {/* Hidden player to fetch duration */}
                  {formData.videoUrl && !formData.videoUrl.includes('tiktok.com') && (
                     
        <Player 
                       url={formData.videoUrl} 
                       playing={false}
                       onDuration={(dur) => {
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
              </form>
            </div>
            
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="video-form"
                className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 text-sm font-medium transition-colors"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
