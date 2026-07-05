import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, X, Tag } from 'lucide-react';

interface Kategori {
  id: string;
  name: string;
}

export default function KategoriAdmin() {
  const [data, setData] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '' });
  const [isEditing, setIsEditing] = useState(false);

  const fetchData = async () => {
    try {
      const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Kategori[];
      setData(items);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error('Gagal memuat data kategori');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Nama kategori harus diisi');
      return;
    }

    try {
      if (isEditing) {
        await updateDoc(doc(db, 'categories', formData.id), {
          name: formData.name,
          updatedAt: serverTimestamp()
        });
        toast.success('Kategori berhasil diperbarui');
      } else {
        await addDoc(collection(db, 'categories'), {
          name: formData.name,
          createdAt: serverTimestamp()
        });
        toast.success('Kategori berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(isEditing ? 'Gagal memperbarui kategori' : 'Gagal menambahkan kategori');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
      try {
        await deleteDoc(doc(db, 'categories', id));
        toast.success('Kategori berhasil dihapus');
        fetchData();
      } catch (error) {
        toast.error('Gagal menghapus kategori');
      }
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({ id: '', name: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Kategori) => {
    setIsEditing(true);
    setFormData(item);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-lg text-green-700">
            <Tag size={20} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Pengaturan Kategori</h2>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={18} /> Tambah Kategori
        </button>
      </div>

      <div className="p-6">
        {data.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Tag size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Belum ada kategori</p>
            <p className="text-sm text-gray-400 mt-1">Klik tombol tambah untuk membuat kategori baru</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.map((item) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:border-green-300 hover:shadow-sm transition-all group">
                <span className="font-medium text-gray-800">{item.name}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">{isEditing ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kategori</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Misal: Pendidikan, Keagamaan..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
