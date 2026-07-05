import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, X, Video, Upload } from 'lucide-react';

interface VideoData {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  videoUrl?: string;
}

export default function VideoAdmin() {
  const [data, setData] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [formData, setFormData] = useState({ id: '', title: '', thumbnail: '', duration: '', videoUrl: '' });
  const [isEditing, setIsEditing] = useState(false);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'thumbnail') => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const form = new FormData();
    form.append("file", file);
    
    if (type === 'video') setUploadingVideo(true);
    else setUploadingThumb(true);
    
    toast.info(`Mengunggah ${type === 'video' ? 'video' : 'thumbnail'}...`);
    
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (res.ok) {
        const result = await res.json();
        if (type === 'video') {
          setFormData({ ...formData, videoUrl: result.url, title: formData.title || file.name.split('.').slice(0, -1).join('.') });
        } else {
          setFormData({ ...formData, thumbnail: result.url });
        }
        toast.success(`${type === 'video' ? 'Video' : 'Thumbnail'} berhasil diunggah`);
      } else {
        toast.error("Gagal mengunggah file");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat mengunggah");
    } finally {
      if (type === 'video') setUploadingVideo(false);
      else setUploadingThumb(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.thumbnail) {
      toast.error('Judul dan URL Thumbnail wajib diisi');
      return;
    }
    
    try {
      if (isEditing) {
        const docRef = doc(db, 'videos', formData.id);
        await updateDoc(docRef, {
          title: formData.title,
          thumbnail: formData.thumbnail,
          videoUrl: formData.videoUrl || '',
          duration: formData.duration || '00:00',
        });
        toast.success('Video berhasil diperbarui');
      } else {
        await addDoc(collection(db, 'videos'), {
          title: formData.title,
          thumbnail: formData.thumbnail,
          videoUrl: formData.videoUrl || '',
          duration: formData.duration || '00:00',
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
      thumbnail: item.thumbnail,
      duration: item.duration || '00:00',
      videoUrl: item.videoUrl || '',
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
    setFormData({ id: '', title: '', thumbnail: '', duration: '', videoUrl: '' });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className="text-gray-500">Memuat data...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Galeri Video</h1>
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
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button onClick={() => handleEdit(item)} className="p-2 bg-white text-blue-600 rounded-full hover:bg-blue-50 transition-colors">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
                  {item.duration}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm">{item.title}</h3>
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Berkas Video</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      readOnly
                      value={formData.videoUrl}
                      placeholder="Klik Upload Lokal untuk memilih video"
                      className="flex-1 px-3 py-2 border border-gray-300 bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-500 cursor-not-allowed"
                    />
                    <label className="bg-gray-100 hover:bg-gray-200 border border-gray-300 px-3 py-2 rounded-md flex items-center justify-center cursor-pointer transition-colors text-gray-700 text-xs font-semibold whitespace-nowrap">
                      {uploadingVideo ? (
                        <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <><Upload size={14} className="mr-1" /> Upload Lokal</>
                      )}
                      <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} disabled={uploadingVideo} />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Thumbnail</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      readOnly
                      value={formData.thumbnail}
                      placeholder="Klik Upload Lokal untuk memilih gambar"
                      className="flex-1 px-3 py-2 border border-gray-300 bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-500 cursor-not-allowed"
                    />
                    <label className="bg-gray-100 hover:bg-gray-200 border border-gray-300 px-3 py-2 rounded-md flex items-center justify-center cursor-pointer transition-colors text-gray-700 text-xs font-semibold whitespace-nowrap">
                      {uploadingThumb ? (
                        <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <><Upload size={14} className="mr-1" /> Upload Lokal</>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'thumbnail')} disabled={uploadingThumb} />
                    </label>
                  </div>
                  {formData.thumbnail && (
                    <div className="mt-3 aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      <img src={formData.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (cth: 05:24)</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
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
