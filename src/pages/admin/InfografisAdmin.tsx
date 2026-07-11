import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, query } from '../../lib/firebase';
import { db } from '../../lib/firebase';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, X, Image as ImageIcon, Upload } from 'lucide-react';

interface Infografis {
  id: string;
  title: string;
  image: string;
}

export default function InfografisAdmin() {
  const [data, setData] = useState<Infografis[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: '', title: '', image: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    try {
      const q = query(collection(db, 'infographics'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Infografis));
      setData(docs);
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengambil data infografis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    setUploading(true);
    toast.info("Mengunggah gambar...");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (res.ok) {
        const result = await res.json();
        setFormData({ ...formData, image: result.url });
        toast.success("Gambar berhasil diunggah");
      } else {
        toast.error("Gagal mengunggah gambar");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat mengunggah");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.image) {
      toast.error('Judul dan URL Gambar wajib diisi');
      return;
    }
    
    try {
      if (isEditing) {
        const docRef = doc(db, 'infographics', formData.id);
        await updateDoc(docRef, {
          title: formData.title,
          image: formData.image,
        });
        toast.success('Infografis berhasil diperbarui');
      } else {
        await addDoc(collection(db, 'infographics'), {
          title: formData.title,
          image: formData.image,
          createdAt: serverTimestamp()
        });
        toast.success('Infografis berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat menyimpan data');
    }
  };

  const handleEdit = (item: Infografis) => {
    setFormData(item);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus infografis ini?')) {
      try {
        await deleteDoc(doc(db, 'infographics', id));
        toast.success('Infografis berhasil dihapus');
        fetchData();
      } catch (error) {
        console.error(error);
        toast.error('Gagal menghapus infografis');
      }
    }
  };

  const openAddModal = () => {
    setFormData({ id: '', title: '', image: '' });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className="text-gray-500">Memuat data...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Pengaturan Infografis</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Tambah Data
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {data.length === 0 ? (
          <div className="col-span-full py-10 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
            Belum ada data infografis.
          </div>
        ) : (
          data.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button onClick={() => handleEdit(item)} className="p-2 bg-white text-blue-600 rounded-full hover:bg-blue-50 transition-colors">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50 transition-colors">
                    <Trash2 size={18} />
                  </button>
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
              <h3 className="text-lg font-bold text-gray-900">{isEditing ? 'Edit Infografis' : 'Tambah Infografis'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <form id="infografis-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Judul Infografis</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Infografis</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="Masukkan URL Gambar, upload lokal,  "
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                    <label className="bg-gray-100 hover:bg-gray-200 border border-gray-300 px-3 py-2 rounded-md flex items-center justify-center cursor-pointer transition-colors text-gray-700 text-xs font-semibold whitespace-nowrap">
                      {uploading ? (
                        <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <><Upload size={14} className="mr-1" /> Upload Lokal</>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                    <button
                      type="button"
                      className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    >
                    </button>
                  </div>
                  {formData.image && (
                    <div className="mt-3 aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
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
                form="infografis-form"
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
