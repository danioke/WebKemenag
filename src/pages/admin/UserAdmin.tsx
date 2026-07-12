import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/db';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from '../../lib/db';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Users, Search, Mail, UserCheck, Shield, X, Check, Loader2 } from 'lucide-react';

interface AllowedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt?: any;
}

export default function UserAdmin() {
  const [users, setUsers] = useState<AllowedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AllowedUser | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'Admin'
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    
    // If not signed in (Bypass mode), do not attempt to fetch from Firestore to avoid permission errors
    if (!auth.currentUser) {
      setUsers([
        { id: '1', name: 'Super Admin (Anis Reza)', email: 'anisreza498@gmail.com', role: 'Super Admin' },
        { id: '2', name: 'Contoh User Admin', email: 'admin@contoh.com', role: 'Admin' }
      ]);
      setLoading(false);
      return;
    }
    
    try {
      const q = query(collection(db, 'allowed_users'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list: AllowedUser[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          email: data.email || '',
          name: data.name || '',
          role: data.role || 'Admin',
          createdAt: data.createdAt
        });
      });
      setUsers(list);
    } catch (error) {
      console.error("Gagal mengambil data user:", error);
      toast.error("Gagal mengambil data user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase() !== 'anisreza498@gmail.com' &&
    (user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({ email: '', name: '', role: 'Admin' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: AllowedUser) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      toast.error('Email tidak boleh kosong');
      return;
    }

    setSubmitting(true);
    const normalizedEmail = formData.email.toLowerCase().trim();

    try {
      if (editingUser) {
        // Update existing user
        const docRef = doc(db, 'allowed_users', editingUser.id);
        await updateDoc(docRef, {
          email: normalizedEmail,
          name: formData.name.trim(),
          role: formData.role,
        });
        toast.success('User berhasil diperbarui');
      } else {
        // Check for duplicates
        const exists = users.some(u => u.email.toLowerCase() === normalizedEmail);
        if (exists) {
          toast.error('Email ini sudah terdaftar');
          setSubmitting(false);
          return;
        }

        // Add new user
        await addDoc(collection(db, 'allowed_users'), {
          email: normalizedEmail,
          name: formData.name.trim(),
          role: formData.role,
          createdAt: serverTimestamp()
        });
        toast.success('User baru berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan data user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    const currentUserEmail = auth.currentUser?.email?.toLowerCase();
    if (email.toLowerCase() === 'anisreza498@gmail.com') {
      toast.error('Email super user default tidak dapat dihapus demi keamanan sistem.');
      return;
    }

    if (email.toLowerCase() === currentUserEmail) {
      toast.error('Anda tidak dapat menghapus akun Anda sendiri demi alasan keamanan.');
      return;
    }

    if (!window.confirm(`Apakah Anda yakin ingin menghapus akses untuk ${email}?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'allowed_users', id));
      toast.success('Akses user berhasil dihapus');
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-green-700" />
            Pengaturan User / Hak Akses
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola email akun mana saja yang diperbolehkan masuk ke dalam dashboard administrator ini.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          disabled={!auth.currentUser}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-700 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95"
        >
          <Plus size={18} />
          Tambah User Baru
        </button>
      </div>

      {/* Info Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start text-amber-800">
        <Shield size={20} className="shrink-0 mt-0.5 text-amber-600" />
        <div className="text-xs space-y-1">
          <p className="font-bold">Perhatian Keamanan:</p>
          <p>Hanya pengguna dengan email yang terdaftar di bawah ini yang dapat login melalui form login.</p>
          {!auth.currentUser && (
            <p className="mt-2 p-2 bg-amber-100 rounded text-amber-900 font-medium">
              ⚠️ Anda saat ini menggunakan Mode Akses Instan (Bypass). Fitur tambah/hapus user dimatikan karena Anda tidak terautentikasi ke database. Silakan logout dan login melalui form login untuk menggunakan fitur ini.
            </p>
          )}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-green-700" size={24} />
            <span>Memuat daftar user...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {searchQuery ? 'Tidak ditemukan user yang cocok dengan pencarian.' : 'Belum ada user yang terdaftar.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {filteredUsers.map((user) => {
                  const isCurrent = auth.currentUser?.email?.toLowerCase() === user.email.toLowerCase();
                  return (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                          {user.name || '-'}
                          {isCurrent && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800">
                              Anda
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Mail size={14} className="text-gray-400" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'Super Admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-green-700 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.email)}
                          disabled={isCurrent || user.email.toLowerCase() === 'anisreza498@gmail.com' || !auth.currentUser}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isCurrent || user.email.toLowerCase() === 'anisreza498@gmail.com' || !auth.currentUser
                              ? 'text-gray-300 cursor-not-allowed' 
                              : 'hover:bg-red-50 text-gray-500 hover:text-red-600'
                          }`}
                          title={user.email.toLowerCase() === 'anisreza498@gmail.com' ? "Super User Default (Dilindungi)" : (!auth.currentUser ? "Tidak tersedia dalam Akses Instan" : "Hapus Akses")}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {editingUser ? 'Edit Hak Akses User' : 'Tambah Izin User Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap / Instansi
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bimas Islam, Kepegawaian, Ahmad..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Alamat Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="namauser@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={editingUser?.email.toLowerCase() === 'anisreza498@gmail.com'}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all disabled:bg-gray-100 disabled:text-gray-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Harus berupa email aktif yang akan digunakan pengguna saat mengklik tombol Login.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Peran / Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                >
                  <option value="Admin">Administrator (Akses Penuh)</option>
                  <option value="Editor">Editor (Edit Konten)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !auth.currentUser}
                  className="px-4 py-2 bg-green-700 text-white rounded-xl text-xs font-semibold hover:bg-green-800 transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="animate-spin" size={14} />}
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
